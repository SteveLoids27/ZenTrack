from __future__ import annotations

import uuid
from datetime import datetime
from typing import Literal, Optional

from pydantic import BaseModel, ConfigDict, Field

SessionAction = Literal["pause", "resume", "stop", "complete"]
SessionStatus = Literal["running", "paused", "completed", "cancelled"]


class SessionCreateRequest(BaseModel):
    duration: int = Field(ge=1, le=480)


class SessionActionRequest(BaseModel):
    action: SessionAction


class SessionResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    user_id: uuid.UUID
    duration: int
    status: SessionStatus
    started_at: datetime
    ended_at: Optional[datetime] = None
    paused_at: Optional[datetime] = None
    accumulated_pause_seconds: int
