from datetime import datetime
from typing import Optional

from pydantic import BaseModel, EmailStr


# Pydantic schemas are the request/response shapes exposed by the API.
class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: "UserOut"


class UserBase(BaseModel):
    name: str
    email: Optional[EmailStr] = None
    phone: Optional[str] = None
    role: str = "citizen"


class UserCreate(UserBase):
    password: str


class UserOut(UserBase):
    id: int
    ecopoints: int

    class Config:
        # Allows Pydantic to serialize SQLAlchemy model instances directly.
        from_attributes = True


class LoginRequest(BaseModel):
    identifier: str
    password: str


class OtpVerifyRequest(BaseModel):
    identifier: str
    otp: str


class OtpChallenge(BaseModel):
    identifier: str
    channel: str
    message: str
    dev_otp: Optional[str] = None


class ObjectCreate(BaseModel):
    # Extra condition fields give the rule-based classifier more signals than
    # category/condition alone.
    name: str
    quantity: int = 1
    category: str
    condition: str
    material: Optional[str] = None
    working_condition: Optional[str] = None
    usability: Optional[str] = None
    damage_level: Optional[str] = None
    hazardous: bool = False
    description: Optional[str] = None
    image_url: Optional[str] = None


class ObjectOut(ObjectCreate):
    id: int
    user_id: int
    classification: str
    preferred_action: str
    classification_reason: Optional[str] = None
    classification_confidence: int = 70
    status: str

    class Config:
        from_attributes = True


class PickupRequestCreate(BaseModel):
    object_id: int
    address: str


class BulkPickupRequestCreate(BaseModel):
    object_ids: list[int]
    address: str


class PickupAssign(BaseModel):
    driver_id: int


class PickupStatusUpdate(BaseModel):
    status: str
    note: Optional[str] = None


class PickupOut(BaseModel):
    # Nested object/citizen/driver fields let the mobile app render pickup cards
    # without making extra API calls for each related record.
    id: int
    object_id: int
    user_id: int
    driver_id: Optional[int]
    address: str
    status: str
    ecopoints_awarded: int = 0
    bulk_group_id: Optional[str] = None
    object: Optional[ObjectOut] = None
    citizen: Optional[UserOut] = None
    driver: Optional[UserOut] = None

    class Config:
        from_attributes = True


class TrackingOut(BaseModel):
    id: int
    object_id: int
    status: str
    note: Optional[str]
    created_at: datetime

    class Config:
        from_attributes = True


class AdminStats(BaseModel):
    total_users: int
    total_objects: int
    pending_pickups: int
    completed_pickups: int
    reusable: int
    repairable: int
    recyclable: int
    disposable: int
    total_ecopoints: int


Token.model_rebuild()
