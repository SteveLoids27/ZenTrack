from __future__ import annotations

import secrets
import uuid
from datetime import datetime, timedelta, timezone
from typing import Optional

import bcrypt
import jwt
from jwt import InvalidTokenError
from sqlalchemy.orm import Session

from app.config import settings
from app.models.user import User


def hash_password(password: str) -> str:
    hashed = bcrypt.hashpw(password.encode("utf-8"), bcrypt.gensalt())
    return hashed.decode("utf-8")


def verify_password(plain_password: str, password_hash: str) -> bool:
    return bcrypt.checkpw(plain_password.encode("utf-8"), password_hash.encode("utf-8"))


def create_access_token(*, user_id: uuid.UUID, token_version: int) -> str:
    expire = datetime.now(timezone.utc) + timedelta(minutes=settings.jwt_expire_minutes)
    payload = {
        "sub": str(user_id),
        "tv": token_version,
        "exp": expire,
    }
    return jwt.encode(payload, settings.jwt_secret_key, algorithm=settings.jwt_algorithm)


def decode_access_token(token: str) -> dict:
    return jwt.decode(token, settings.jwt_secret_key, algorithms=[settings.jwt_algorithm])


def get_user_from_token(db: Session, token: str) -> Optional[User]:
    try:
        payload = decode_access_token(token)
        user_id = uuid.UUID(payload["sub"])
        token_version = int(payload["tv"])
    except (InvalidTokenError, ValueError, KeyError, TypeError):
        return None

    user = db.get(User, user_id)
    if user is None or user.token_version != token_version:
        return None
    return user


def generate_password_reset_token() -> str:
    return secrets.token_urlsafe(32)


def password_reset_expiry() -> datetime:
    return datetime.now(timezone.utc) + timedelta(hours=1)
