# Digital Detox Timer — Application Context

> Stable knowledge for all agents. Update when architecture or conventions change.

## Purpose

Habit-building mobile app that helps users improve focus and reduce digital distractions through timed focus sessions, streaks, analytics, reflections, and gamification — without punitive restriction.

**Product principle:** Make focus rewarding, not restriction painful.

## Stack

| Layer | Choice |
|-------|--------|
| Mobile | React Native + Expo + TypeScript |
| API | Python + FastAPI |
| Database | PostgreSQL |
| Auth | JWT (bcrypt password hashing) |

## Architecture

```
Mobile (Expo)  --REST/JWT-->  FastAPI API  -->  PostgreSQL
```

### Target layout

- `apps/mobile/` — Expo React Native client
- `services/api/` — FastAPI backend, Alembic migrations, tests
- `docker-compose.yml` — local PostgreSQL
- `docs/DIGITAL_DETOX_TIMER_SPEC.md` — full product spec

## Core Domain Entities

- **User** — auth, settings (target minutes, timezone), `token_version` for JWT invalidation
- **FocusSession** — timed session with status lifecycle (M2)
- **Streak** — current/longest consecutive days with completed session (M3)

## API (M1–M2)

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/api/v1/auth/register` | No | Create account, returns JWT |
| POST | `/api/v1/auth/login` | No | Authenticate, returns JWT |
| POST | `/api/v1/auth/logout` | Bearer | Invalidate token via `token_version` bump |
| POST | `/api/v1/auth/reset-password` | No | Request reset (`email`) or complete (`token` + `new_password`) |
| GET | `/api/v1/users/me` | Bearer | Current user profile |
| POST | `/api/v1/sessions` | Bearer | Start focus session (`duration` minutes) |
| PATCH | `/api/v1/sessions/{id}` | Bearer | `pause`, `resume`, `stop`, `complete` |
| GET | `/api/v1/sessions` | Bearer | List sessions (optional date filters) |
| GET | `/api/v1/sessions/{id}` | Bearer | Session detail |
| GET | `/health` | No | API + DB health |

**Focus session statuses:** `running`, `paused`, `completed`, `cancelled`. One active session per user.

**JWT:** HS256, `sub` (user id), `tv` (token version), `exp`. Default expiry 24h (`JWT_EXPIRE_MINUTES`).

**Password reset:** SMTP not wired; dev API returns `reset_token` in response for local testing.

## Conventions

- UUID primary keys everywhere
- Timestamps in UTC at storage; user timezone for streak day boundaries
- API prefix: `/api/v1`
- OpenAPI docs at `/docs`
- Env vars via `.env` (never commit secrets)
- Migrations via Alembic; never hand-edit production schema
- Python 3.9 local venv works; Docker API uses Python 3.12

## Repository

- **GitHub:** `git@github-steveloids27:SteveLoids27/ZenTrack.git`
- **Product name:** ZenTrack (Digital Detox Timer)

## Git workflow

| Branch | Purpose |
|--------|---------|
| `dev-steve` | **Active development** — milestone building (M1–M5, M8) |
| `main` | Stable release branch — merge from `dev-steve` via PR |

**Rules for agents:**

- Always work on `dev-steve` for milestone implementation.
- Before starting a session: `git checkout dev-steve && git pull origin dev-steve`
- Commit milestone work to `dev-steve` (when user requests commit/push).
- Open PR `dev-steve` → `main` after each milestone passes review gates, or batch at M8.
- Never push directly to `main` unless user explicitly requests a release merge.

**GitHub environment:** `dev-steve` (milestone build environment on GitHub).

## Entry Points

| Action | Command |
|--------|---------|
| Start DB + API (Docker) | `docker compose up -d --build` |
| Run API locally | `cd services/api && source .venv/bin/activate && uvicorn app.main:app --reload` |
| Run mobile | `cd apps/mobile && npm start` |
| Migrations | `cd services/api && alembic upgrade head` |
| API tests | `cd services/api && pytest` |
| Mobile tests | `cd apps/mobile && npm test` |

## MVP Feature Checklist

- [x] M0: Scaffold + DB + Docker
- [x] M1: Auth (register, login, logout, reset-password)
- [x] M2: Focus timer (start/pause/resume/stop/complete)
- [ ] M3: Streaks + daily focus score
- [ ] M5: Dashboard (today/weekly/monthly)
- [ ] M8: Integration tests + hardening + README

## Deferred (post-MVP)

- Reflection journal, gamification, notifications (FCM)

## Constraints

- V2/V3 features (usage tracking, AI coach, social) are **out of scope**
- Reflection, gamification, and notifications are **deferred post-MVP**
- No commits/pushes unless user explicitly requests

## Key References

- Full spec: `docs/DIGITAL_DETOX_TIMER_SPEC.md`
- Build orchestration: `.cursor/prompts/digital-detox-timer-build.md`
- Bugbot review log: `.cursor/context/bugbot-reviews.md`
