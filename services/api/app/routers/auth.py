from __future__ import annotations

from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.database import get_db
from app.dependencies import get_current_user
from app.models.login_event import LoginEvent
from app.models.user import User
from app.services.auth_audit import EVENT_LOGIN, EVENT_REGISTER, record_auth_event
from app.schemas.auth import (
    AuthResponse,
    LoginRequest,
    LogoutResponse,
    PasswordResetPayload,
    PasswordResetResponse,
    RegisterRequest,
    UserResponse,
)
from app.security import (
    create_access_token,
    generate_password_reset_token,
    hash_password,
    password_reset_expiry,
    verify_password,
)

router = APIRouter(prefix="/auth", tags=["auth"])


def _is_reset_token_expired(expires_at: datetime | None) -> bool:
    if expires_at is None:
        return True
    normalized = expires_at if expires_at.tzinfo is not None else expires_at.replace(tzinfo=timezone.utc)
    return normalized < datetime.now(timezone.utc)


def _auth_response(user: User) -> AuthResponse:
    token = create_access_token(user_id=user.id, token_version=user.token_version)
    return AuthResponse(access_token=token, user=UserResponse.model_validate(user))


@router.post("/register", response_model=AuthResponse, status_code=status.HTTP_201_CREATED)
def register(payload: RegisterRequest, db: Session = Depends(get_db)) -> AuthResponse:
    user = User(
        name=payload.name,
        email=payload.email.lower(),
        password_hash=hash_password(payload.password),
    )
    db.add(user)
    try:
        db.commit()
    except IntegrityError:
        db.rollback()
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Email already registered")
    db.refresh(user)
    record_auth_event(
        db,
        email=user.email,
        event_type=EVENT_REGISTER,
        success=True,
        user_id=user.id,
    )
    return _auth_response(user)


@router.post("/login", response_model=AuthResponse)
def login(payload: LoginRequest, db: Session = Depends(get_db)) -> AuthResponse:
    email = payload.email.lower()
    user = db.query(User).filter(User.email == email).one_or_none()

    if user is None:
        record_auth_event(db, email=email, event_type=EVENT_LOGIN, success=False)
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid email or password")

    if not verify_password(payload.password, user.password_hash):
        record_auth_event(db, email=email, event_type=EVENT_LOGIN, success=False, user_id=user.id)
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid email or password")

    record_auth_event(db, email=email, event_type=EVENT_LOGIN, success=True, user_id=user.id)
    return _auth_response(user)


@router.post("/logout", response_model=LogoutResponse)
def logout(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> LogoutResponse:
    current_user.token_version += 1
    db.add(current_user)
    db.commit()
    return LogoutResponse(message="Logged out successfully")


@router.post("/reset-password", response_model=PasswordResetResponse)
def reset_password(payload: PasswordResetPayload, db: Session = Depends(get_db)) -> PasswordResetResponse:
    if payload.token and payload.new_password:
        user = db.query(User).filter(User.password_reset_token == payload.token).one_or_none()
        if user is None:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid reset token")

        expires_at = user.password_reset_expires_at
        if _is_reset_token_expired(expires_at):
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Reset token has expired")

        user.password_hash = hash_password(payload.new_password)
        user.password_reset_token = None
        user.password_reset_expires_at = None
        user.token_version += 1
        db.add(user)
        db.commit()
        return PasswordResetResponse(message="Password reset successfully")

    if payload.email:
        user = db.query(User).filter(User.email == payload.email.lower()).one_or_none()
        if user is None:
            return PasswordResetResponse(message="If that email exists, a reset link has been sent")

        reset_token = generate_password_reset_token()
        user.password_reset_token = reset_token
        user.password_reset_expires_at = password_reset_expiry()
        db.add(user)
        db.commit()

        # SMTP is not wired for MVP; return token in response for local/dev verification.
        return PasswordResetResponse(
            message="Password reset token generated (email delivery not configured)",
            reset_token=reset_token,
        )

    raise HTTPException(
        status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
        detail="Provide either email or token and new_password",
    )
