## 2026-06-23 — M0 Scaffold + Docker

**Task:** Monorepo scaffold for ZenTrack (FastAPI + Expo + PostgreSQL + Docker)
**Outcome:** Success (local verification); Docker pending Docker Desktop
**Insight:**
- Local Postgres runs on 5432; Docker Compose maps Postgres to 5433 to avoid port conflicts.
- Alembic `config.set_main_option` requires `%` escaped as `%%` in passwords containing `@` (URL-encoded as `%40`).
- macOS system Python is 3.9 — use `Union` types or run API in Docker (Python 3.12).
**Pitfall:** `docker compose up` fails if Docker Desktop is not running.
**Reuse:**
- Create DB: `CREATE DATABASE zentrack;`
- API tests: `cd services/api && source .venv/bin/activate && pytest`
- Mobile tests: `cd apps/mobile && npm test`
- Health check: `GET /health` → `{"status":"ok","database":true}`

## 2026-06-24 — M1 Authentication

**Task:** JWT auth with users table, API endpoints, mobile login/register/dashboard
**Outcome:** Success (local pytest + jest); Docker verification pending
**Insight:**
- Use `bcrypt` directly instead of `passlib` — passlib 1.7.4 breaks with bcrypt 4.2+ (`__about__` attribute error).
- PyJWT avoids `python-jose[cryptography]` Rust build issues on macOS Python 3.9.
- Pydantic/FastAPI on Python 3.9 require `Optional[X]` not `X | None` in model/dependency annotations.
- SQLite test DB stores naive datetimes — normalize to UTC before comparing reset token expiry.
- JWT logout uses `token_version` on user row (no server-side token store).
**Pitfall:** `GET /health` must use injected `db` session, not global engine, for test overrides to work.
**Reuse:**
- Auth prefix: `/api/v1/auth/*`
- Protected route pattern: `Depends(get_current_user)`
- Mobile token storage: `expo-secure-store` in `apps/mobile/src/auth/storage.ts`
- Recreate broken venv: `rm -rf services/api/.venv && python3 -m venv .venv`

## 2026-06-24 — M2 Focus Timer

**Task:** Focus session lifecycle API + mobile timer UI
**Outcome:** Success
**Insight:**
- Session state machine lives in `app/services/session_service.py`; PATCH accepts `action` field.
- Block duplicate active sessions server-side (409) — client restores in-progress session from `GET /sessions`.
- Mobile countdown accounts for `accumulated_pause_seconds` and `paused_at`.
- Timer screen uses three UI states: picker, live timer, finished summary.
**Reuse:**
- Session endpoints: `/api/v1/sessions`
- Verify in Postgres: `SELECT * FROM focus_sessions ORDER BY started_at DESC;`
