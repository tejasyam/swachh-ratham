from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from .. import models, schemas
from ..auth import get_current_user
from ..database import get_db

router = APIRouter(prefix="/users", tags=["Users"])


@router.get("/{user_id}/objects", response_model=list[schemas.ObjectOut])
def get_user_objects(
    user_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    # Admins can inspect any citizen's objects; citizens can only inspect self.
    if current_user.role != "admin" and current_user.id != user_id:
        raise HTTPException(status_code=403, detail="Insufficient permissions")
    user = db.query(models.User).filter(models.User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return (
        db.query(models.ObjectItem)
        .filter(models.ObjectItem.user_id == user_id)
        .order_by(models.ObjectItem.id.desc())
        .all()
    )
