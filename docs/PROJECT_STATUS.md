# Project Status — SSM Monitor API

**Last updated:** 2026-05-27  
**Branch:** `backend`  
**Server:** ASP.NET Web API (IIS Express) — `http://localhost:50680`  
**Database:** SQL Server (local)

---

## TL;DR — Where We Are

Backend API is **feature-complete for Phase 10**. Full RBAC is implemented and verified with 17 Bruno tests (17/17 PASS). The API is ready for frontend integration.

---

## What Has Been Built (Phase by Phase)

### Phase 7 — Foundation Fixes
- JWT authentication (HS256, 8h expiry, secret in Web.config)
- CORS from config (not hardcoded)
- BCrypt password hashing on users table
- DeviceTypes constants (camera / nvr / poe_switch)
- Floor plan upload requires auth

### Phase 8 — Security Hardening
- Sanitized all error responses (no stack traces, no SQL messages leaked)
- Fixed garbled Thai strings in error messages → English only
- Added role checks to cameras, users, floor plans controllers
- Fixed UTC timezone on all `created_at` / `updated_at`

### Phase 9 — Rate Limiting + RBAC Gap Fix
- **Login rate limiting:** 10 failed attempts / 5 min window → 429 + `Retry-After` header, 15-min lockout per IP
- **Fixed ValidRoles check** in usersController (null role was passing validation → stored NULL in DB)
- **RBAC gap found and fixed:** 11 controllers had `[Authorize]` but no role check on write endpoints
- Fixed IP spoofing vector (removed X-Forwarded-For trust)

### Phase 10 — Full Role Matrix Implementation ✅ (current)
- All write endpoints → **admin only** (was admin+user on infrastructure)
- Added **GET-level RBAC** (previously any logged-in user could GET anything)
- Fixed missing role checks on camerasController Save + Delete
- 17 Bruno RBAC tests — all PASS

---

## Role Matrix (Confirmed + Implemented)

### GET (Read)

| Endpoint | admin | user | viewer |
|---|---|---|---|
| /api/sites | ✅ | ✅ | ✅ |
| /api/buildings | ✅ | ✅ | ✅ |
| /api/floors | ✅ | ✅ | ✅ |
| /api/floor-plans | ✅ | ✅ | ✅ |
| /api/rooms | ✅ | ✅ | ❌ 403 |
| /api/racks | ✅ | ✅ | ❌ 403 |
| /api/cameras | ✅ | ❌ 403 | ❌ 403 |
| /api/nvrs | ✅ | ❌ 403 | ❌ 403 |
| /api/poe-switches | ✅ | ❌ 403 | ❌ 403 |
| /api/devices | ✅ | ❌ 403 | ❌ 403 |
| /api/alert-logs | ✅ | ❌ 403 | ❌ 403 |
| /api/audit-logs | ✅ | ❌ 403 | ❌ 403 |
| /api/ping-logs | ✅ | ❌ 403 | ❌ 403 |
| /api/sync-logs | ✅ | ❌ 403 | ❌ 403 |
| /api/users | ✅ | ❌ 403 | ❌ 403 |

### POST / DELETE (Write) — admin only across all endpoints

---

## API Endpoints (Full List)

| Method | URL | Auth | Notes |
|---|---|---|---|
| POST | /api/auth/login | ❌ no auth | Returns JWT token |
| GET | /api/sites | ✅ all roles | |
| POST | /api/sites | ✅ admin only | Body: `[{Site_ID, name, code, location, description}]` |
| POST | /api/sites/{Site_ID} | ✅ admin only | Update |
| POST | /api/sites/delete/{Site_ID} | ✅ admin only | |
| GET | /api/buildings | ✅ all roles | |
| POST | /api/buildings | ✅ admin only | |
| POST | /api/buildings/{Building_ID} | ✅ admin only | Update |
| POST | /api/buildings/delete/{Building_ID} | ✅ admin only | |
| GET | /api/floors | ✅ all roles | |
| POST | /api/floors | ✅ admin only | |
| POST | /api/floors/{Floor_ID} | ✅ admin only | Update |
| POST | /api/floors/delete/{Floor_ID} | ✅ admin only | |
| GET | /api/floor-plans | ✅ all roles | |
| POST | /api/floor-plans | ✅ admin only | multipart/form-data (image upload) |
| POST | /api/floor-plans/delete/{Floor_ID} | ✅ admin only | |
| GET | /api/rooms | ✅ admin+user | viewer → 403 |
| POST | /api/rooms | ✅ admin only | |
| POST | /api/rooms/{Room_ID} | ✅ admin only | Update |
| POST | /api/rooms/delete/{Room_ID} | ✅ admin only | |
| GET | /api/racks | ✅ admin+user | viewer → 403 |
| POST | /api/racks | ✅ admin only | |
| POST | /api/racks/{Rack_ID} | ✅ admin only | Update |
| POST | /api/racks/delete/{Rack_ID} | ✅ admin only | |
| GET | /api/cameras | ✅ admin only | |
| POST | /api/cameras | ✅ admin only | |
| POST | /api/cameras/{id} | ✅ admin only | Update |
| POST | /api/cameras/delete/{id} | ✅ admin only | |
| PATCH | /api/cameras/{id}/position | ✅ admin only | Body: `{x, y}` (0.0–1.0) |
| GET | /api/nvrs | ✅ admin only | |
| POST | /api/nvrs | ✅ admin only | |
| POST | /api/nvrs/{NVR_ID} | ✅ admin only | Update |
| POST | /api/nvrs/delete/{NVR_ID} | ✅ admin only | |
| GET | /api/poe-switches | ✅ admin only | |
| POST | /api/poe-switches | ✅ admin only | |
| POST | /api/poe-switches/{SW_ID} | ✅ admin only | Update |
| POST | /api/poe-switches/delete/{SW_ID} | ✅ admin only | |
| GET | /api/devices | ✅ admin only | Unified search: cameras+nvrs+switches |
| GET | /api/alert-logs | ✅ admin only | |
| POST | /api/alert-logs | ✅ admin only | |
| POST | /api/alert-logs/delete/{id} | ✅ admin only | |
| GET | /api/audit-logs | ✅ admin only | |
| GET | /api/ping-logs | ✅ admin only | |
| GET | /api/sync-logs | ✅ admin only | |
| GET | /api/users | ✅ admin only | Does NOT return pw_hash |
| POST | /api/users | ✅ admin only | BCrypt hashes password |
| POST | /api/users/{User_ID} | ✅ admin only | Update |
| POST | /api/users/delete/{User_ID} | ✅ admin only | |
| GET | /api/hierarchy/tree | ✅ all roles | Site→Building→Floor tree |

---

## Authentication

```
POST /api/auth/login
Content-Type: application/json

{"username": "admin_test", "password": "Test@1234"}
```

Response:
```json
{"token": "eyJ...", "expiry": "2026-05-27T..."}
```

ใช้ token ใน header:
```
Authorization: Bearer eyJ...
```

---

## Test Accounts

| username | role | password |
|---|---|---|
| admin | admin | Admin@1234 |
| admin_test | admin | Test@1234 |
| user_test | user | Test@1234 |
| viewer_test | viewer | Test@1234 |

---

## Bruno Collections (in `/bruno/`)

| Collection | Purpose |
|---|---|
| `auth/` | Login |
| `phase8-tests/` | Error sanitization + basic RBAC tests |
| `phase10-rbac-tests/` | Full role matrix — 17 tests (RBAC01–17), all PASS |
| `buildings/`, `racks/` etc. | Per-entity CRUD examples |

---

## Known Issues / Deferred

| Item | Priority | Notes |
|---|---|---|
| GET /api/hierarchy/tree — role scope TBD | Low | Viewer sees full tree? Or filtered? |
| Refresh token endpoint | Low | JWT is 8h — not needed unless frontend reports UX issue |
| Pagination | Low | Only needed if device count > 500 |
| Webhook delivery for alert_logs | Low | `webhook_sent` column exists, no delivery logic yet |
| Rate limiter is in-memory | Note | Single-server only — if multi-server needed, migrate to Redis |

---

## Key Files

| Path | What it is |
|---|---|
| `BNO_Survei_MonitorAPI/BNO_Survei_MonitorAPI/Controllers/` | All API controllers |
| `BNO_Survei_MonitorAPI/BNO_Survei_MonitorAPI/Filters/JwtAuthFilter.cs` | Global JWT auth filter |
| `BNO_Survei_MonitorAPI/BNO_Survei_MonitorAPI/App_Start/WebApiConfig.cs` | CORS + filter registration |
| `review/ROLE_MATRIX.md` | Confirmed role matrix spec |
| `review/PHASE10_SESSION_2026-05-27.md` | Latest session log |
| `bruno/phase10-rbac-tests/` | 17 RBAC verification tests |

---

*Last updated: 2026-05-27. Phase 10 complete. Next: Phase 11 (TBD — see deferred list above).*
