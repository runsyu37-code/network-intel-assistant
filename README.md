# SSM Network Monitor — Backend API

**ASP.NET Web API (.NET Framework 4.8)** — REST backend for the SSM Network Monitor system.
Manages sites, buildings, floors, rooms, racks, cameras, NVRs, PoE switches, and users
with JWT authentication and full role-based access control (RBAC).

> **Backend team (new machine):** Read [Quick Start](#quick-start), then
> [`docs/sessions/PHASE13_SESSION.md`](docs/sessions/PHASE13_SESSION.md) for latest context.
>
> **Frontend team:** Jump to [For Frontend Team](#for-frontend-team) below.
> Full API contract: [`docs/FRONTEND_HANDOFF.md`](docs/FRONTEND_HANDOFF.md)

---

## File Map — Where Everything Lives

```
network-intel-assistant/           ← git clone จาก branch: backend
│
├── README.md                      ← อ่านไฟล์นี้ก่อน (ไฟล์นี้)
├── ROADMAP.md                     ← แผน 5 เดือน + decision log (personal)
│
├── BNO_Survei_MonitorAPI/         ← [Home Laptop] API source code
│   └── BNO_Survei_MonitorAPI/
│       ├── Controllers/           ← 16 controllers (auth, dashboard, cameras ฯลฯ)
│       ├── Filters/               ← JwtAuthFilter + RequireRoleAttribute
│       ├── Models/                ← C# models ทุก table
│       ├── Helpers/               ← JwtHelper, password hashing
│       ├── Services/              ← PingService (background ping loop)
│       ├── ConnectionDB/          ← SqlConnection wrapper
│       ├── App_Start/             ← CORS, routing, filter registration
│       ├── Web.config             ← ⚠ SECRETS — gitignored, ต้อง copy จาก template
│       └── Web.config.template   ← copy ไฟล์นี้ แล้วใส่ JwtSecret + connectionString
│
├── db/                            ← [Setup — ทำครั้งเดียว] SQL schema + seed data
│   ├── SSM_schema_v2.sql          ← รันบน SSMS เพื่อสร้าง SSM_DB ทั้งหมด
│   ├── migration_week0_schema.sql ← migration สำหรับ week 0
│   └── mock_data.sql              ← seed mock data หลัง schema พร้อม
│
├── bruno/                         ← [Home Laptop] API test collection
│   ├── auth/                      ← login + me
│   ├── cameras/ buildings/ ...    ← CRUD tests แต่ละ resource
│   ├── phase8-tests/              ← error sanitization + role tests
│   ├── phase9-tests/              ← rate limit + validation tests
│   └── phase10-rbac-tests/        ← 21 RBAC test files (RBAC01–21)
│
├── scripts/                       ← [Home Laptop] dev utilities
│   └── Check-EndpointSecurity.ps1 ← รันหลัง build: ตรวจ 43/43 endpoints มี [RequireRole]
│
├── FOR_WORK_NB/                   ← [Work Notebook] data import tools
│   ├── START_HERE.md              ← อ่านก่อนใช้งาน work notebook session
│   ├── ssm_import.py              ← import Excel → SSM_DB
│   ├── import_to_api.py           ← import ผ่าน API (หลัง auth)
│   ├── patterns.py + sanitize.py  ← sanitize IP/MAC/hostname ก่อนส่ง AI
│   ├── template_v4.xlsx           ← Excel template สำหรับกรอกข้อมูลจริง
│   ├── SSM_schema_v2.sql          ← copy ของ schema (ใช้บน work NB)
│   ├── MEGA_CONTEXT.md            ← full context สำหรับ AI ที่ work NB
│   └── SSM_IMPORT_GUIDE.md        ← คู่มือ import ฉบับเต็ม
│
├── docs/                          ← [Reference] อ่านอ้างอิง
│   ├── FRONTEND_HANDOFF.md        ← ⭐ API contract สำหรับ frontend dev
│   ├── ROLE_MATRIX.md             ← ⭐ RBAC matrix ฉบับยืนยันแล้ว
│   ├── PROJECT_STATUS.md          ← สถานะโปรเจกต์ทุก phase
│   ├── BACKEND_API_BRIEF.md       ← schema + code patterns อ้างอิง
│   ├── PING_SERVICE_NOTES.md      ← notes การออกแบบ PingService
│   ├── MACHINE_RULES.md           ← กฎการใช้งานแต่ละเครื่อง
│   └── sessions/                  ← session logs Phase 7–13
│       ├── PHASE7_SESSION.md
│       ├── PHASE8_SESSION.md  PHASE8_DEBATE.md
│       ├── PHASE9_SESSION.md  PHASE9_DEBATE.md
│       ├── PHASE10_SESSION.md
│       ├── PHASE11_SESSION.md
│       ├── PHASE12_SESSION.md
│       ├── PHASE13_SESSION.md
│       └── FRONTEND_PLAN_RECAP.md  ← frontend starting brief
│
├── presentation_B/                ← slides สำหรับ weekly presentation
│   └── WEEKLY_PRESENTATION_2026-05-27.md
│
└── archive/                       ← เก็บไว้แต่ไม่ใช้แล้ว
    ├── MEGA/                      ← superseded โดย FOR_WORK_NB/
    ├── sanitizer/                 ← Phase A sanitizer (superseded)
    ├── samples/ + tests/          ← Phase A test data
    ├── frontend_design/           ← wireframes HTML (ย้ายไป frontend branch แล้ว)
    └── old_docs/                  ← root .md เก่าจาก early sessions
```

---

## Branch Structure

| Branch | Contents |
|---|---|
| `backend` | **This branch** — ASP.NET Web API source + tools |
| `frontend` | React SPA (Vite + TypeScript) |
| `master` | Main branch — merge target |
| `work-safe` | Branch สำหรับ work notebook (ไม่มี secrets) |

---

## Quick Start

**Prerequisites:** Visual Studio 2019+ with ASP.NET workload. SQL Server (any edition).

```
1. Clone and switch to the backend branch:
   git clone <repo-url>
   git checkout backend

2. Create the database (do once):
   Open SSMS → open db/SSM_schema_v2.sql → Execute
   Open SSMS → open db/mock_data.sql     → Execute  (optional seed data)

3. Copy the config template (Web.config is gitignored — contains secrets):
   copy BNO_Survei_MonitorAPI\BNO_Survei_MonitorAPI\Web.config.template ^
        BNO_Survei_MonitorAPI\BNO_Survei_MonitorAPI\Web.config

4. Fill in Web.config:
   - JwtSecret:         any 256-bit base64 string (generate and keep secret)
   - connectionString:  your SQL Server connection details

5. Open the solution:
   BNO_Survei_MonitorAPI\BNO_Survei_MonitorAPI.slnx

6. Press Ctrl+F5 to start IIS Express.
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
> **JWT secret changed in Web.config?** All existing tokens are invalid — re-login.

---

## Role Matrix

> Full spec: [`docs/ROLE_MATRIX.md`](docs/ROLE_MATRIX.md)

| Action | admin | user | viewer |
|---|---|---|---|
| GET sites / buildings / floors / floor-plans / hierarchy | YES | YES | YES |
| GET rooms / racks | YES | YES | NO (403) |
| GET cameras / NVRs / PoE switches / logs / dashboard | YES | NO (403) | NO (403) |
| POST/UPDATE/DELETE any resource | YES | NO (403) | NO (403) |
| PATCH camera position | YES | NO (403) | NO (403) |
| Floor plan upload/register | YES | NO (403) | NO (403) |

**All write operations are admin only without exception.**

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
| GET | `/api/status/devices` | All | Lightweight — for 30s polling (status + last_seen only) |
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
| POST | `/api/cameras/{id}` | admin + user | Update — single object |
| POST | `/api/cameras/delete/{id}` | admin | DELETE uses POST pattern |
| PATCH | `/api/cameras/{id}/position` | admin + user | Body: `{"x": 0.35, "y": 0.72}` |
| POST | `/api/floor-plans/validate-path` | admin | 6-layer file validation |
| POST | `/api/floor-plans` | admin | Register floor plan (re-validates inside) |
| POST | `/api/users` | admin | |
| POST | `/api/users/{id}` | admin | `role` field is optional — omit to preserve existing |
| POST | `/api/users/delete/{id}` | admin | |

> **DELETE pattern:** All deletes use `POST /api/{resource}/delete/{id}`, not HTTP DELETE.  
> **Save vs Update:** Save accepts `[array]`, Update accepts a single `{object}`.

---

## JWT Notes

Login response returns `role` and `displayName` directly — no need to decode the token.  
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
| Token from a different environment | Each Web.config has its own secret — tokens are not portable |

**Check:** Login works but GET /api/sites returns 401 --> secret mismatch between machines.

### When you get 403 Forbidden

| Cause | Fix |
|---|---|
| Role too low for this endpoint | Check role matrix above |
| Using `viewer_test` for write actions | Use `admin_test` |
| Using `user_test` for admin-only endpoints | Use `admin_test` |

**Quick test:** `GET /api/auth/me` with the token — confirms what role the token actually has.

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

Validation error. Check the `Message` field in the response body — it says exactly what's wrong.

Common causes:
- Missing required field (username, password on login)
- Invalid role value on user update (must be `admin`, `user`, or `viewer`)
- Invalid position value on camera PATCH (x/y must be 0.0-1.0)

### When the server won't start

1. **Port conflict:** Another process on port 50680. Kill it or change port in `applicationhost.config`.
2. **Web.config missing:** Copy from `Web.config.template` and fill in values.
3. **DB connection refused:** Check `connectionString` in Web.config. Test SQL Server is running.
4. **Build error "type not found":** All `.cs` files must be listed in `.csproj` — check `<Compile Include>` entries.
5. **NuGet packages missing** (new machine / fresh clone):
   ```powershell
   # From repo root — add nuget.org if not listed
   .\nuget.exe sources add -name "nuget.org" -source "https://api.nuget.org/v3/index.json"
   .\nuget.exe restore "BNO_Survei_MonitorAPI\BNO_Survei_MonitorAPI.slnx"
   ```
6. **`bin\roslyn\csc.exe` not found** — copy Roslyn compiler after NuGet restore:
   ```powershell
   $src = "BNO_Survei_MonitorAPI\packages\Microsoft.CodeDom.Providers.DotNetCompilerPlatform.2.0.1\tools\Roslyn45"
   $dst = "BNO_Survei_MonitorAPI\BNO_Survei_MonitorAPI\bin\roslyn"
   New-Item -ItemType Directory -Force $dst | Out-Null
   Copy-Item "$src\*" $dst -Recurse -Force
   ```
   Then press **Ctrl+F5** again in Visual Studio.

### When a request works in Bruno but fails from frontend

1. **CORS:** Frontend must run on an origin in `Web.config` CORS list (`localhost:5173`, `localhost:3000`, `localhost:5174`).
2. **Auth header format:** Must be exactly `Authorization: Bearer <token>` (capital B, space before token).
3. **Floor plan image:** Cannot use `<img src="...">` — must fetch with auth header and use blob URL.
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
# From repo root — requires a successful build first
.\scripts\Check-EndpointSecurity.ps1
```

**Result:** 43/43 PASS = all write endpoints have `[RequireRole]` or `[AllowAnonymous]`.  
Any FAIL = endpoint missing security attribute — fix before deploy.

---

## Bruno API Tests

Test collections are in `bruno/phase10-rbac-tests/` (21 test files).  
Tokens in committed files are placeholders (`FILL_IN_TOKEN`) — fill from a fresh login.

1. Open Bruno app
2. File > Open Collection > select `bruno/phase10-rbac-tests/`
3. Login with a test account
4. Paste token into the runtime variable for that collection
5. Run — all 21 tests should pass

---

## Reference Documents

| File | Contents |
|---|---|
| [`docs/FRONTEND_HANDOFF.md`](docs/FRONTEND_HANDOFF.md) | ⭐ Full backend API contract for frontend dev |
| [`docs/ROLE_MATRIX.md`](docs/ROLE_MATRIX.md) | ⭐ Confirmed role access matrix |
| [`docs/PROJECT_STATUS.md`](docs/PROJECT_STATUS.md) | Full project state (all phases) |
| [`docs/BACKEND_API_BRIEF.md`](docs/BACKEND_API_BRIEF.md) | DB schema + code patterns reference |
| [`docs/PING_SERVICE_NOTES.md`](docs/PING_SERVICE_NOTES.md) | PingService design notes |
| [`docs/sessions/PHASE13_SESSION.md`](docs/sessions/PHASE13_SESSION.md) | Phase 13 — reflection security gate |
| [`docs/sessions/PHASE12_SESSION.md`](docs/sessions/PHASE12_SESSION.md) | Phase 12 — all backlog items closed |
| [`docs/sessions/FRONTEND_PLAN_RECAP.md`](docs/sessions/FRONTEND_PLAN_RECAP.md) | Frontend starting brief |
| [`FOR_WORK_NB/START_HERE.md`](FOR_WORK_NB/START_HERE.md) | Work notebook session entry point |

---

## For Frontend Team

> Full contract: [`docs/FRONTEND_HANDOFF.md`](docs/FRONTEND_HANDOFF.md)  
> Role spec: [`docs/ROLE_MATRIX.md`](docs/ROLE_MATRIX.md)  
> API examples: [`bruno/phase10-rbac-tests/`](bruno/phase10-rbac-tests/)

### Role Matrix (confirmed — all writes are admin only)

| What | admin | user | viewer |
|---|---|---|---|
| GET sites / buildings / floors / floor-plans / hierarchy | YES | YES | YES |
| GET rooms / racks | YES | YES | NO — 403 |
| GET cameras / NVRs / PoE switches / logs / dashboard | YES | NO — 403 | NO — 403 |
| Any POST / UPDATE / DELETE / PATCH | YES | NO — 403 | NO — 403 |

```js
const isAdmin   = user?.role === 'admin';
const canSeeRooms   = isAdmin || user?.role === 'user';   // rooms, racks
const canSeeDevices = isAdmin;                            // cameras, NVRs, logs

// All write/edit actions — admin only
{isAdmin && <EditButton />}
{isAdmin && <DeleteButton />}
{isAdmin && <DragPin />}
```

### Must-Know Gotchas

**1. Floor plan image needs Auth header — cannot use plain `<img src="...">`**
```js
const res  = await axios.get(`/api/floors/${id}/floor-plan/image`, {
  responseType: 'blob',
  headers: { Authorization: `Bearer ${token}` }
});
const url = URL.createObjectURL(res.data);
// <img src={url} />
```

**2. DELETE uses POST, not HTTP DELETE**
```
POST /api/cameras/delete/{id}    <-- correct
DELETE /api/cameras/{id}          <-- not implemented (404)
```

**3. Save = array body, Update = single object body**
```js
axios.post('/api/cameras', [{ name: 'CAM-01', ... }])   // Save
axios.post('/api/cameras/5', { name: 'CAM-01', ... })   // Update
```

**4. Camera x/y is NULL until a pin is placed — handle it**
```js
if (camera.x === null) { /* show in "Unplaced" list */ }
```

**5. `last_seen` is UTC — always convert before display**
```js
new Date(device.last_seen + 'Z').toLocaleString('th-TH')
```

**6. Rate limiter: 10 wrong passwords = username locked 15 min**  
Affects integration tests. Restart IIS Express to reset the in-memory counter.

**7. No Swagger** — use Bruno collection or `docs/FRONTEND_HANDOFF.md` for request shapes.

**8. CORS allowed origins (dev)**
```
http://localhost:5173   http://localhost:3000   http://localhost:5174
```
Running on a different port? Add it to `Web.config` on the backend.

### Auth Flow
```
POST /api/auth/login
Body:     { "username": "admin_test", "password": "Test@1234" }
Response: { "token": "eyJ...", "role": "admin", "displayName": "Admin", "expiresIn": 28800 }

All subsequent requests:  Authorization: Bearer <token>
Token lifetime:           8 hours (no refresh endpoint)
On 401:                   redirect to /login
```

### Error Response Shape
```json
{ "Message": "Human-readable error string" }
```
| Status | Meaning | Action |
|---|---|---|
| 400 | Validation error | Show `Message` to user |
| 401 | Token missing / expired | Redirect to /login |
| 403 | Wrong role | Show "Access denied" |
| 429 | Too many failed logins | Show retry-after from header |
| 500 | Server error | Show generic message |

---

## Current Status

**Backend: Phase 13 complete — maintenance mode.**  
**Frontend: F9 in progress — wiring 12 pages to real API.**

| Phase | Focus | Status |
|---|---|---|
| 7-9 | Auth, CRUD, rate limiting, audit log | Done |
| 10 | RBAC enforcement | Done |
| 11 | Adversarial review | Done |
| 12 | All 5 review items closed | Done |
| 13 | Reflection security gate (43/43 PASS) | Done |
| F1–F8 | React SPA — 15 pages, Buono purple theme | Done |
| **F9** | Wire 12 pages to real API | **In Progress** |

---

## Cross-Machine Setup Note (2026-05-28)

ถ้า pull มาแล้ว server ไม่ขึ้น ดู [`docs/sessions/CROSSMACHINE_FIX_2026-05-28.md`](docs/sessions/CROSSMACHINE_FIX_2026-05-28.md)

สาเหตุหลัก: NuGet auto-upgrade `Microsoft.Web.Infrastructure` บน home PC แล้ว commit ขึ้นมา ทำให้ assembly version mismatch บนเครื่องอื่น

**Quick fix checklist:**
1. ตรวจ `packages.config` — `Microsoft.Web.Infrastructure` ต้องเป็น `version="1.0.0.0"`
2. ตรวจ `.csproj` — HintPath ต้องชี้ที่ `packages\Microsoft.Web.Infrastructure.1.0.0.0\`
3. `Web.config` ต้องมี `<runtime><assemblyBinding>` — copy จาก template ได้เลย (template มี binding redirects ครบแล้ว)
4. Build → Clean Solution → Rebuild Solution → Ctrl+F5

ถ้าเจอ `0x80131040` บน DLL ใดก็ตาม → ดู quick reference ใน CROSSMACHINE_FIX doc

---

## F9 — Frontend Wiring Status

Frontend รันที่ `http://localhost:3001` — CORS allow แล้ว

| เอกสาร | เนื้อหา |
|---|---|
| [`docs/sessions/F9_PLAN_2026-05-28.md`](docs/sessions/F9_PLAN_2026-05-28.md) | แผน F9 — mapping หน้าเว็บ → endpoint |
| [`docs/sessions/F9_FRONTEND_REPLY_R1.md`](docs/sessions/F9_FRONTEND_REPLY_R1.md) | Frontend ตอบ 6 ข้อ + issues |
| [`docs/sessions/F9_BACKEND_REPLY_R1.md`](docs/sessions/F9_BACKEND_REPLY_R1.md) | Backend ตอบ 5 issues ครบ |

**CORS origins (dev):**
```
http://localhost:5173   http://localhost:3000   http://localhost:5174   http://localhost:3001
```

---

*ASP.NET Web API · .NET Framework 4.8 · SQL Server · IIS Express (port 50680)*
