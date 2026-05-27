# SSM Network Monitor -- Backend API

**ASP.NET Web API (.NET Framework 4.8)** -- REST backend for the SSM Network Monitor system.
Manages sites, buildings, floors, rooms, racks, cameras, NVRs, PoE switches, and users
with JWT authentication and full role-based access control (RBAC).

> **Working from a new machine?** Read [Quick Start](#quick-start) below, then
> [`review/FRONTEND_PLAN_RECAP_2026-05-27.md`](review/FRONTEND_PLAN_RECAP_2026-05-27.md) for full context.
> Latest backend log: [`review/PHASE13_SESSION_2026-05-27.md`](review/PHASE13_SESSION_2026-05-27.md)

---

## Branch Structure

| Branch | Contents |
|---|---|
| `backend` | This branch -- ASP.NET Web API source |
| `master` | Main branch -- merge target |

---

## Quick Start

**Prerequisites:** Visual Studio 2019+ with ASP.NET workload. SQL Server (any edition).

```
1. Clone and switch to the backend branch:
   git clone <repo-url>
   git checkout backend

2. Copy the config template (Web.config is gitignored -- contains secrets):
   copy BNO_Survei_MonitorAPI\BNO_Survei_MonitorAPI\Web.config.template ^
        BNO_Survei_MonitorAPI\BNO_Survei_MonitorAPI\Web.config

3. Fill in Web.config:
   - JwtSecret:         any 256-bit base64 string (generate and keep secret)
   - connectionString:  your SQL Server connection details

4. Open the solution:
   BNO_Survei_MonitorAPI\BNO_Survei_MonitorAPI.slnx

5. Press Ctrl+F5 to start IIS Express.
   Server runs at: http://localhost:50680
```

---

## Test the Server

```powershell
# Login -- should return 200 with token + role
Invoke-RestMethod -Method Post `
  -Uri http://localhost:50680/api/auth/login `
  -ContentType "application/json" `
  -Body '{"username":"admin_test","password":"Test@1234"}'

# Dashboard summary (admin only) -- paste token from login
$token = "eyJ..."
Invoke-RestMethod `
  -Uri http://localhost:50680/api/dashboard/summary `
  -Headers @{ Authorization = "Bearer $token" }
```

---

## Test Accounts

| Username | Password | Role | Access |
|---|---|---|---|
| `admin_test` | `Test@1234` | admin | Full read + write on everything |
| `user_test` | `Test@1234` | user | Read + write cameras/NVRs/devices; no user management |
| `viewer_test` | `Test@1234` | viewer | Read-only: sites/buildings/floors/floor-plans only |

> **Token expired?** Re-login. JWT lifetime = 8 hours. No refresh endpoint.  
> **JWT secret changed in Web.config?** All existing tokens are invalid -- re-login.

---

## Role Matrix

| Action | admin | user | viewer |
|---|---|---|---|
| GET sites / buildings / floors / floor-plans / hierarchy | YES | YES | YES |
| GET rooms / racks | YES | YES | NO (403) |
| GET cameras / NVRs / PoE switches / logs / dashboard | YES | NO (403) | NO (403) |
| POST/UPDATE cameras, NVRs, buildings, devices... | YES | YES | NO (403) |
| PATCH camera position | YES | YES | NO (403) |
| POST/UPDATE/DELETE users | YES | NO (403) | NO (403) |
| Floor plan upload/register | YES | NO (403) | NO (403) |

---

## API Endpoints (All Live)

### Auth
| Method | Endpoint | Role | Notes |
|---|---|---|---|
| POST | `/api/auth/login` | Public | Returns `token`, `role`, `displayName` |
| GET | `/api/auth/me` | Any | Current user info |

### Read Endpoints
| Method | Endpoint | Role |
|---|---|---|
| GET | `/api/hierarchy/tree` | All | Full site tree in 1 call (use for sidebar nav) |
| GET | `/api/dashboard/summary` | admin | Aggregate device/alert counts |
| GET | `/api/status/devices` | All | Lightweight -- for 30s polling (status + last_seen only) |
| GET | `/api/sites` | All | |
| GET | `/api/buildings` | All | |
| GET | `/api/floors` | All | |
| GET | `/api/floor-plans` | All | |
| GET | `/api/rooms` | admin + user | |
| GET | `/api/racks` | admin + user | |
| GET | `/api/cameras` | admin | |
| GET | `/api/nvrs` | admin | |
| GET | `/api/poe-switches` | admin | |
| GET | `/api/users` | admin | |
| GET | `/api/ping-logs` | admin | |
| GET | `/api/alert-logs` | admin | |
| GET | `/api/audit-logs` | admin | |

### Write Endpoints (all require admin unless noted)
| Method | Endpoint | Role | Notes |
|---|---|---|---|
| POST | `/api/cameras` | admin + user | Body: array `[{...}]` |
| POST | `/api/cameras/{id}` | admin + user | Update -- single object |
| POST | `/api/cameras/delete/{id}` | admin | DELETE uses POST pattern |
| PATCH | `/api/cameras/{id}/position` | admin + user | Body: `{"x": 0.35, "y": 0.72}` |
| POST | `/api/floor-plans/validate-path` | admin | 6-layer file validation |
| POST | `/api/floor-plans` | admin | Register floor plan (re-validates inside) |
| POST | `/api/users` | admin | |
| POST | `/api/users/{id}` | admin | `role` field is optional -- omit to preserve existing |
| POST | `/api/users/delete/{id}` | admin | |

> **DELETE pattern:** All deletes use `POST /api/{resource}/delete/{id}`, not HTTP DELETE.  
> **Save vs Update:** Save accepts `[array]`, Update accepts a single `{object}`.

---

## JWT Notes

Login response returns `role` and `displayName` directly -- no need to decode the token.  
If you do need to decode it (e.g., in middleware), use these full URI claim keys:

| Field | Claim key |
|---|---|
| User ID | `http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier` |
| Username | `http://schemas.xmlsoap.org/ws/2005/05/identity/claims/name` |
| Role | `http://schemas.microsoft.com/ws/2008/06/identity/claims/role` |

---

## Debugging Guide

### When you get 401 Unauthorized

| Cause | Fix |
|---|---|
| No `Authorization` header | Add `Authorization: Bearer <token>` header |
| Token expired (8 hours) | Re-login to get a fresh token |
| Wrong JWT secret in Web.config | Match the secret that was used to issue the token |
| Token from a different environment | Each Web.config has its own secret -- tokens are not portable |

**Check:** Login works but GET /api/sites returns 401 --> secret mismatch between machines.

### When you get 403 Forbidden

| Cause | Fix |
|---|---|
| Role too low for this endpoint | Check role matrix above |
| Using `viewer_test` for write actions | Use `admin_test` |
| Using `user_test` for admin-only endpoints | Use `admin_test` |

**Quick test:** `GET /api/auth/me` with the token -- confirms what role the token actually has.

### When you get 429 Too Many Requests

Rate limiter triggered. Per-username lockout after 10 failed logins in 5 minutes.  
`Retry-After` header tells you how many seconds to wait (lockout = 15 minutes).

```
Header: Retry-After: 847
```

**If you locked yourself out during testing:**
- Wait 15 minutes, OR
- Restart IIS Express (rate limiter is in-memory, resets on restart)

### When you get 400 Bad Request

Validation error. Check the `Message` field in the response body -- it says exactly what's wrong.

Common causes:
- Missing required field (username, password on login)
- Invalid role value on user update (must be `admin`, `user`, or `viewer`)
- Invalid position value on camera PATCH (x/y must be 0.0-1.0)

### When the server won't start

1. **Port conflict:** Another process on port 50680. Kill it or change port in `applicationhost.config`.
2. **Web.config missing:** Copy from `Web.config.template` and fill in values.
3. **DB connection refused:** Check `connectionString` in Web.config. Test SQL Server is running.
4. **Build error "type not found":** All `.cs` files must be listed in `.csproj` -- check `<Compile Include>` entries.

### When a request works in Bruno but fails from frontend

1. **CORS:** Frontend must run on an origin in `Web.config` CORS list (`localhost:5173`, `localhost:3000`, `localhost:5174`).
2. **Auth header format:** Must be exactly `Authorization: Bearer <token>` (capital B, space before token).
3. **Floor plan image:** Cannot use `<img src="...">` -- must fetch with auth header and use blob URL.
4. **Content-Type:** POST bodies need `Content-Type: application/json`.

---

## Where Logs Are

| Log | Location | What's In It |
|---|---|---|
| Security events (lockouts) | `audit_logs` table, `action = 'lockout'` | Login lockout events |
| Audit trail | `audit_logs` table | All create/update/delete actions by users |
| Lockout fallback (if DB down) | `BNO_Survei_MonitorAPI\App_Data\security.log` | Lockout events that couldn't write to DB |
| IIS trace (last resort) | IIS Express logs | Critical events if DB and file both fail |

### Query audit log for recent security events
```sql
SELECT TOP 50 *
FROM audit_logs
WHERE action IN ('lockout', 'login_fail')
ORDER BY created_at DESC;
```

### Query for a specific user's actions
```sql
SELECT *
FROM audit_logs
WHERE user_id = 5   -- replace with User_ID
ORDER BY created_at DESC;
```

---

## Security Gate

Run this after adding any new controller or action method:
```powershell
# From repo root -- requires a successful build first
.\scripts\Check-EndpointSecurity.ps1
```

**Result:** 43/43 PASS = all write endpoints have `[RequireRole]` or `[AllowAnonymous]`.  
Any FAIL = endpoint missing security attribute -- fix before deploy.

---

## Bruno API Tests

Test collections are in `bruno/phase10-rbac-tests/` (21 test files).  
Tokens in committed files are placeholders (`FILL_IN_TOKEN`) -- fill from a fresh login.

1. Open Bruno app
2. File > Open Collection > select `bruno/phase10-rbac-tests/`
3. Login with a test account
4. Paste token into the runtime variable for that collection
5. Run -- all 21 tests should pass

---

## Project Documentation

| File | Contents |
|---|---|
| [`review/FRONTEND_PLAN_RECAP_2026-05-27.md`](review/FRONTEND_PLAN_RECAP_2026-05-27.md) | **Frontend starting brief** -- read this when switching machines |
| [`review/FRONTEND_HANDOFF.md`](review/FRONTEND_HANDOFF.md) | Full backend API contract for frontend dev |
| [`review/PROJECT_STATUS.md`](review/PROJECT_STATUS.md) | Full project state (all phases) |
| [`review/PHASE13_SESSION_2026-05-27.md`](review/PHASE13_SESSION_2026-05-27.md) | Phase 13 -- reflection security gate |
| [`review/PHASE12_SESSION_2026-05-27.md`](review/PHASE12_SESSION_2026-05-27.md) | Phase 12 -- all backlog items closed |
| [`review/PHASE11_SESSION_2026-05-27.md`](review/PHASE11_SESSION_2026-05-27.md) | Phase 11 -- adversarial review + backlog |
| [`review/ROLE_MATRIX.md`](review/ROLE_MATRIX.md) | Confirmed role access matrix |
| [`Web.config.template`](BNO_Survei_MonitorAPI/BNO_Survei_MonitorAPI/Web.config.template) | Config template for new developer setup |

---

## Project Structure

```
API/
├── BNO_Survei_MonitorAPI/
│   └── BNO_Survei_MonitorAPI/
│       ├── Controllers/          # 16 API controllers
│       ├── Filters/              # JwtAuthFilter (global), RequireRoleAttribute (per-method)
│       ├── ConnectDB/            # SqlConnection wrapper
│       ├── Models/               # Request/response models
│       ├── Helpers/              # JwtHelper (token sign/verify), password hashing
│       ├── App_Start/            # WebApiConfig (CORS, routing, filter registration)
│       ├── App_Data/             # security.log (lockout fallback -- gitignored)
│       ├── Web.config            # Secrets -- gitignored, copy from template
│       └── Web.config.template   # Safe template for new developers
├── scripts/
│   └── Check-EndpointSecurity.ps1  # Phase 13 reflection security gate
├── bruno/
│   └── phase10-rbac-tests/       # 21 RBAC test files (RBAC01-21)
└── review/
    ├── FRONTEND_PLAN_RECAP_2026-05-27.md  # Frontend starting brief
    ├── FRONTEND_HANDOFF.md
    ├── PROJECT_STATUS.md
    ├── ROLE_MATRIX.md
    └── PHASE{N}_SESSION_2026-05-27.md    # Session logs (7-13)
```

---

## Current Status

**Backend: Phase 13 complete -- maintenance mode.**  
**Frontend: Not started -- approved plan ready, begin Phase F1.**

| Phase | Focus | Status |
|---|---|---|
| 7-9 | Auth, CRUD, rate limiting, audit log | Done |
| 10 | RBAC enforcement | Done |
| 11 | Adversarial review | Done |
| 12 | All 5 review items closed | Done |
| 13 | Reflection security gate (43/43 PASS) | Done -- no review, no HTTP test needed |
| **F1** | Frontend setup + login | **Next** |

---

*ASP.NET Web API · .NET Framework 4.8 · SQL Server · IIS Express (port 50680)*
