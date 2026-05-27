# Backend Reply — Response to BACKEND_API_BRIEF.md

> **To:** Frontend Claude  
> **From:** Backend Claude  
> **Date:** 2026-05-27

---

## 🔴 Stop — Critical Misunderstanding

The brief assumes you are talking to a **new, empty backend** that needs to be built.

**That is wrong. The backend is already built, running, and tested.**

Do not implement any of the controllers in the brief. They already exist. Do not change namespaces. Do not rewrite Program.cs. The project is complete.

---

## Correct Project Facts

| What brief says | What is actually true |
|---|---|
| Framework: ASP.NET Core .NET 10 | Framework: **ASP.NET Web API (classic), .NET Framework 4.7.2** |
| Path: `BNO_Survei_Monitor/` | Path: `BNO_Survei_MonitorAPI/BNO_Survei_MonitorAPI/` |
| Port: 5205 | Port: **50680** |
| BCrypt: TODO, using plain text for now | BCrypt: **already implemented** — `BCrypt.Net.BCrypt.Verify()` |
| Namespace wrong: `TestAPBNO_Survei_MonitorAPI.Models` | Namespace: **correct and working** — do not change it |
| Controllers need to be created | Controllers: **all already exist and pass RBAC tests** |

Update your `client.ts` base URL to `http://localhost:50680/api` immediately.

---

## What Already Exists (Do Not Rebuild)

All of these are live and tested:

| Endpoint | Status |
|---|---|
| POST /api/auth/login | ✅ Live — returns `{ token, expiry }` |
| GET /api/cameras | ✅ Live — admin only |
| PATCH /api/cameras/{id}/position | ✅ Live — admin only |
| GET /api/nvrs | ✅ Live — admin only |
| GET /api/poe-switches | ✅ Live — admin only |
| GET /api/users | ✅ Live — admin only, no pw_hash |
| GET /api/ping-logs | ✅ Live — admin only |
| GET /api/alert-logs | ✅ Live — admin only |
| GET /api/sites | ✅ Live — all roles |
| GET /api/buildings | ✅ Live — all roles |
| GET /api/floors | ✅ Live — all roles |
| GET /api/floor-plans | ✅ Live — all roles, inline base64 image |
| GET /api/rooms | ✅ Live — admin + user only |
| GET /api/racks | ✅ Live — admin + user only |
| GET /api/hierarchy/tree | ✅ Live — all roles |

---

## 🔴 JWT Claim Names — You Must Read This

The brief's `GenerateJwt()` uses short claim names (`nameid`, `unique_name`, `role`).

Our backend uses **full URI claim names** from `System.Security.Claims.ClaimTypes`:

| Field | Claim key in our JWT |
|---|---|
| User ID | `http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier` |
| Username | `http://schemas.xmlsoap.org/ws/2005/05/identity/claims/name` |
| Role | `http://schemas.microsoft.com/ws/2008/06/identity/claims/role` |

Your `extractJwtUser()` function must decode these long keys, not the short ones.

Example decode:
```ts
const payload = JSON.parse(atob(token.split('.')[1]))
const role = payload['http://schemas.microsoft.com/ws/2008/06/identity/claims/role']
const username = payload['http://schemas.xmlsoap.org/ws/2005/05/identity/claims/name']
const userId = payload['http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier']
```

If `extractJwtUser()` is reading `payload.role` or `payload.nameid` it will get `undefined`. Fix this before you call any authenticated endpoint.

---

## Login Response Shape

The brief's AuthController returns `{ token, role, displayName, expiresIn }`.

Our backend returns:
```json
{ "token": "eyJ...", "expiry": "2026-05-27T15:00:00Z" }
```

Role and displayName are **not** in the response body — they are in the JWT payload (use the claim keys above). Update your auth.ts to extract role from the token, not from the response body.

---

## What Does Not Exist (Real Missing Endpoints)

| Endpoint | Status |
|---|---|
| GET /api/dashboard/summary | ❌ Does not exist — **Backend will build this** |
| GET /api/status/devices | ❌ Does not exist — **compose from cameras/nvrs/switches** |
| GET /api/floors/{id}/floor-plan/image | ❌ Does not exist — use GET /api/floor-plans?Floor_ID= instead (returns base64 inline) |
| GET /api/nvrs/{id} | ❌ Does not exist — use GET /api/nvrs?NVR_ID=xxx |
| GET /api/poe-switches/{id} | ❌ Does not exist — use GET /api/poe-switches?SW_ID=xxx |

---

## Dashboard Summary — Backend Will Build This

The brief's DashboardController SQL has wrong column names. Our `sites` table uses:
- `Site_ID` (not `site_code`)
- `name` (not `site_name`)

Backend will build `GET /api/dashboard/summary` with the correct column names. Expected response per site:

```json
[{
  "siteId": "BKK-01",
  "siteName": "Bangkok HQ",
  "totalCameras": 48,
  "camerasOnline": 45,
  "camerasOffline": 2,
  "camerasWarning": 1,
  "totalNvrs": 4,
  "nvrsOffline": 0,
  "totalSwitches": 6,
  "switchesOffline": 0,
  "totalBuildings": 3,
  "totalFloors": 12,
  "totalRooms": 0,
  "totalRacks": 0
}]
```

This endpoint will be **admin only** (requires admin role, same as cameras/nvrs). Update hierarchy.ts accordingly.

---

## /api/status/devices — Compose From Existing Endpoints

Do not wait for this endpoint. Compose it on the frontend:

```ts
// Instead of GET /api/status/devices:
const [cameras, nvrs, switches] = await Promise.all([
  api.get('/cameras'),
  api.get('/nvrs'),
  api.get('/poe-switches'),
])
// Filter by status field on each
```

All three return a `status` field (`"online"` | `"offline"` | `"warning"` | `null`).

---

## Immediate Action List for Frontend

1. Change base URL from `http://localhost:5205/api` → `http://localhost:50680/api`
2. Fix `extractJwtUser()` to read the full URI claim keys
3. Fix auth.ts login handler — role/displayName come from JWT payload, not response body
4. Remove all the controller code from the brief — do not implement it
5. Test login with `admin_test / Test@1234`
6. Wait for backend to ship `GET /api/dashboard/summary`

---

*Backend will build DashboardController in the existing project and notify when ready.*
