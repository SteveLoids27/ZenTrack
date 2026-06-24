from __future__ import annotations

import uuid
from datetime import datetime
from typing import Optional

from sqlalchemy import DateTime, ForeignKey, Integer, String, Uuid
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base

SESSION_RUNNING = "running"
SESSION_PAUSED = "paused"
SESSION_COMPLETED = "completed"
SESSION_CANCELLED = "cancelled"

VALID_SESSION_STATUSES = {
    SESSION_RUNNING,
    SESSION_PAUSED,
    SESSION_COMPLETED,
    SESSION_CANCELLED,
}


class FocusSession(Base):
    __tablename__ = "focus_sessions"

    id: Mapped[uuid.UUID] = mapped_column(Uuid(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id: Mapped[uuid.UUID] = mapped_column(
        Uuid(as_uuid=True),
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    duration: Mapped[int] = mapped_column(Integer, nullable=False)
    status: Mapped[str] = mapped_column(String(20), nullable=False)
    started_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    ended_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    paused_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    accumulated_pause_seconds: Mapped[int] = mapped_column(Integer, nullable=False, default=0)

    user = relationship("User", back_populates="focus_sessions")
