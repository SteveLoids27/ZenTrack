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
| Auth | JWT (bcrypt/argon2 password hashing) |
| Notifications | Firebase Cloud Messaging (FCM) |
| Analytics | PostHog (hooks acceptable in MVP) |

## Architecture

```
Mobile (Expo)  --REST/JWT-->  FastAPI API  -->  PostgreSQL
                                    |
                                    +--> FCM (notifications)
                                    +--> PostHog (analytics events)
```

### Target layout

- `apps/mobile/` — Expo React Native client
- `services/api/` — FastAPI backend, Alembic migrations, tests
- `docker-compose.yml` — local PostgreSQL
- `docs/DIGITAL_DETOX_TIMER_SPEC.md` — full product spec

## Core Domain Entities

- **User** — auth, settings (target minutes, reminder time, timezone)
- **FocusSession** — timed session with status lifecycle
- **Streak** — current/longest consecutive days with completed session
- **Reflection** — post-session journal entry
- **Achievement** — earned badges
- **UserXP** — cumulative XP and derived level

## Conventions

- UUID primary keys everywhere
- Timestamps in UTC at storage; user timezone for streak day boundaries
- API prefix: `/api/v1` (recommended)
- OpenAPI docs at `/docs`
- Env vars via `.env` (never commit secrets)
- Migrations via Alembic; never hand-edit production schema

## Repository

- **GitHub:** `git@github-steveloids27:SteveLoids27/ZenTrack.git`
- **Product name:** ZenTrack (Digital Detox Timer)

## Git workflow

| Branch | Purpose |
|--------|---------|
| `dev-steve` | **Active development** — all milestone building (M1–M8) |
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
- [ ] M1: Auth (register, login, logout, reset-password)
- [ ] M2: Focus timer (start/pause/resume/stop/complete)
- [ ] M3: Streaks + daily focus score
- [ ] M4: Dashboard (today/weekly/monthly)
- [ ] M5: Reflection journal
- [ ] M6: Gamification (XP, levels, badges)
- [ ] M7: Notifications (FCM)
- [ ] M8: Integration tests + hardening

## Constraints

- V2/V3 features (usage tracking, AI coach, social) are **out of scope**
- Notifications may use FCM stubs in dev; document production setup
- No commits/pushes unless user explicitly requests

## Key References

- Full spec: `docs/DIGITAL_DETOX_TIMER_SPEC.md`
- Build orchestration: `.cursor/prompts/digital-detox-timer-build.md`
