# SSM Network Monitor — Backend API

**ASP.NET Web API (.NET Framework 4.7.2)** — REST backend for the SSM Network Monitor system.
Manages sites, buildings, floors, rooms, racks, cameras, NVRs, PoE switches, and users
with JWT authentication and full role-based access control (RBAC).

> **Working from a new machine?** Start with [`review/PROJECT_STATUS.md`](review/PROJECT_STATUS.md) —
> it covers everything: what is built, what is pending, and how to get the server running.
> Latest session log: [`review/PHASE12_SESSION_2026-05-27.md`](review/PHASE12_SESSION_2026-05-27.md)

---

## Branch Structure

| Branch | Contents |
|---|---|
| `backend` | This branch — ASP.NET Web API source |
| `master` | Main branch — merge target |

---

## Quick Start

**Prerequisites:** Visual Studio 2019 or later with ASP.NET workload installed.

```
1. Clone and switch to the backend branch:
   git clone <repo-url>
   git checkout backend

2. Copy the config template (Web.config is gitignored — contains secrets):
   copy BNO_Survei_MonitorAPI\BNO_Survei_MonitorAPI\Web.config.template ^
        BNO_Survei_MonitorAPI\BNO_Survei_MonitorAPI\Web.config

3. Fill in Web.config:
   - JwtSecret:         any 256-bit base64 string (generate one and keep it secret)
   - connectionString:  your SQL Server connection details

4. Open the solution in Visual Studio:
   BNO_Survei_MonitorAPI\BNO_Survei_MonitorAPI.sln

5. Press Ctrl+F5 to start IIS Express.
   Server will be available at: http://localhost:50680
```

---

## Test the Server

```powershell
# Login — should return 200 with token + role
Invoke-RestMethod -Method Post `
  -Uri http://localhost:50680/api/auth/login `
  -ContentType "application/json" `
  -Body '{"username":"admin_test","password":"Test@1234"}'

# Dashboard summary — admin only
$token = "<paste token from login above>"
Invoke-RestMethod `
  -Uri http://localhost:50680/api/dashboard/summary `
  -Headers @{ Authorization = "Bearer $token" }
```

---

## Test Accounts

| Username | Password | Role | Access |
|---|---|---|---|
| `admin_test` | `Test@1234` | admin | Full read + write on everything |
| `user_test` | `Test@1234` | user | Read-only: sites/buildings/floors/rooms/racks |
| `viewer_test` | `Test@1234` | viewer | Read-only: sites/buildings/floors/floor-plans only |

> **Note:** If the JWT secret in Web.config was changed, all previous tokens are invalid.
> Re-login after any secret rotation.

---

## Role Matrix

| Action | admin | user | viewer |
|---|---|---|---|
| GET sites / buildings / floors / floor-plans | ✅ | ✅ | ✅ |
| GET rooms / racks | ✅ | ✅ | ❌ |
| GET cameras / nvrs / poe-switches / users / logs | ✅ | ❌ | ❌ |
| GET dashboard/summary | ✅ | ❌ | ❌ |
| POST / PUT / DELETE (all resources) | ✅ | ❌ | ❌ |

---

## API Endpoints (All Live)

| Method | Endpoint | Role |
|---|---|---|
| POST | `/api/auth/login` | Public |
| GET | `/api/sites` | All |
| GET | `/api/buildings` | All |
| GET | `/api/floors` | All |
| GET | `/api/floor-plans` | All |
| GET | `/api/hierarchy/tree` | All |
| GET | `/api/rooms` | admin + user |
| GET | `/api/racks` | admin + user |
| GET | `/api/cameras` | admin |
| GET | `/api/nvrs` | admin |
| GET | `/api/poe-switches` | admin |
| GET | `/api/users` | admin |
| GET | `/api/ping-logs` | admin |
| GET | `/api/alert-logs` | admin |
| GET | `/api/audit-logs` | admin |
| GET | `/api/dashboard/summary` | admin |

All write endpoints (POST/PUT/DELETE) are admin only.

---

## JWT Notes

The backend uses **full URI claim keys** (not short names). When decoding the JWT on the
frontend, read:

| Field | Claim key |
|---|---|
| User ID | `http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier` |
| Username | `http://schemas.xmlsoap.org/ws/2005/05/identity/claims/name` |
| Role | `http://schemas.microsoft.com/ws/2008/06/identity/claims/role` |

The login response body also returns `role` and `displayName` directly — no need to
decode the JWT just for those fields.

---

## Bruno API Tests

Test collections are in `bruno/`. All tokens are stripped from committed files
(`FILL_IN_TOKEN` placeholder). To run tests:

1. Open Bruno → open collection from `bruno/phase10-rbac-tests/`
2. Login with one of the test accounts above
3. Paste the token into the appropriate environment variable
4. Run the collection — all 20 RBAC tests should pass

---

## Project Documentation

| File | Contents |
|---|---|
| [`review/PROJECT_STATUS.md`](review/PROJECT_STATUS.md) | **Start here** — full project state, what's built, what's pending |
| [`review/PHASE12_SESSION_2026-05-27.md`](review/PHASE12_SESSION_2026-05-27.md) | Latest session log (Phase 12) |
| [`review/PHASE11_SESSION_2026-05-27.md`](review/PHASE11_SESSION_2026-05-27.md) | Phase 11 — adversarial review + backlog |
| [`review/PHASE10_SESSION_2026-05-27.md`](review/PHASE10_SESSION_2026-05-27.md) | Phase 10 — full RBAC implementation |
| [`review/ROLE_MATRIX.md`](review/ROLE_MATRIX.md) | Confirmed role access matrix |
| [`Web.config.template`](BNO_Survei_MonitorAPI/BNO_Survei_MonitorAPI/Web.config.template) | Config template for new developer setup |

---

## Project Structure

```
API/
├── BNO_Survei_MonitorAPI/
│   └── BNO_Survei_MonitorAPI/
│       ├── Controllers/          # All API controllers (16 controllers)
│       ├── Filters/              # JwtAuthFilter, RequireRoleAttribute
│       ├── ConnectDB/            # SqlConnection wrapper
│       ├── Models/               # Data models
│       ├── Helpers/              # JwtHelper, password hashing
│       ├── App_Start/            # WebApiConfig (CORS, routing, JWT auth)
│       ├── Web.config            # ⚠ Gitignored — copy from Web.config.template
│       └── Web.config.template   # Template for new developers
├── bruno/
│   └── phase10-rbac-tests/       # 20 RBAC test files (RBAC01–20)
└── review/
    ├── PROJECT_STATUS.md         # Master status document
    ├── ROLE_MATRIX.md
    ├── PHASE12_SESSION_2026-05-27.md
    ├── PHASE11_SESSION_2026-05-27.md
    └── PHASE10_SESSION_2026-05-27.md
```

---

## Current Status (Phase 12 — Complete)

All planned backend features are implemented. No open backlog items.

| Phase | Highlights |
|---|---|
| 10 | RBAC enforcement across all controllers |
| 11 | Adversarial review — 5 backlog items identified |
| 12 | All 5 backlog items closed: `RequireRoleAttribute`, per-username lockout, stale eviction, file-log fallback, role optional on update |

**Phase 13 (pending):** Reflection-based test — verify all write endpoints have `[RequireRole]` or `[AllowAnonymous]` at compile time.

---

*ASP.NET Web API · .NET Framework 4.7.2 · SQL Server · IIS Express (port 50680)*
