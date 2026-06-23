# Digital Detox Timer — Product Specification (V1.0 MVP)

## Product Principle

> **Make focus rewarding, not restriction painful.**

Every screen, feature, and notification should help users feel they are gaining control of their attention rather than being punished for using technology.

---

## 1. Overview

### Problem

People spend excessive time on distracting applications. Existing digital detox apps focus on restriction rather than sustainable focus habits.

### Solution

Digital Detox Timer is a habit-building app that helps users improve focus through:

- Focus sessions
- Daily streak tracking
- Progress analytics
- Reflection journaling
- Gamification
- Smart reminders

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

| # | Feature | Priority |
|---|---------|----------|
| 1 | User Authentication | P0 |
| 2 | Focus Timer | P0 |
| 3 | Daily Streak Tracking | P0 |
| 4 | Daily Focus Score | P0 |
| 5 | Reflection Journal | P1 |
| 6 | Dashboard Analytics | P0 |
| 7 | Gamification (XP, Levels, Badges) | P1 |
| 8 | Notifications (daily + streak + achievement) | P1 |

### Out of Scope (V1.0)

- Application usage tracking (V2)
- Focus categories (V2)
- Weekly reports (V2)
- AI Focus Coach (V3)
- Challenges / social / leaderboards (V3)
- Premium features

---

## 3. Technology Stack

| Layer | Technology |
|-------|------------|
| Frontend | React Native, Expo, TypeScript |
| Backend | Python, FastAPI |
| Database | PostgreSQL |
| Auth | JWT |
| Notifications | Firebase Cloud Messaging (FCM) |
| Analytics | PostHog (instrument hooks; full rollout post-MVP acceptable) |

### Repository Layout (target)

```
digital-detox-timer/
├── apps/
│   └── mobile/          # Expo React Native app
├── services/
│   └── api/             # FastAPI backend
├── packages/            # shared types/utils (optional)
├── docker-compose.yml   # PostgreSQL (+ optional services)
├── .env.example
└── README.md
```

---

## 4. Feature Specifications

### 4.1 User Authentication

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
| POST | `/auth/logout` | Invalidate session/token (server-side denylist or client clear per design) |
| POST | `/auth/reset-password` | Request/complete password reset |

**Security requirements**

- Passwords stored as bcrypt/argon2 hash (never plaintext)
- JWT with expiry; refresh strategy documented
- Input validation on all auth endpoints

---

### 4.2 Focus Timer

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

**API endpoints (minimum)**

| Method | Path | Description |
|--------|------|-------------|
| POST | `/sessions` | Start session |
| PATCH | `/sessions/{id}` | Pause / resume / stop / complete |
| GET | `/sessions` | List user sessions (filter by date range) |
| GET | `/sessions/{id}` | Session detail |

---

### 4.3 Daily Streak Tracking

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
| PUT | `/streak/update` | Recompute streak (or internal job on session complete) |

---

### 4.4 Daily Focus Score

**Formula**

```
Focus Score = (Completed Minutes / Target Minutes) × 100
```

**Example:** Target = 60 min, Completed = 45 min → Score = 75%

**Requirements**

- Target minutes configurable per user (default: 60)
- Score capped at 100% unless product decides otherwise
- Dashboard shows today's score

**API endpoints**

| Method | Path | Description |
|--------|------|-------------|
| GET | `/focus-score/today` | Today's score + inputs |
| PUT | `/users/me/settings` | Update target minutes |

---

### 4.5 Reflection Journal

**Prompts (post-session)**

1. What distracted you today?
2. What went well?
3. What can be improved tomorrow?

**Functional requirements**

- Create reflection linked to session
- View history
- Edit reflection

**Data model — `reflections`**

```json
{
  "id": "uuid",
  "user_id": "uuid",
  "session_id": "uuid",
  "reflection": "Today I got distracted by social media.",
  "created_at": "timestamp"
}
```

**API endpoints**

| Method | Path | Description |
|--------|------|-------------|
| POST | `/reflections` | Create |
| GET | `/reflections` | List (paginated) |
| GET | `/reflections/{id}` | Detail |
| PUT | `/reflections/{id}` | Update |

---

### 4.6 Dashboard

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

### 4.7 Gamification

**XP rules**

| Focus minutes | XP earned |
|---------------|-----------|
| 10 min | 10 XP |
| 30 min | 30 XP |
| 60 min | 60 XP |

XP awarded on session completion based on actual completed duration.

**Levels**

| Level | Name | XP threshold (suggested) |
|-------|------|--------------------------|
| 1 | Beginner | 0 |
| 2 | Focus Builder | 100 |
| 3 | Deep Worker | 500 |
| 4 | Focus Master | 2000 |
| 5 | Attention Elite | 5000 |

**Badges**

| Badge | Trigger |
|-------|---------|
| First Focus Session | 1 completed session |
| 3 Day Streak | 3 consecutive days |
| 7 Day Streak | 7 consecutive days |
| 30 Day Streak | 30 consecutive days |
| 100 Focus Hours | 6000 cumulative minutes |
| 365 Focus Hours | 21900 cumulative minutes |

**Data model — `achievements`**

```json
{
  "id": "uuid",
  "user_id": "uuid",
  "badge_name": "7 Day Streak",
  "earned_at": "timestamp"
}
```

**API endpoints**

| Method | Path | Description |
|--------|------|-------------|
| GET | `/gamification/profile` | XP, level, badges |
| GET | `/gamification/badges` | All earned badges |

---

### 4.8 Notifications

| Type | Trigger | Default message |
|------|---------|-----------------|
| Daily reminder | User-configured time | "Ready for your focus session?" |
| Streak reminder | No session today by evening | "Complete one session today to keep your streak alive." |
| Achievement | Badge unlocked | "Congratulations! You unlocked the 7 Day Streak badge." |

**Requirements**

- User can configure reminder time
- Opt-in for push notifications
- FCM integration (can stub locally for dev; document production setup)

---

## 5. Database Schema

```sql
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    target_minutes INTEGER DEFAULT 60,
    reminder_time TIME,
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

CREATE TABLE reflections (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    session_id UUID REFERENCES focus_sessions(id) ON DELETE CASCADE,
    reflection TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE streaks (
    user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    current_streak INTEGER DEFAULT 0,
    longest_streak INTEGER DEFAULT 0,
    last_session_date DATE
);

CREATE TABLE achievements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    badge_name VARCHAR(100) NOT NULL,
    earned_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(user_id, badge_name)
);

CREATE TABLE user_xp (
    user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    total_xp INTEGER DEFAULT 0,
    updated_at TIMESTAMP DEFAULT NOW()
);
```

---

## 6. Development Milestones

| Milestone | Name | Est. | Depends on |
|-----------|------|------|------------|
| M0 | Project scaffold + DB + dev environment | 2d | — |
| M1 | Authentication | 3d | M0 |
| M2 | Focus Timer | 4d | M1 |
| M3 | Session tracking (streaks + focus score) | 3d | M2 |
| M4 | Dashboard analytics | 4d | M3 |
| M5 | Reflection journal | 2d | M2 |
| M6 | Gamification | 4d | M3 |
| M7 | Notifications | 2d | M1, M6 |
| M8 | Testing + hardening | 5d | M1–M7 |

---

## 7. Success Metrics (post-launch)

**User:** DAU, WAU, MAU, retention, avg focus minutes/day

**Product:** avg streak length, sessions/user, badge completion rate, weekly report open rate (V2)

---

## 8. Non-Functional Requirements

- API response time < 300ms p95 for read endpoints under normal load
- Mobile app works on iOS and Android via Expo
- All secrets in environment variables, never committed
- Migrations version-controlled (Alembic recommended)
- API documented via OpenAPI/Swagger
