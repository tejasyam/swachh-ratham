from datetime import datetime

from sqlalchemy import Boolean, Column, DateTime, ForeignKey, Integer, String, Text
from sqlalchemy.orm import relationship

from .database import Base


# SQLAlchemy models define the actual database tables and relationships.
class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    email = Column(String, unique=True, index=True, nullable=True)
    phone = Column(String, unique=True, index=True, nullable=True)
    password_hash = Column(String, nullable=False)
    role = Column(String, nullable=False, default="citizen")
    ecopoints = Column(Integer, nullable=False, default=0)
    otp_code = Column(String, nullable=True)
    otp_expires_at = Column(DateTime, nullable=True)

    # A citizen owns objects and pickup requests; admins/drivers use the same
    # users table but are separated by the role field.
    objects = relationship("ObjectItem", back_populates="owner")
    pickup_requests = relationship(
        "PickupRequest", back_populates="citizen", foreign_keys="PickupRequest.user_id"
    )


class ObjectItem(Base):
    __tablename__ = "objects"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    name = Column(String, nullable=False)
    quantity = Column(Integer, nullable=False, default=1)
    category = Column(String, nullable=False)
    condition = Column(String, nullable=False)
    material = Column(String, nullable=True)
    working_condition = Column(String, nullable=True)
    usability = Column(String, nullable=True)
    damage_level = Column(String, nullable=True)
    hazardous = Column(Boolean, nullable=False, default=False)
    description = Column(Text, nullable=True)
    image_url = Column(String, nullable=True)
    classification = Column(String, nullable=False)
    preferred_action = Column(String, nullable=False)
    classification_reason = Column(Text, nullable=True)
    classification_confidence = Column(Integer, nullable=False, default=70)
    status = Column(String, nullable=False, default="Uploaded")

    # Each object can have one pickup request and many tracking timeline events.
    owner = relationship("User", back_populates="objects")
    pickup_request = relationship("PickupRequest", back_populates="object_item", uselist=False)
    tracking = relationship("ItemTracking", back_populates="object_item")


class PickupRequest(Base):
    __tablename__ = "pickup_requests"

    id = Column(Integer, primary_key=True, index=True)
    object_id = Column(Integer, ForeignKey("objects.id"), nullable=False)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    driver_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    address = Column(Text, nullable=False)
    status = Column(String, nullable=False, default="Pending")
    ecopoints_awarded = Column(Integer, nullable=False, default=0)
    bulk_group_id = Column(String, nullable=True, index=True)

    # The request joins one object, its citizen, and an optional assigned driver.
    object_item = relationship("ObjectItem", back_populates="pickup_request")
    citizen = relationship("User", foreign_keys=[user_id], back_populates="pickup_requests")
    driver = relationship("User", foreign_keys=[driver_id])


class ItemTracking(Base):
    __tablename__ = "item_tracking"

    id = Column(Integer, primary_key=True, index=True)
    object_id = Column(Integer, ForeignKey("objects.id"), nullable=False)
    status = Column(String, nullable=False)
    note = Column(Text, nullable=True)
    created_at = Column(DateTime, nullable=False, default=datetime.utcnow)

    # Tracking rows preserve a lightweight audit trail for status changes.
    object_item = relationship("ObjectItem", back_populates="tracking")
