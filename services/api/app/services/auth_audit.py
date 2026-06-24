from __future__ import annotations

import uuid
from typing import Optional

from sqlalchemy.orm import Session

from app.models.login_event import LoginEvent

EVENT_LOGIN = "login"
EVENT_REGISTER = "register"


def record_auth_event(
    db: Session,
    *,
    email: str,
    event_type: str,
    success: bool,
    user_id: Optional[uuid.UUID] = None,
) -> LoginEvent:
    event = LoginEvent(
        email=email.lower(),
        event_type=event_type,
        success=success,
        user_id=user_id,
    )
    db.add(event)
    db.commit()
    return event
