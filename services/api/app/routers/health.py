from __future__ import annotations

from typing import Union

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.database import check_database_connection, get_db

router = APIRouter(tags=["health"])


@router.get("/health")
def health_check(db: Session = Depends(get_db)) -> dict[str, Union[str, bool]]:
    db_ok = False
    try:
        db_ok = check_database_connection()
    except Exception:
        db_ok = False

    status = "ok" if db_ok else "degraded"
    return {"status": status, "database": db_ok}
