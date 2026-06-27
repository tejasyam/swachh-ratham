from fastapi import APIRouter, Depends
from sqlalchemy import func
from sqlalchemy.orm import Session

from .. import models, schemas
from ..auth import require_role
from ..database import get_db

router = APIRouter(prefix="/admin", tags=["Admin"])


@router.get("/stats", response_model=schemas.AdminStats)
def stats(
    db: Session = Depends(get_db),
    _: models.User = Depends(require_role("admin")),
):
    # Dashboard counters are calculated live from the database for the prototype.
    total_users = db.query(models.User).count()
    total_objects = db.query(models.ObjectItem).count()
    pending_pickups = (
        db.query(models.PickupRequest)
        .filter(models.PickupRequest.status.in_(["Pending", "Assigned", "Accepted", "On the way"]))
        .count()
    )
    completed_pickups = (
        db.query(models.PickupRequest)
        .filter(models.PickupRequest.status.in_(["Collected", "Delivered", "Completed"]))
        .count()
    )
    counts = dict(
        db.query(models.ObjectItem.classification, func.count(models.ObjectItem.id))
        .group_by(models.ObjectItem.classification)
        .all()
    )
    total_ecopoints = db.query(func.coalesce(func.sum(models.User.ecopoints), 0)).scalar()
    return {
        "total_users": total_users,
        "total_objects": total_objects,
        "pending_pickups": pending_pickups,
        "completed_pickups": completed_pickups,
        "reusable": counts.get("Reusable", 0),
        "repairable": counts.get("Repairable", 0),
        "recyclable": counts.get("Recyclable", 0),
        "disposable": counts.get("Disposable", 0),
        "total_ecopoints": total_ecopoints,
    }
