from __future__ import annotations

import uuid
from datetime import datetime, timezone
from typing import Optional

from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.models.focus_session import (
    SESSION_CANCELLED,
    SESSION_COMPLETED,
    SESSION_PAUSED,
    SESSION_RUNNING,
    FocusSession,
)

ACTION_PAUSE = "pause"
ACTION_RESUME = "resume"
ACTION_STOP = "stop"
ACTION_COMPLETE = "complete"


def _utc_now() -> datetime:
    return datetime.now(timezone.utc)


def _normalize(dt: datetime) -> datetime:
    return dt if dt.tzinfo is not None else dt.replace(tzinfo=timezone.utc)


def create_session(db: Session, *, user_id: uuid.UUID, duration: int) -> FocusSession:
    active = (
        db.query(FocusSession)
        .filter(
            FocusSession.user_id == user_id,
            FocusSession.status.in_([SESSION_RUNNING, SESSION_PAUSED]),
        )
        .one_or_none()
    )
    if active is not None:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="An active focus session already exists",
        )

    session = FocusSession(
        user_id=user_id,
        duration=duration,
        status=SESSION_RUNNING,
        started_at=_utc_now(),
    )
    db.add(session)
    db.commit()
    db.refresh(session)
    return session


def get_user_session(db: Session, *, user_id: uuid.UUID, session_id: uuid.UUID) -> FocusSession:
    session = (
        db.query(FocusSession)
        .filter(FocusSession.id == session_id, FocusSession.user_id == user_id)
        .one_or_none()
    )
    if session is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Session not found")
    return session


def apply_session_action(session: FocusSession, action: str) -> None:
    now = _utc_now()

    if action == ACTION_PAUSE:
        if session.status != SESSION_RUNNING:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Only running sessions can be paused")
        session.status = SESSION_PAUSED
        session.paused_at = now
        return

    if action == ACTION_RESUME:
        if session.status != SESSION_PAUSED or session.paused_at is None:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Only paused sessions can be resumed")
        paused_at = _normalize(session.paused_at)
        session.accumulated_pause_seconds += int((now - paused_at).total_seconds())
        session.paused_at = None
        session.status = SESSION_RUNNING
        return

    if action == ACTION_STOP:
        if session.status not in {SESSION_RUNNING, SESSION_PAUSED}:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Session is already finished")
        if session.status == SESSION_PAUSED and session.paused_at is not None:
            paused_at = _normalize(session.paused_at)
            session.accumulated_pause_seconds += int((now - paused_at).total_seconds())
            session.paused_at = None
        session.status = SESSION_CANCELLED
        session.ended_at = now
        return

    if action == ACTION_COMPLETE:
        if session.status not in {SESSION_RUNNING, SESSION_PAUSED}:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Session is already finished")
        if session.status == SESSION_PAUSED and session.paused_at is not None:
            paused_at = _normalize(session.paused_at)
            session.accumulated_pause_seconds += int((now - paused_at).total_seconds())
            session.paused_at = None
        session.status = SESSION_COMPLETED
        session.ended_at = now
        return

    raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid session action")


def list_user_sessions(
    db: Session,
    *,
    user_id: uuid.UUID,
    from_date: Optional[datetime] = None,
    to_date: Optional[datetime] = None,
) -> list[FocusSession]:
    query = db.query(FocusSession).filter(FocusSession.user_id == user_id)
    if from_date is not None:
        query = query.filter(FocusSession.started_at >= from_date)
    if to_date is not None:
        query = query.filter(FocusSession.started_at <= to_date)
    return query.order_by(FocusSession.started_at.desc()).all()
