# ZenTrack

**Digital Detox Timer** — habit-building app for focus sessions, streaks, analytics, reflections, and gamification.

> Make focus rewarding, not restriction painful.

> **Note:** This README is updated during development. It is **finalized and pushed to GitHub** at **Milestone M8** when the MVP is complete.

## Stack

| Layer | Technology |
|-------|------------|
| Mobile | React Native, Expo, TypeScript |
| API | Python, FastAPI |
| Database | PostgreSQL 16 |
| Containers | Docker Compose |

## Repository structure

```
.
├── apps/mobile/          # Expo React Native app
├── services/api/         # FastAPI backend + Alembic migrations
├── docker-compose.yml    # PostgreSQL + API
├── docs/                 # Product specification
└── .cursor/              # Agent harness (build prompts, rules)
```

## Prerequisites

- [Docker Desktop](https://www.docker.com/products/docker-desktop/)
- Node.js 20+ and npm
- Python 3.12+ (for local API development without Docker)

## Quick start

### 1. Environment

```bash
cp .env.example .env
# Edit .env with your Postgres password if needed
```

### 2. Start API + database (Docker)

```bash
docker compose up -d --build
```

Services:

| Service | URL |
|---------|-----|
| API | http://localhost:8000 |
| API docs | http://localhost:8000/docs |
| Health | http://localhost:8000/health |
| PostgreSQL | localhost:5433 (Docker; avoids conflict with local Postgres on 5432) |

### 3. Start mobile app

```bash
cd apps/mobile
npm install
npm start
```

Scan the QR code with Expo Go, or press `i` / `a` for iOS / Android simulator.

**Android emulator:** set `EXPO_PUBLIC_API_URL=http://10.0.2.2:8000` in `apps/mobile/.env` (not `localhost`).

### 4. Run tests

```bash
# API tests
cd services/api
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
pytest

# Mobile tests
cd apps/mobile
npm test
```

## Local API development (without Docker API container)

```bash
cd services/api
python -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt

# Ensure Postgres is running (Docker or local) and DATABASE_URL in .env is correct
alembic upgrade head
uvicorn app.main:app --reload
```

## Database

Docker Compose creates database `zentrack` automatically.

To connect manually:

```bash
psql "host=localhost port=5433 dbname=zentrack user=postgres"
```

## Git workflow

| Branch | Purpose |
|--------|---------|
| `dev-steve` | Active development — all milestone building |
| `main` | Stable release — merge from `dev-steve` via PR |

```bash
git checkout dev-steve
git pull origin dev-steve
# ... work on milestones M1–M8 ...
git push origin dev-steve
```

Open a PR to merge `dev-steve` → `main` when a milestone (or M8 MVP) is complete.

## Git remote

```bash
git remote add origin git@github-steveloids27:SteveLoids27/ZenTrack.git
```

> Use `github-steveloids27` (not `github.com`) so SSH uses the **SteveLoids27** key. Plain `git@github.com` authenticates as a different GitHub account on this machine.

## Development milestones

See `.cursor/prompts/digital-detox-timer-build.md` for the full milestone plan (M0–M8).

| Milestone | Status |
|-----------|--------|
| M0 Scaffold + Docker | Done |
| M1 Authentication | Pending |
| M2 Focus Timer | Pending |
| M3 Streaks + Focus Score | Pending |
| M4 Dashboard | Pending |
| M5 Reflection Journal | Pending |
| M6 Gamification | Pending |
| M7 Notifications | Pending |
| M8 Testing + Hardening | Pending |

## License

Private — SteveLoids27/ZenTrack
