from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from .. import models, schemas
from ..auth import get_current_user, require_role
from ..database import get_db
from ..services import add_tracking, classify_object

router = APIRouter(prefix="/objects", tags=["Objects"])


@router.post("", response_model=schemas.ObjectOut)
def create_object(
    payload: schemas.ObjectCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(require_role("citizen")),
):
    classification, preferred_action, reason, confidence = classify_object(
        payload.category,
        payload.condition,
        payload.material,
        payload.working_condition,
        payload.usability,
        payload.damage_level,
        payload.hazardous,
        payload.description,
    )
    item = models.ObjectItem(
        user_id=current_user.id,
        name=payload.name,
        quantity=max(1, payload.quantity),
        category=payload.category,
        condition=payload.condition,
        material=payload.material,
        working_condition=payload.working_condition,
        usability=payload.usability,
        damage_level=payload.damage_level,
        hazardous=payload.hazardous,
        description=payload.description,
        image_url=payload.image_url,
        classification=classification,
        preferred_action=preferred_action,
        classification_reason=reason,
        classification_confidence=confidence,
        status="Classified",
    )
    db.add(item)
    db.commit()
    db.refresh(item)
    add_tracking(db, item.id, "Classified", f"Classified as {classification}")
    db.commit()
    return item


@router.get("", response_model=list[schemas.ObjectOut])
def get_objects(
    db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)
):
    if current_user.role == "admin":
        return db.query(models.ObjectItem).order_by(models.ObjectItem.id.desc()).all()
    return (
        db.query(models.ObjectItem)
        .filter(models.ObjectItem.user_id == current_user.id)
        .order_by(models.ObjectItem.id.desc())
        .all()
    )


@router.get("/{object_id}", response_model=schemas.ObjectOut)
def get_object(
    object_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    item = db.query(models.ObjectItem).filter(models.ObjectItem.id == object_id).first()
    if not item:
        raise HTTPException(status_code=404, detail="Object not found")
    if current_user.role != "admin" and item.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Insufficient permissions")
    return item


@router.put("/{object_id}", response_model=schemas.ObjectOut)
def update_object(
    object_id: int,
    payload: schemas.ObjectCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(require_role("citizen")),
):
    item = db.query(models.ObjectItem).filter(models.ObjectItem.id == object_id).first()
    if not item or item.user_id != current_user.id:
        raise HTTPException(status_code=404, detail="Object not found")
    if item.pickup_request:
        raise HTTPException(status_code=400, detail="Cannot edit an object after pickup is requested")

    classification, preferred_action, reason, confidence = classify_object(
        payload.category,
        payload.condition,
        payload.material,
        payload.working_condition,
        payload.usability,
        payload.damage_level,
        payload.hazardous,
        payload.description,
    )
    item.name = payload.name
    item.quantity = max(1, payload.quantity)
    item.category = payload.category
    item.condition = payload.condition
    item.material = payload.material
    item.working_condition = payload.working_condition
    item.usability = payload.usability
    item.damage_level = payload.damage_level
    item.hazardous = payload.hazardous
    item.description = payload.description
    item.image_url = payload.image_url
    item.classification = classification
    item.preferred_action = preferred_action
    item.classification_reason = reason
    item.classification_confidence = confidence
    item.status = "Classified"
    add_tracking(db, item.id, "Updated", f"Updated and classified as {classification}")
    db.commit()
    db.refresh(item)
    return item
