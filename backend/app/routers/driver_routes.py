from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from .. import models, schemas
from ..auth import get_current_user
from ..database import get_db
from .pickup_routes import pickup_query, serialize_pickup

router = APIRouter(prefix="/drivers", tags=["Drivers"])


@router.get("/{driver_id}/pickups", response_model=list[schemas.PickupOut])
def get_driver_pickups(
    driver_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    if current_user.role == "driver":
        driver_id = current_user.id
    pickups = (
        pickup_query(db)
        .filter(models.PickupRequest.driver_id == driver_id)
        .order_by(models.PickupRequest.id.desc())
        .all()
    )
    return [serialize_pickup(p) for p in pickups]
