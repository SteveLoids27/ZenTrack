# Digital Detox Timer — Product Specification (V1.0 MVP)

## Product Principle

> **Make focus rewarding, not restriction painful.**

Every screen and feature should help users feel they are gaining control of their attention rather than being punished for using technology.

---

## 1. Overview

### Problem

People spend excessive time on distracting applications. Existing digital detox apps focus on restriction rather than sustainable focus habits.

### Solution

Digital Detox Timer (ZenTrack) is a habit-building app that helps users improve focus through:

- Focus sessions
- Daily streak tracking
- Progress analytics (daily focus score + dashboard)

### Target Users

Students, software engineers, remote workers, freelancers, content creators, entrepreneurs.

### User Goals

- Reduce screen addiction
- Improve concentration
- Build focus habits
- Track productivity
- Increase deep work time

---

## 2. MVP Scope (V1.0)

### In Scope

| # | Feature | Milestone |
|---|---------|-----------|
| 1 | User Authentication | M1 |
| 2 | Focus Timer | M2 |
| 3 | Daily Streak Tracking | M3 |
| 4 | Daily Focus Score | M3 |
| 5 | Dashboard Analytics | M5 |
| 6 | Testing + Hardening | M8 |

### Deferred (post-MVP)

| Feature | Notes |
|---------|-------|
| Reflection Journal | Future release |
| Gamification (XP, Levels, Badges) | Future release |
| Notifications (FCM) | Future release |
| Application usage tracking | V2 |
| Focus categories | V2 |
| Weekly reports | V2 |
| AI Focus Coach | V3 |
| Challenges / social / leaderboards | V3 |
| Premium features | Future |

---

## 3. Technology Stack

| Layer | Technology |
|-------|------------|
| Frontend | React Native, Expo, TypeScript |
| Backend | Python, FastAPI |
| Database | PostgreSQL |
| Auth | JWT |

### Repository Layout

```
zentrack/
├── apps/mobile/          # Expo React Native app
├── services/api/         # FastAPI backend
├── docker-compose.yml    # PostgreSQL + API
├── .env.example
└── README.md
```

---

## 4. Feature Specifications (MVP)

### 4.1 User Authentication (M1)

**User flow:** Open App → Register/Login → Dashboard

**Functional requirements**

- Email registration
- Email login
- Password reset
- Logout

**API endpoints**

| Method | Path | Description |
|--------|------|-------------|
| POST | `/auth/register` | Create account |
| POST | `/auth/login` | Authenticate, return JWT |
| POST | `/auth/logout` | Invalidate session/token |
| POST | `/auth/reset-password` | Request/complete password reset |

**Security requirements**

- Passwords stored as bcrypt/argon2 hash (never plaintext)
- JWT with expiry; refresh strategy documented
- Input validation on all auth endpoints

---

### 4.2 Focus Timer (M2)

**User flow:** Dashboard → Select Duration → Start → Running → Complete → Save

**Session durations:** 15, 30, 45, 60 minutes, custom

**Functional requirements**

- Start, pause, resume, stop, complete timer
- Persist completed sessions

**Data model — `focus_sessions`**

```json
{
  "id": "uuid",
  "user_id": "uuid",
  "duration": 30,
  "status": "completed",
  "started_at": "timestamp",
  "ended_at": "timestamp"
}
```

**Status values:** `running`, `paused`, `completed`, `cancelled`

**API endpoints**

| Method | Path | Description |
|--------|------|-------------|
| POST | `/sessions` | Start session |
| PATCH | `/sessions/{id}` | Pause / resume / stop / complete |
| GET | `/sessions` | List user sessions (filter by date range) |
| GET | `/sessions/{id}` | Session detail |

---

### 4.3 Daily Streak Tracking (M3)

**Rules**

- 1 completed session per calendar day (user timezone) = streak maintained
- No completed session for 1 day = streak reset
- Track longest streak ever

**Dashboard display**

```
Current Streak: 12 Days
Longest Streak: 35 Days
```

**API endpoints**

| Method | Path | Description |
|--------|------|-------------|
| GET | `/streak` | Current + longest streak |
| PUT | `/streak/update` | Recompute streak (or internal trigger on session complete) |

---

### 4.4 Daily Focus Score (M3)

**Formula**

```
Focus Score = (Completed Minutes / Target Minutes) × 100
```

**Example:** Target = 60 min, Completed = 45 min → Score = 75%

**Requirements**

- Target minutes configurable per user (default: 60)
- Score capped at 100%
- Dashboard shows today's score

**API endpoints**

| Method | Path | Description |
|--------|------|-------------|
| GET | `/focus-score/today` | Today's score + inputs |
| PUT | `/users/me/settings` | Update target minutes |

---

### 4.5 Dashboard (M5)

**Components**

| Section | Metrics |
|---------|---------|
| Today's Summary | Focus time today, focus score, current streak |
| Weekly Summary | Total focus hours, sessions completed, avg session length |
| Monthly Summary | Focus hours, longest streak, most productive day |

**API endpoints**

| Method | Path | Description |
|--------|------|-------------|
| GET | `/dashboard/today` | Today summary |
| GET | `/dashboard/weekly` | Weekly aggregates |
| GET | `/dashboard/monthly` | Monthly aggregates |

---

## 5. Database Schema (MVP)

```sql
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    target_minutes INTEGER DEFAULT 60,
    timezone VARCHAR(64) DEFAULT 'UTC',
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE focus_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    duration INTEGER NOT NULL,
    status VARCHAR(20) NOT NULL,
    started_at TIMESTAMP NOT NULL,
    ended_at TIMESTAMP
);

CREATE TABLE streaks (
    user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    current_streak INTEGER DEFAULT 0,
    longest_streak INTEGER DEFAULT 0,
    last_session_date DATE
);
```

---

## 6. Development Milestones

| Milestone | Name | Depends on |
|-----------|------|------------|
| M0 | Project scaffold + DB + dev environment | — |
| M1 | Authentication | M0 |
| M2 | Focus Timer | M1 |
| M3 | Streaks + daily focus score | M2 |
| M5 | Dashboard analytics | M3 |
| M8 | Testing + hardening + README | M1–M5 |

> **Note:** M4, M6, and M7 are not part of this MVP (reflection, gamification, notifications deferred).

---

## 7. Success Metrics (post-launch)

**User:** DAU, WAU, MAU, retention, avg focus minutes/day

**Product:** avg streak length, sessions/user

---

## 8. Non-Functional Requirements

- API response time < 300ms p95 for read endpoints under normal load
- Mobile app works on iOS and Android via Expo
- All secrets in environment variables, never committed
- Migrations version-controlled (Alembic)
- API documented via OpenAPI/Swagger

---

## Appendix — Deferred Feature Specs

<details>
<summary>Reflection Journal (post-MVP)</summary>

Post-session prompts, history, edit. Tables: `reflections`. Endpoints: `POST/GET/PUT /reflections`.
</details>

<details>
<summary>Gamification (post-MVP)</summary>

XP, levels, badges. Tables: `achievements`, `user_xp`. Endpoints: `/gamification/*`.
</details>

<details>
<summary>Notifications (post-MVP)</summary>

FCM daily/streak/achievement reminders. Requires Firebase setup.
</details>
