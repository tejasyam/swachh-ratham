from sqlalchemy import inspect, text
from sqlalchemy.orm import Session

from . import models
from .auth import hash_password
from .database import engine


# Shared backend business logic lives here so routes stay mostly focused on
# permissions, request validation, and database persistence.
def _clean(value: str | None) -> str:
    return (value or "").strip().lower()


def classify_object(
    category: str,
    condition: str,
    material: str | None = None,
    working_condition: str | None = None,
    usability: str | None = None,
    damage_level: str | None = None,
    hazardous: bool = False,
    description: str | None = None,
) -> tuple[str, str, str, int]:
    # Rule-based classifier: each signal adds points to one of the circular
    # economy outcomes, then the highest score becomes the final classification.
    category_value = _clean(category)
    condition_value = _clean(condition)
    material_value = _clean(material)
    working_value = _clean(working_condition)
    usability_value = _clean(usability)
    damage_value = _clean(damage_level)
    description_value = _clean(description)

    reusable_categories = {"furniture", "books", "clothes", "toys"}
    recyclable_materials = {"plastic", "paper", "metal", "glass", "cardboard"}
    repairable_categories = {"electronics", "appliances"}
    text_blob = " ".join([category_value, condition_value, material_value, working_value, usability_value, damage_value, description_value])

    scores = {
        "Reusable": 0,
        "Repairable": 0,
        "Recyclable": 0,
        "Disposable": 0,
    }
    reasons: dict[str, list[str]] = {key: [] for key in scores}

    def add(label: str, points: int, reason: str):
        # Store both score and human-readable explanation for the chosen result.
        scores[label] += points
        reasons[label].append(reason)

    if hazardous:
        add("Disposable", 8, "it is marked hazardous or unsafe")
    if damage_value in {"severe", "severely damaged", "unsafe"} or "severe" in text_blob:
        add("Disposable", 6, "it has severe damage")
    if "dirty" in text_blob or "contaminated" in text_blob or "soiled" in text_blob:
        add("Disposable", 4, "it may be dirty or contaminated")

    if usability_value in {"yes", "usable as-is", "can be used"}:
        add("Reusable", 5, "it can be used as-is")
    if condition_value in {"good", "excellent", "usable"} or damage_value in {"none", "minor"}:
        add("Reusable", 3, "it is in usable condition")
    if category_value in reusable_categories:
        add("Reusable", 2, "its category is commonly reusable")

    if category_value in repairable_categories:
        add("Repairable", 3, "electronics and appliances can often be repaired")
    if working_value in {"partially working", "not working"}:
        add("Repairable", 4, "its working state suggests repair may be possible")
    if "broken" in text_blob and damage_value not in {"severe", "severely damaged", "unsafe"}:
        add("Repairable", 3, "it is broken but not marked unsafe")

    if material_value in recyclable_materials or category_value in recyclable_materials:
        add("Recyclable", 5, "its main material is recyclable")
    if usability_value in {"no", "not usable"} and material_value in recyclable_materials:
        add("Recyclable", 2, "it is not reusable but has recyclable material")

    if all(score == 0 for score in scores.values()):
        add("Reusable", 1, "no disposal risk was found")

    classification = max(scores, key=scores.get)
    sorted_scores = sorted(scores.values(), reverse=True)
    confidence = min(95, 55 + max(0, sorted_scores[0] - sorted_scores[1]) * 8)
    actions = {
        "Reusable": "Donate, resell, or route to community reuse",
        "Repairable": "Send to repair partner for inspection",
        "Recyclable": "Send to recycler after basic cleaning",
        "Disposable": "Dispose safely through approved handling",
    }
    reason = f"Classified as {classification} because " + "; ".join(reasons[classification][:3]) + "."
    return classification, actions[classification], reason, confidence


def calculate_ecopoints(item: models.ObjectItem) -> tuple[int, str]:
    # EcoPoints are based on item type, quantity, condition, and final action.
    # The min/max clamp keeps prototype rewards predictable.
    category_value = _clean(item.category)
    material_value = _clean(item.material)
    condition_value = _clean(item.condition)
    damage_value = _clean(item.damage_level)
    classification = item.classification or "Reusable"
    quantity = max(1, min(item.quantity or 1, 50))
    text_blob = " ".join([item.name or "", category_value, material_value]).lower()

    item_scores = {
        "furniture": 30,
        "electronics": 35,
        "appliances": 40,
        "books": 8,
        "clothes": 10,
        "toys": 12,
        "plastic": 5,
        "paper": 4,
        "metal": 12,
        "glass": 6,
    }
    if "chair" in text_blob or "table" in text_blob or "sofa" in text_blob:
        base_score = 30
    else:
        base_score = item_scores.get(category_value) or item_scores.get(material_value) or 10

    if item.hazardous or damage_value in {"severe", "unsafe"}:
        condition_multiplier = 0.3
    elif condition_value in {"excellent", "good", "usable"} or damage_value in {"none", "minor"}:
        condition_multiplier = 1.2
    elif damage_value == "broken" or "broken" in condition_value:
        condition_multiplier = 0.8
    else:
        condition_multiplier = 1.0

    action_multipliers = {
        "Reusable": 1.5,
        "Repairable": 1.3,
        "Recyclable": 1.0,
        "Disposable": 0.4,
    }
    action_multiplier = action_multipliers.get(classification, 1.0)
    raw_points = base_score * quantity * condition_multiplier * action_multiplier
    points = max(5, min(round(raw_points), 500))
    reason = (
        f"{points} EcoPoints = {base_score} item score x {quantity} quantity x "
        f"{condition_multiplier:g} condition x {action_multiplier:g} {classification.lower()} action"
    )
    return points, reason


def migrate_object_columns():
    # Lightweight migrations keep older local/Supabase tables compatible as the
    # prototype schema evolves without requiring Alembic.
    inspector = inspect(engine)
    existing = {column["name"] for column in inspector.get_columns("objects")}
    columns = {
        "quantity": "INTEGER NOT NULL DEFAULT 1",
        "material": "VARCHAR",
        "working_condition": "VARCHAR",
        "usability": "VARCHAR",
        "damage_level": "VARCHAR",
        "hazardous": "BOOLEAN NOT NULL DEFAULT FALSE",
        "classification_reason": "TEXT",
        "classification_confidence": "INTEGER NOT NULL DEFAULT 70",
    }
    with engine.begin() as connection:
        for name, definition in columns.items():
            if name not in existing:
                connection.execute(text(f"ALTER TABLE objects ADD COLUMN {name} {definition}"))


def migrate_pickup_columns():
    # Adds pickup reward/grouping fields if an existing DB was created earlier.
    inspector = inspect(engine)
    existing = {column["name"] for column in inspector.get_columns("pickup_requests")}
    columns = {
        "ecopoints_awarded": "INTEGER NOT NULL DEFAULT 0",
        "bulk_group_id": "VARCHAR",
    }
    with engine.begin() as connection:
        for name, definition in columns.items():
            if name not in existing:
                connection.execute(text(f"ALTER TABLE pickup_requests ADD COLUMN {name} {definition}"))


def migrate_user_columns():
    # Adds phone and OTP columns for the newer phone/email login flow.
    inspector = inspect(engine)
    existing = {column["name"] for column in inspector.get_columns("users")}
    columns = {
        "phone": "VARCHAR",
        "otp_code": "VARCHAR",
        "otp_expires_at": "TIMESTAMP",
    }
    with engine.begin() as connection:
        for name, definition in columns.items():
            if name not in existing:
                connection.execute(text(f"ALTER TABLE users ADD COLUMN {name} {definition}"))
        try:
            connection.execute(text("ALTER TABLE users ALTER COLUMN email DROP NOT NULL"))
        except Exception:
            pass


def add_tracking(db: Session, object_id: int, status: str, note: str | None = None):
    # Central helper so every status-changing route records a timeline event.
    tracking = models.ItemTracking(object_id=object_id, status=status, note=note)
    db.add(tracking)
    return tracking


def seed_database(db: Session):
    # Demo users make it possible to run the prototype immediately after setup.
    seeds = [
        ("Admin", "admin@swachhratham.com", "admin123", "admin", 0),
        ("Citizen", "citizen@swachhratham.com", "citizen123", "citizen", 120),
        ("Driver", "driver@swachhratham.com", "driver123", "driver", 0),
    ]
    for name, email, password, role, ecopoints in seeds:
        existing = db.query(models.User).filter(models.User.email == email).first()
        if existing:
            continue
        db.add(
            models.User(
                name=name,
                email=email,
                password_hash=hash_password(password),
                role=role,
                ecopoints=ecopoints,
            )
        )
    db.commit()
