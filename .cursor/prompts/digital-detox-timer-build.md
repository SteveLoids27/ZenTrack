# Digital Detox Timer — Agent Build Prompt

> **How to use:** Start a chat with `/loops Build Digital Detox Timer — begin at Milestone M0` or `@.cursor/prompts/digital-detox-timer-build.md start M1`.
>
> Agents must follow the **Adaptive Orchestrator** principles and the **Feature Completion Loop** rule. Work one milestone at a time. Do not skip review gates.

---

## Startup (every session)

1. **Checkout dev branch:** `git checkout dev-steve && git pull origin dev-steve`
2. Read `.cursor/context/application.md`, `learnings.md`, `current-task.md`
3. Read `docs/DIGITAL_DETOX_TIMER_SPEC.md` for the active milestone section
4. Explore the codebase — confirm what exists vs. what the milestone requires
5. State understanding in 3–5 sentences; list gaps and risks
6. Update `current-task.md` with active milestone and acceptance criteria
7. Produce a numbered plan with verification steps **before** coding

## Git branch policy

| Branch | Role |
|--------|------|
| `dev-steve` | All milestone building (M1–M5, M8) — **work here** |
| `main` | Stable — merge via PR when milestone(s) complete |

- Push milestone commits to `origin/dev-steve`.
- Bugbot reviews use `Diff: branch changes` with base `main` (or `uncommitted changes` on `dev-steve`).
- At M8: open PR `dev-steve` → `main`, finalize README, merge after approval.

---

## Global build rules

### Orchestrator loop (per milestone)

```
Understand → Plan → Implement → Test → Self-Review → Bugbot Review → Fix → Re-test → Reflect → Next Milestone
```

### Completion criteria (every milestone)

Do **not** mark a milestone done until ALL are true:

1. All acceptance criteria for the milestone are implemented
2. Relevant automated checks pass (pytest, lint, typecheck, build as applicable)
3. Manual smoke test of the user flow succeeds
4. Self-review checklist completed (see below)
5. **Bugbot** subagent review run; findings addressed or explicitly deferred with reason
6. `application.md`, `learnings.md`, and `current-task.md` updated
7. Handoff summary provided (changes, how to verify, known gaps)

### Self-review checklist (agent, before Bugbot)

- [ ] Matches existing code conventions and spec
- [ ] No hardcoded secrets or credentials
- [ ] Input validation on API boundaries
- [ ] Error handling returns meaningful HTTP status codes
- [ ] DB migrations are reversible or documented
- [ ] No placeholder TODOs for required milestone logic
- [ ] Types/schemas consistent between API and mobile (if applicable)
- [ ] Edge cases considered (empty state, invalid input, auth failures)

### Code quality review (Bugbot subagent)

After self-review passes, launch exactly one `bugbot` subagent:

```
subagent_type: bugbot
readonly: true
description: Bugbot
```

Prompt shape:

```text
Full Repository Path: /Users/admin/Downloads/Agent Harness
Diff: branch changes
Custom Instructions: Review milestone [MX] implementation for bugs, logic errors, security issues, and regressions. Focus on auth, data integrity, and API contracts.
```

If Bugbot reports findings:

1. Fix valid issues (High/Critical required before milestone completion)
2. Re-run automated checks
3. Re-run Bugbot only if material changes were made
4. **Record all findings** in `.cursor/context/bugbot-reviews.md` (severity, file, description, disposition)
5. Document any deferred findings in `learnings.md` with reason

### Failure / timeout policy

Follow `.cursor/rules/feature-completion-loop.mdc`:

- Retry with evidence, not blind loops
- Max 3 retries per command pattern without a material change
- Escalate with: what failed, what was tried, hypothesis, minimum input needed

### Delegation

- Use **adaptive-orchestrator** for planning, context, and cross-milestone coordination
- Use **bugbot** for code quality review after each milestone
- Use **explore** or **generalPurpose** subagents for narrow investigations
- Parent agent retains ownership of integration and final verification

---

## Milestone M0 — Project Scaffold + Database

**Goal:** Runnable monorepo skeleton with PostgreSQL, FastAPI app shell, Expo app shell, migrations tooling, and dev docs.

### Deliverables

- `docker-compose.yml` with PostgreSQL
- `services/api/` — FastAPI app, health endpoint, Alembic, `.env.example`
- `apps/mobile/` — Expo TypeScript app with navigation shell
- Root `README.md` with setup instructions
- `.gitignore` covering Python, Node, Expo, `.env`

### Acceptance criteria

- [ ] `docker compose up -d` starts Postgres
- [ ] API starts and `GET /health` returns 200
- [ ] `alembic upgrade head` runs (initial migration or empty baseline)
- [ ] Expo app launches (`npx expo start`)
- [ ] README documents all setup steps

### Verification

```bash
docker compose up -d
cd services/api && pip install -r requirements.txt && alembic upgrade head && pytest
cd apps/mobile && npm install && npm test
```

---

## Milestone M1 — Authentication

**Goal:** Secure email auth with JWT.

### Deliverables

- `users` table migration
- Endpoints: `POST /auth/register`, `/login`, `/logout`, `/reset-password`
- Password hashing (bcrypt or argon2)
- JWT issue + validation middleware
- Mobile screens: Register, Login, Logout
- Protected route guard on dashboard

### Acceptance criteria

- [ ] User can register with email + password
- [ ] User can log in and receive JWT
- [ ] Invalid credentials rejected with 401
- [ ] Protected endpoints require valid JWT
- [ ] Logout clears session/token per design
- [ ] Password reset flow implemented (email stub acceptable with documented TODO for SMTP)
- [ ] API tests cover happy path + auth failures

### User flow to verify

```
Open App → Register → Login → Access Dashboard → Logout
```

---

## Milestone M2 — Focus Timer

**Goal:** Full session lifecycle on mobile with API persistence.

### Deliverables

- `focus_sessions` table migration
- Session CRUD/lifecycle endpoints
- Mobile timer UI: duration picker (15/30/45/60/custom)
- Start, pause, resume, stop, complete
- Persist completed sessions to API

### Acceptance criteria

- [ ] All five timer actions work on device/simulator
- [ ] Session saved with correct `started_at`, `ended_at`, `duration`, `status`
- [ ] Only authenticated users can create sessions
- [ ] Cancelled vs completed sessions handled correctly
- [ ] API + unit tests for session state machine

### User flow to verify

```
Dashboard → Select Duration → Start → Pause → Resume → Complete → Session saved
```

---

## Milestone M3 — Streaks + Daily Focus Score

**Goal:** Track consecutive focus days and compute daily productivity score.

### Deliverables

- `streaks` table migration
- Streak update logic on session complete (timezone-aware)
- `GET /streak`, streak recompute endpoint or internal trigger
- Focus score: `completed_minutes / target_minutes × 100`
- User `target_minutes` setting (default 60)
- Dashboard widgets: current streak, longest streak, today's score

### Acceptance criteria

- [ ] 1 completed session/day maintains streak
- [ ] Missing a day resets current streak
- [ ] Longest streak preserved across resets
- [ ] Focus score calculates correctly (test with known inputs)
- [ ] Timezone boundary edge case documented and tested

### Rules

- Streak day = calendar day in user's timezone
- Score capped at 100% unless spec updated

---

## Milestone M5 — Dashboard Analytics

**Goal:** Today, weekly, and monthly analytics views. **Final feature milestone before M8.**

### Deliverables

- `GET /dashboard/today`, `/weekly`, `/monthly`
- Mobile dashboard sections per spec
- Aggregations: focus time, sessions count, avg session length, most productive day

### Acceptance criteria

- [ ] Today's summary shows focus time, score, streak
- [ ] Weekly summary shows total hours, sessions, avg length
- [ ] Monthly summary shows focus hours, longest streak, most productive day
- [ ] Empty state handled gracefully (new user)
- [ ] API tests with fixture data

---

## Milestone M8 — Testing + Hardening

**Goal:** Integration coverage, bug fixes, PR-ready MVP, and **final README on GitHub**.

### Deliverables

- Integration tests for critical flows (auth → session → streak → dashboard)
- Fix all known bugs from M1–M5
- API OpenAPI docs complete
- **Finalize `README.md`** (see checklist below) — this is the public face of the repo on GitHub
- Security pass: rate limiting on auth, CORS config, input sanitization

### Final README checklist (required before MVP is complete)

Update root `README.md` so a new developer can clone and run without chat context. Include:

- [ ] Project name, tagline, and product principle
- [ ] Feature list (all MVP features: M1–M5)
- [ ] Architecture overview (mobile ↔ API ↔ Postgres)
- [ ] Prerequisites (Docker, Node, Python versions)
- [ ] Environment variables table (from `.env.example` with descriptions)
- [ ] Quick start: clone → `.env` → `docker compose up` → mobile `npm start`
- [ ] API docs URL (`/docs`) and key endpoint summary
- [ ] Database setup and migrations (`alembic upgrade head`)
- [ ] How to run tests (API + mobile)
- [ ] Android emulator note (`10.0.2.2` vs `localhost`)
- [ ] Git remote: `git@github-steveloids27:SteveLoids27/ZenTrack.git`
- [ ] Milestone status table (M0, M1, M2, M3, M5, M8 marked Done)
- [ ] Known limitations and V2 roadmap (brief)
- [ ] Troubleshooting (common errors: Docker not running, SSH account, DB port)

### GitHub handoff (end of M8)

After README is finalized:

1. Commit: `docs: finalize README for MVP release`
2. Ensure remote uses SteveLoids27 SSH: `git@github-steveloids27:SteveLoids27/ZenTrack.git`
3. Push to `main` so GitHub displays the complete README
4. Confirm with user that README is live on https://github.com/SteveLoids27/ZenTrack

Do **not** mark the application finished until `README.md` is pushed to GitHub (or user explicitly defers push).

### Acceptance criteria

- [ ] Full pytest suite green
- [ ] Mobile test suite green (or documented scope)
- [ ] End-to-end smoke: register → focus session → view dashboard
- [ ] No P0/P1 Bugbot findings open
- [ ] **Final README checklist complete and committed**
- [ ] **README pushed to GitHub `main`**
- [ ] PR-ready summary with verification steps

---

## Handoff template (end of each milestone)

```markdown
## Milestone [MX] Complete

### Changes
- ...

### Verification run
- [command]: PASS/FAIL
- ...

### Self-review
- [x] checklist complete

### Bugbot
- Findings: N (all addressed / N deferred with reason)
- Review log: `.cursor/context/bugbot-reviews.md` updated

### Context updated
- application.md: yes
- learnings.md: yes
- current-task.md: yes

### Next
- Proceed to Milestone M[X+1]: [name]

### README (M8 only)
- [ ] Final README checklist complete
- [ ] Committed and pushed to GitHub main
```

---

## Quick-start prompts

**Full build (orchestrated):**

```
/loops @.cursor/prompts/digital-detox-timer-build.md

Build Digital Detox Timer MVP. Start at Milestone M0.
Follow orchestrator principles. Complete one milestone at a time.
Run self-review and Bugbot after each milestone before proceeding.
```

**Single milestone:**

```
/loops @.cursor/prompts/digital-detox-timer-build.md

Implement Milestone M2 — Focus Timer only.
Follow the milestone acceptance criteria and review gates.
```

**Resume work:**

```
Read .cursor/context/current-task.md and continue the active milestone.
Apply completion loop and review gates before marking done.
```
