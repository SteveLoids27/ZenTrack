# Bugbot Review Log

> Record every Bugbot review after each milestone. Update this file before marking a milestone complete.
>
> **Required fields per review:** milestone, date, diff scope, findings (severity, file, description), disposition (fixed / deferred + reason).

---

## M1 — Authentication

**Date:** 2026-06-24  
**Diff:** uncommitted changes (M1 auth implementation)  
**Agent ID:** fbcb8f32-749c-47e4-8cb3-1f15b7a410d7  
**Findings:** 4 (2 High, 2 Medium)  
**Disposition:** All fixed before milestone handoff

| # | Severity | File | Finding | Disposition |
|---|----------|------|---------|-------------|
| 1 | **High** | `apps/mobile/App.tsx` | Imports used `./api/client`, `./auth/AuthContext`, `./config`, `./screens/*` but modules live under `src/`. Metro cannot resolve paths; app fails to bundle. | **Fixed** — changed imports to `./src/...` |
| 2 | **High** | `apps/mobile/src/api/client.ts` | Imported `API_URL` from `./config` but `config.ts` is in parent `src/` directory. Module resolution fails for all API calls. | **Fixed** — import from `../config` |
| 3 | Medium | `services/api/app/routers/auth.py` | Registration validated `name` before strip; whitespace-only names stored as empty string. | **Fixed** — added Pydantic `@field_validator` to reject blank names after strip |
| 4 | Medium | `apps/mobile/src/auth/AuthContext.tsx` | `restoreSession` called `clearSession()` on any `getCurrentUser` failure, wiping valid tokens on transient network/5xx errors. | **Fixed** — clear session only on `ApiRequestError` with status 401 |

**Post-fix verification:** `pytest` 10 passed, `npm test` 2 passed.

---

## M2 — Focus Timer

**Date:** 2026-06-24  
**Diff:** uncommitted changes (M2 focus timer implementation)  
**Agent ID:** d77a2eaf-92bc-4ece-8b70-9b31e91e1fc0  
**Findings:** 3 (1 High, 2 Medium)  
**Disposition:** All fixed before milestone handoff

| # | Severity | File | Finding | Disposition |
|---|----------|------|---------|-------------|
| 1 | **High** | `apps/mobile/src/api/sessions.ts` | Imported `API_URL` from `./client` but `client.ts` does not re-export it. Runtime `API_URL` undefined; all session requests hit invalid URL. | **Fixed** — import `API_URL` from `../config` |
| 2 | Medium | `apps/mobile/src/screens/TimerScreen.tsx` | `isActive` only true for `running`/`paused`. After complete/stop, UI jumped to picker; post-completion “Start another session” branch never rendered. | **Fixed** — three UI states: picker, live timer, finished summary |
| 3 | Medium | `services/api/app/services/session_service.py` | `create_session` allowed multiple concurrent `running`/`paused` sessions per user. Mobile did not restore in-progress session on reopen. | **Fixed** — server returns 409 for duplicate active session; mobile restores active session from `GET /sessions` on load |

**Post-fix verification:** `pytest` 19 passed, `npm test` 2 passed.

---

## M0 — Scaffold

**Date:** —  
**Bugbot:** Not run (M0 completed before review log was established)  
**Findings:** —

---

## Template (copy for next milestone)

```markdown
## MX — [Milestone Name]

**Date:** YYYY-MM-DD
**Diff:** branch changes | uncommitted changes
**Agent ID:** [uuid]
**Findings:** N (X High, Y Medium, Z Low)
**Disposition:** [all fixed | N deferred]

| # | Severity | File | Finding | Disposition |
|---|----------|------|---------|-------------|
| 1 | High/Medium/Low | `path` | Description | Fixed / Deferred: reason |

**Post-fix verification:** [commands and results]
```
