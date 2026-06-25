from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from .. import models, schemas
from ..auth import (
    authenticate_user_by_identifier,
    create_access_token,
    get_current_user,
    get_user_by_identifier,
    hash_password,
    normalize_identifier,
    otp_channel,
    set_user_otp,
    verify_user_otp,
)
from ..database import get_db

router = APIRouter(prefix="/auth", tags=["Authentication"])


def otp_response(identifier: str, otp: str):
    channel = otp_channel(identifier)
    target = "email" if channel == "email" else "SMS"
    return {
        "identifier": normalize_identifier(identifier),
        "channel": channel,
        "message": f"OTP sent to your {target}.",
        "dev_otp": otp,
    }


@router.post("/register", response_model=schemas.OtpChallenge)
def register(payload: schemas.UserCreate, db: Session = Depends(get_db)):
    email = payload.email.lower() if payload.email else None
    phone = normalize_identifier(payload.phone or "") if payload.phone else None
    if not email and not phone:
        raise HTTPException(status_code=400, detail="Enter an email or phone number")
    if email and db.query(models.User).filter(models.User.email == email).first():
        raise HTTPException(status_code=400, detail="Email already registered")
    if phone and db.query(models.User).filter(models.User.phone == phone).first():
        raise HTTPException(status_code=400, detail="Phone already registered")
    if payload.role not in {"citizen", "admin", "driver"}:
        raise HTTPException(status_code=400, detail="Invalid role")

    user = models.User(
        name=payload.name,
        email=email,
        phone=phone,
        password_hash=hash_password(payload.password),
        role=payload.role,
    )
    otp = set_user_otp(user)
    db.add(user)
    db.commit()
    db.refresh(user)
    return otp_response(email or phone or "", otp)


@router.post("/login", response_model=schemas.Token)
def login(payload: schemas.LoginRequest, db: Session = Depends(get_db)):
    user = authenticate_user_by_identifier(db, payload.identifier, payload.password)
    if not user:
        raise HTTPException(status_code=401, detail="Invalid email/phone or password")
    token = create_access_token({"sub": str(user.id), "role": user.role})
    return {"access_token": token, "token_type": "bearer", "user": user}


@router.post("/verify-otp", response_model=schemas.Token)
def verify_otp(payload: schemas.OtpVerifyRequest, db: Session = Depends(get_db)):
    user = get_user_by_identifier(db, payload.identifier)
    if not user or not verify_user_otp(user, payload.otp):
        raise HTTPException(status_code=401, detail="Invalid or expired OTP")
    token = create_access_token({"sub": str(user.id), "role": user.role})
    db.commit()
    return {"access_token": token, "token_type": "bearer", "user": user}


@router.get("/me", response_model=schemas.UserOut)
def me(current_user: models.User = Depends(get_current_user)):
    return current_user
