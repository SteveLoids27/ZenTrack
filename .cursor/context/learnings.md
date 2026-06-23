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
