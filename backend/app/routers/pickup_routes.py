from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session, joinedload
from uuid import uuid4

from .. import models, schemas
from ..auth import get_current_user, require_role
from ..database import get_db
from ..services import add_tracking, calculate_ecopoints

router = APIRouter(prefix="/pickups", tags=["Pickups"])


def pickup_query(db: Session):
    return db.query(models.PickupRequest).options(
        joinedload(models.PickupRequest.object_item),
        joinedload(models.PickupRequest.citizen),
        joinedload(models.PickupRequest.driver),
    )


def serialize_pickup(pickup: models.PickupRequest):
    return {
        "id": pickup.id,
        "object_id": pickup.object_id,
        "user_id": pickup.user_id,
        "driver_id": pickup.driver_id,
        "address": pickup.address,
        "status": pickup.status,
        "ecopoints_awarded": pickup.ecopoints_awarded,
        "bulk_group_id": pickup.bulk_group_id,
        "object": pickup.object_item,
        "citizen": pickup.citizen,
        "driver": pickup.driver,
    }


@router.post("/request", response_model=schemas.PickupOut)
def request_pickup(
    payload: schemas.PickupRequestCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(require_role("citizen")),
):
    item = db.query(models.ObjectItem).filter(models.ObjectItem.id == payload.object_id).first()
    if not item or item.user_id != current_user.id:
        raise HTTPException(status_code=404, detail="Object not found")
    existing = (
        db.query(models.PickupRequest)
        .filter(models.PickupRequest.object_id == payload.object_id)
        .first()
    )
    if existing:
        raise HTTPException(status_code=400, detail="Pickup already requested")

    pickup = models.PickupRequest(
        object_id=item.id, user_id=current_user.id, address=payload.address, status="Pending"
    )
    item.status = "Pickup Requested"
    db.add(pickup)
    add_tracking(db, item.id, "Pickup Requested", "Citizen requested pickup")
    db.commit()
    db.refresh(pickup)
    pickup = pickup_query(db).filter(models.PickupRequest.id == pickup.id).first()
    return serialize_pickup(pickup)


@router.post("/request-bulk", response_model=list[schemas.PickupOut])
def request_bulk_pickup(
    payload: schemas.BulkPickupRequestCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(require_role("citizen")),
):
    object_ids = list(dict.fromkeys(payload.object_ids))
    if not object_ids:
        raise HTTPException(status_code=400, detail="Add at least one object to the cart")

    items = (
        db.query(models.ObjectItem)
        .filter(
            models.ObjectItem.id.in_(object_ids),
            models.ObjectItem.user_id == current_user.id,
        )
        .all()
    )
    if len(items) != len(object_ids):
        raise HTTPException(status_code=404, detail="One or more objects were not found")

    existing_ids = {
        row.object_id
        for row in db.query(models.PickupRequest)
        .filter(models.PickupRequest.object_id.in_(object_ids))
        .all()
    }
    if existing_ids:
        raise HTTPException(status_code=400, detail="Pickup already requested for one or more cart objects")

    pickups = []
    bulk_group_id = f"bulk-{uuid4().hex}"
    for item in items:
        pickup = models.PickupRequest(
            object_id=item.id,
            user_id=current_user.id,
            address=payload.address,
            status="Pending",
            bulk_group_id=bulk_group_id,
        )
        item.status = "Bulk Pickup Requested"
        db.add(pickup)
        add_tracking(db, item.id, "Bulk Pickup Requested", "Citizen requested bulk pickup")
        pickups.append(pickup)

    db.commit()
    pickup_ids = [pickup.id for pickup in pickups]
    saved_pickups = (
        pickup_query(db)
        .filter(models.PickupRequest.id.in_(pickup_ids))
        .order_by(models.PickupRequest.id.desc())
        .all()
    )
    return [serialize_pickup(pickup) for pickup in saved_pickups]


@router.get("", response_model=list[schemas.PickupOut])
def get_pickups(
    db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)
):
    query = pickup_query(db).order_by(models.PickupRequest.id.desc())
    if current_user.role == "admin":
        pickups = query.all()
    elif current_user.role == "driver":
        pickups = query.filter(models.PickupRequest.driver_id == current_user.id).all()
    else:
        pickups = query.filter(models.PickupRequest.user_id == current_user.id).all()
    return [serialize_pickup(p) for p in pickups]


@router.put("/{pickup_id}/assign", response_model=schemas.PickupOut)
def assign_driver(
    pickup_id: int,
    payload: schemas.PickupAssign,
    db: Session = Depends(get_db),
    _: models.User = Depends(require_role("admin")),
):
    pickup = db.query(models.PickupRequest).filter(models.PickupRequest.id == pickup_id).first()
    if not pickup:
        raise HTTPException(status_code=404, detail="Pickup not found")
    driver = (
        db.query(models.User)
        .filter(models.User.id == payload.driver_id, models.User.role == "driver")
        .first()
    )
    if not driver:
        raise HTTPException(status_code=404, detail="Driver not found")

    pickup.driver_id = driver.id
    pickup.status = "Assigned"
    pickup.object_item.status = "Driver Assigned"
    add_tracking(db, pickup.object_id, "Driver Assigned", f"Assigned to {driver.name}")
    db.commit()
    pickup = pickup_query(db).filter(models.PickupRequest.id == pickup_id).first()
    return serialize_pickup(pickup)


@router.put("/bulk/{bulk_group_id}/assign", response_model=list[schemas.PickupOut])
def assign_bulk_driver(
    bulk_group_id: str,
    payload: schemas.PickupAssign,
    db: Session = Depends(get_db),
    _: models.User = Depends(require_role("admin")),
):
    driver = (
        db.query(models.User)
        .filter(models.User.id == payload.driver_id, models.User.role == "driver")
        .first()
    )
    if not driver:
        raise HTTPException(status_code=404, detail="Driver not found")

    pickups = (
        db.query(models.PickupRequest)
        .filter(models.PickupRequest.bulk_group_id == bulk_group_id)
        .all()
    )
    if not pickups:
        raise HTTPException(status_code=404, detail="Bulk pickup group not found")

    for pickup in pickups:
        pickup.driver_id = driver.id
        pickup.status = "Assigned"
        pickup.object_item.status = "Driver Assigned"
        add_tracking(db, pickup.object_id, "Driver Assigned", f"Bulk group assigned to {driver.name}")

    db.commit()
    saved_pickups = (
        pickup_query(db)
        .filter(models.PickupRequest.bulk_group_id == bulk_group_id)
        .order_by(models.PickupRequest.id.desc())
        .all()
    )
    return [serialize_pickup(pickup) for pickup in saved_pickups]


@router.put("/{pickup_id}/status", response_model=schemas.PickupOut)
def update_pickup_status(
    pickup_id: int,
    payload: schemas.PickupStatusUpdate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    allowed = {"Accepted", "On the way", "Collected", "Delivered", "Completed", "Cancelled"}
    if payload.status not in allowed:
        raise HTTPException(status_code=400, detail="Invalid status")

    pickup = db.query(models.PickupRequest).filter(models.PickupRequest.id == pickup_id).first()
    if not pickup:
        raise HTTPException(status_code=404, detail="Pickup not found")
    if current_user.role == "driver" and pickup.driver_id != current_user.id:
        raise HTTPException(status_code=403, detail="Pickup is not assigned to this driver")
    if current_user.role == "citizen":
        raise HTTPException(status_code=403, detail="Citizens cannot update pickup status")

    already_rewarded = (
        db.query(models.ItemTracking)
        .filter(
            models.ItemTracking.object_id == pickup.object_id,
            models.ItemTracking.status == "Collected",
        )
        .first()
        is not None
    )
    pickup.status = payload.status
    pickup.object_item.status = payload.status
    add_tracking(db, pickup.object_id, payload.status, payload.note)
    if payload.status == "Collected" and not already_rewarded:
        points, reason = calculate_ecopoints(pickup.object_item)
        pickup.ecopoints_awarded = points
        pickup.citizen.ecopoints += points
        add_tracking(db, pickup.object_id, "EcoPoints Awarded", reason)
    db.commit()
    pickup = pickup_query(db).filter(models.PickupRequest.id == pickup_id).first()
    return serialize_pickup(pickup)
