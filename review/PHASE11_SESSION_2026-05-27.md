# Phase 11 Session Log — 2026-05-27

**Branch:** `backend`  
**Engineer:** Ran (Reviewer) + Claude (Builder)

---

## What Was Done

### 1. Adversarial Review — Phase 9 & 10 Debate (Closed)

Full adversarial review conducted and closed. Final scorecard:

| Attack | Result | Winner |
|---|---|---|
| GetClientIp() X-Forwarded-For still in code | grep confirmed zero executable references — reviewer had copy-paste artifact | Builder |
| In-memory rate limiter clears on app pool recycle | Math killed the practical attack at 30-user scale | Builder |
| Per-IP lockout DoS in shared NAT | Valid — accepted, migrating to per-username | Reviewer |
| SQL race condition fix cost | Reviewer underpriced — lock() wins cleanly at this scale | Builder |
| JWT tokens committed to git | Valid — secret rotated, tokens stripped | Reviewer |
| camerasController Save/Delete unprotected | Valid — fixed in Phase 10 | Reviewer |

**Debate outcome:** Phase 11 cleared to begin.

---

### 2. Security Remediations (Debate Closure)

**JWT secret rotated:**
- Old secret: placeholder string (was committed in Web.config since project start)
- New secret: 256-bit random Base64, stored only in local Web.config

**Web.config removed from git tracking:**
- `git rm --cached` + added to `.gitignore`
- `Web.config.template` created for new developer setup

**JWT tokens stripped from all Bruno files (25 files):**
- All `eyJ...` values replaced with `FILL_IN_TOKEN`
- Expired tokens pose no auth risk, but payload schema is now removed from history going forward

---

### 3. Role Matrix — Final Confirmed

**IT support = admin role** (Ran confirmed)

| Role | Who | Write | Read |
|---|---|---|---|
| admin | IT support + administrators | Everything | Everything |
| user | Staff reviewing network structure | Nothing | sites/buildings/floors/rooms/racks |
| viewer | Management / overview | Nothing | sites/buildings/floors/floor-plans |

Phase 10 admin-only write restriction confirmed correct. No rollback needed.

---

### 4. Phase 11 Fix Backlog (Accepted, Not Yet Implemented)

| # | Fix | Status |
|---|---|---|
| 1 | RequireRoleAttribute — replace inline IsInRole | Pending |
| 2 | Per-username lockout (was per-IP) | Pending |
| 3 | CASE WHEN for role on Update in usersController | Pending |
| 4 | Windows Event Log on audit write failure | Pending |
| 5 | Stale record eviction in rate limiter | Pending |

---

### 5. Frontend Handoff — First Contact

**Backend brief sent** — stack, endpoints, role matrix, gotchas.

**Frontend Claude replied with BACKEND_API_BRIEF.md** — contained critical misunderstandings:
- Assumed framework was ASP.NET Core .NET 10 (actual: Web API .NET Framework 4.7.2)
- Assumed port 5205 (actual: 50680)
- Assumed BCrypt was TODO (actual: already implemented)
- Assumed plain-text password comparison (actual: BCrypt.Verify)
- Called for rebuilding all controllers from scratch (actual: all already exist)

**BACKEND_REPLY.md written** — corrected all misunderstandings, flagged JWT claim URI keys, confirmed what exists vs what's missing.

---

### 6. DashboardController Built

`GET /api/dashboard/summary` — admin only, returns per-site aggregated stats:

```json
[{
  "siteId": "S001",
  "siteName": "สำนักงานใหญ่",
  "siteCode": "HQ",
  "totalCameras": 2,
  "camerasOnline": 0,
  "camerasOffline": 2,
  "camerasWarning": 0,
  "totalNvrs": 1,
  "nvrsOffline": 1,
  "totalSwitches": 1,
  "switchesOffline": 1,
  "totalBuildings": 1,
  "totalFloors": 3
}]
```

Tested live — 200 OK with real data.

---

### 7. Frontend Integration — Login Working

**IIS Express restarted** on port 50680.

**Login tested from backend (PowerShell):** 200 OK.

**Login response shape confirmed:**
```json
{
  "token": "eyJ...",
  "role": "admin",
  "displayName": "Admin Test",
  "expiresIn": 28800
}
```

Note: `role` and `displayName` ARE in the response body — BACKEND_REPLY.md was wrong to say they weren't. Frontend can use response body directly, no need to decode JWT payload for these fields.

**CORS issue resolved by Vite proxy:**
- Frontend (port 3000) → Vite proxy → Backend (port 50680)
- Browser sees same-origin → no CORS headers needed
- Backend CORS also allows `localhost:3000` directly — double-safe

---

### 8. Endpoints Still Missing (Phase 12 Candidates)

| Endpoint | Notes |
|---|---|
| GET /api/status/devices | Frontend should compose from cameras+nvrs+switches |
| GET /api/floors/{id}/floor-plan/image | Use GET /api/floor-plans?Floor_ID= instead (inline base64) |
| GET /api/nvrs/{id} | Use GET /api/nvrs?NVR_ID=xxx |
| GET /api/poe-switches/{id} | Use GET /api/poe-switches?SW_ID=xxx |

---

## Test Accounts (Still Valid)

| username | password | role |
|---|---|---|
| admin_test | Test@1234 | admin |
| user_test | Test@1234 | user |
| viewer_test | Test@1234 | viewer |

Note: All tokens from previous sessions are **invalidated** — JWT secret was rotated today. Re-login required.

---

*Generated 2026-05-27. Backend: Ran. Builder: Claude Sonnet 4.6.*
