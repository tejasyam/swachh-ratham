from datetime import datetime, timedelta, timezone
import random

from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from jose import JWTError, jwt
from passlib.context import CryptContext
from sqlalchemy.orm import Session

from . import models
from .database import get_db

# JWT settings for the prototype API. In production, SECRET_KEY should come from
# an environment variable and should never be committed to GitHub.
SECRET_KEY = "change-this-local-prototype-secret"
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60 * 24

# Passlib wraps bcrypt so the rest of the app never stores raw passwords.
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/auth/login")


def hash_password(password: str) -> str:
    return pwd_context.hash(password)


def verify_password(password: str, password_hash: str) -> bool:
    return pwd_context.verify(password, password_hash)


def create_access_token(data: dict) -> str:
    # The JWT payload stores the user id in "sub" and expires after one day.
    to_encode = data.copy()
    expire = datetime.now(timezone.utc) + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)


def authenticate_user(db: Session, email: str, password: str):
    user = db.query(models.User).filter(models.User.email == email.lower()).first()
    if not user or not verify_password(password, user.password_hash):
        return None
    return user


def normalize_identifier(identifier: str) -> str:
    # Users can log in with either email or phone, so phone input is normalized
    # by keeping only digits and a possible leading plus sign.
    value = identifier.strip().lower()
    if "@" in value:
        return value
    return "".join(char for char in value if char.isdigit() or char == "+")


def get_user_by_identifier(db: Session, identifier: str):
    value = normalize_identifier(identifier)
    if "@" in value:
        return db.query(models.User).filter(models.User.email == value).first()
    return db.query(models.User).filter(models.User.phone == value).first()


def authenticate_user_by_identifier(db: Session, identifier: str, password: str):
    user = get_user_by_identifier(db, identifier)
    if not user or not verify_password(password, user.password_hash):
        return None
    return user


def generate_otp() -> str:
    return f"{random.randint(100000, 999999)}"


def set_user_otp(user: models.User) -> str:
    # This prototype returns the OTP in the API response for testing. A real app
    # would send it through email/SMS and never expose it to the client directly.
    otp = generate_otp()
    user.otp_code = otp
    user.otp_expires_at = datetime.now(timezone.utc) + timedelta(minutes=10)
    return otp


def otp_channel(identifier: str) -> str:
    return "email" if "@" in normalize_identifier(identifier) else "sms"


def verify_user_otp(user: models.User, otp: str) -> bool:
    # SQLAlchemy may return a naive datetime depending on the database driver,
    # so normalize it before comparing with the timezone-aware current time.
    expires_at = user.otp_expires_at
    if expires_at and expires_at.tzinfo is None:
        expires_at = expires_at.replace(tzinfo=timezone.utc)
    if not user.otp_code or user.otp_code != otp.strip():
        return False
    if not expires_at or expires_at < datetime.now(timezone.utc):
        return False
    user.otp_code = None
    user.otp_expires_at = None
    return True


def get_current_user(
    token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)
) -> models.User:
    # FastAPI injects the Bearer token here; every protected route depends on
    # this helper directly or through require_role().
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        user_id = payload.get("sub")
        if user_id is None:
            raise credentials_exception
    except JWTError as exc:
        raise credentials_exception from exc

    user = db.query(models.User).filter(models.User.id == int(user_id)).first()
    if user is None:
        raise credentials_exception
    return user


def require_role(*roles: str):
    # Reusable dependency for role-based endpoints such as admin-only analytics
    # or citizen-only object creation.
    def checker(current_user: models.User = Depends(get_current_user)):
        if current_user.role not in roles:
            raise HTTPException(status_code=403, detail="Insufficient permissions")
        return current_user

    return checker
