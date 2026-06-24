from __future__ import annotations

from datetime import datetime
from typing import Optional
from uuid import UUID

from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.database import get_db
from app.dependencies import get_current_user
from app.models.user import User
from app.schemas.session import SessionActionRequest, SessionCreateRequest, SessionResponse
from app.services.session_service import (
    apply_session_action,
    create_session,
    get_user_session,
    list_user_sessions,
)

router = APIRouter(prefix="/sessions", tags=["sessions"])


@router.post("", response_model=SessionResponse, status_code=201)
def start_session(
    payload: SessionCreateRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> SessionResponse:
    session = create_session(db, user_id=current_user.id, duration=payload.duration)
    return SessionResponse.model_validate(session)


@router.patch("/{session_id}", response_model=SessionResponse)
def update_session(
    session_id: UUID,
    payload: SessionActionRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> SessionResponse:
    session = get_user_session(db, user_id=current_user.id, session_id=session_id)
    apply_session_action(session, payload.action)
    db.add(session)
    db.commit()
    db.refresh(session)
    return SessionResponse.model_validate(session)


@router.get("", response_model=list[SessionResponse])
def get_sessions(
    from_date: Optional[datetime] = Query(default=None),
    to_date: Optional[datetime] = Query(default=None),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> list[SessionResponse]:
    sessions = list_user_sessions(db, user_id=current_user.id, from_date=from_date, to_date=to_date)
    return [SessionResponse.model_validate(item) for item in sessions]


@router.get("/{session_id}", response_model=SessionResponse)
def get_session(
    session_id: UUID,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> SessionResponse:
    session = get_user_session(db, user_id=current_user.id, session_id=session_id)
    return SessionResponse.model_validate(session)
