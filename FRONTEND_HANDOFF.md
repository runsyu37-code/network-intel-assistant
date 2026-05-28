# SSM Backend — Frontend Handoff Brief

**Date:** 2026-05-26  
**Branch:** `backend` (all Phase 7 + Phase 8 fixes merged)  
**API base:** `http://localhost:50680` (IIS Express dev) — production URL TBD  
**Status:** Backend cleared for frontend integration

---

## Questions for Frontend Team

Before you start, the backend team needs answers on these to avoid surprises mid-sprint:

1. **Token storage** — Where will you store the JWT? `localStorage` (simpler, XSS risk) or `httpOnly cookie` (more secure, requires CORS credentials)? Current CORS config uses `origins` only — if you go cookie route, we need to add `supportsCredentials: true` on the backend.

2. **Token expiry handling** — JWT expires after 8 hours. What happens when a user's token expires mid-shift? Will you catch 401 and redirect to login, or show an error? We have no refresh token endpoint — do you need one?

3. **Production origin** — What will the production frontend URL be? CORS origins are currently `http://localhost:5173,http://localhost:3000,http://localhost:5174` from `Web.config`. You need to give us the intranet URL before deploy.

4. **Role UI** — Three roles exist: `admin`, `user`, `viewer`. What UI differences are you planning per role? We need to agree on what `user` can do vs `viewer` so backend RBAC matches frontend hiding.

5. **Device status polling** — `GET /api/status/devices` is designed for 30-second polling. Will you use polling or WebSocket/SSE? We don't have a WebSocket endpoint — polling is the only option currently.

6. **Alert display** — `alert_logs` messages are currently stored in Thai (`ไม่ตอบสนอง X รอบติดต่อกัน`). Do you want backend to switch to English, or will frontend handle localization?

7. **Floor plan image dimensions** — Upload response returns `width` and `height` from the image file. Will you use these for scaling camera pin positions, or calculate from rendered `<img>` element size?

---

## Auth Flow

```
POST /api/auth/login
Body: { "username": "admin", "password": "..." }
Response: { "token": "eyJ...", "username": "admin", "role": "admin", "userId": 1 }

→ Store token
→ All subsequent requests: Authorization: Bearer <token>
→ Token expires in 8 hours (no refresh endpoint)
→ On 401: redirect to /login
```

---

## Role Matrix — What Each Role Can Do

> **Source of truth:** `review/ROLE_MATRIX.md` (confirmed by Ran, implemented Phase 10)

| Endpoint | admin | user | viewer |
|----------|-------|------|--------|
| GET /api/sites, buildings, floors, floor-plans, hierarchy | ✅ | ✅ | ✅ |
| GET /api/rooms, racks | ✅ | ✅ | ❌ 403 |
| GET /api/cameras, nvrs, poe-switches, users, logs, dashboard | ✅ | ❌ 403 | ❌ 403 |
| POST/UPDATE/DELETE any resource (cameras, NVRs, buildings, etc.) | ✅ | ❌ 403 | ❌ 403 |
| PATCH `/api/cameras/{id}/position` | ✅ | ❌ 403 | ❌ 403 |
| POST/UPDATE/DELETE `/api/users` | ✅ | ❌ 403 | ❌ 403 |
| POST `/api/floor-plans` (register floor plan) | ✅ | ❌ 403 | ❌ 403 |
| GET `/api/floors/{id}/floor-plan/image` | ✅ | ✅ | ✅ |

**user role = read-only structural view** (sites down to racks, no device/credential data)  
**viewer role = read-only layout view** (sites down to floor-plans only)  
**All write operations = admin only without exception**

---

## Error Response Format

All errors return JSON with this shape:

```json
{ "Message": "Human-readable error string" }
```

HTTP status codes used:
| Status | Meaning |
|--------|---------|
| 400 | Validation error — check `Message` for details |
| 401 | Token missing, expired, or invalid → redirect to login |
| 403 | Insufficient role for this action |
| 404 | Resource not found |
| 500 | Server error — `Message` is generic, no details exposed |

---

## Key Endpoints — Gotchas

### Hierarchy Tree
```
GET /api/hierarchy/tree
```
Returns full site → building → floor → room → device tree. Used for sidebar nav.
- 3 flat SQL queries + in-memory LINQ nesting — fast for < 500 devices
- Includes per-building alert counts (cameras + NVRs + PoE switches offline)

### Device Status (Polling)
```
GET /api/status/devices?type=camera&type=nvr&type=poe_switch
```
- Designed for 30-second polling
- Returns `id`, `device_type`, `status`, `last_seen`, `fail_count`
- `last_seen` is **UTC** — convert to local time before display

### Floor Plan Image
```
GET /api/floors/{floorId}/floor-plan/image
Requires: Authorization header (JWT)
Returns: image/jpeg or image/png binary
```
⚠️ This is an **authenticated binary endpoint** — you cannot use a plain `<img src="...">` tag. You must either:
- Fetch with auth header → `URL.createObjectURL(blob)` → set as `src`
- Or use a `<img>` with auth via a service worker

### Camera Position
```
PATCH /api/cameras/{id}/position
Body: { "x": 0.35, "y": 0.72 }
```
- `x` and `y` are **percentages (0.0–1.0)**, not pixels
- Multiply by rendered image width/height to get pixel position
- Allowed roles: admin, user only

### Dashboard Summary
```
GET /api/dashboard/summary
```
Returns counts from `vw_dashboard_summary` SQL view:
`total_sites`, `total_buildings`, `total_cameras`, `online_cameras`, `offline_cameras`, `total_nvrs`, `online_nvrs`, `offline_nvrs`, `total_poe_switches`, `online_poe_switches`, `offline_poe_switches`, `open_alerts`

---

## Known Issues / Things That Will Bite You

### 1. Authenticated image tag
`GET /api/floors/{id}/floor-plan/image` requires a JWT header.
A plain `<img src="/api/floors/1/floor-plan/image">` will get 401.
**Fix:** fetch as blob, use object URL.

### 2. `last_seen` is UTC, display times need conversion
```js
// Don't display raw last_seen — convert first
new Date(device.last_seen + 'Z').toLocaleString('th-TH')
```

### 3. alert_logs.message is in Thai
The `message` field in alert logs contains Thai text (e.g., `"camera 'CAM-01' (10.10.1.1) ไม่ตอบสนอง 3 รอบติดต่อกัน"`). If you need English, tell us — we can change PingService.

### 4. No pagination on any endpoint
All list endpoints return full result sets. For large deployments (1000+ cameras) this will be slow. For now the assumption is < 500 devices total.

### 5. Camera PATCH position vs full UPDATE
- `PATCH /api/cameras/{id}/position` → user + admin only, only updates x/y
- `POST /api/cameras/{id}` (full update) → admin + user only, updates ALL fields including `floor_id`
- If you allow drag-and-drop pin placement, use PATCH not POST

### 6. DELETE route pattern
All deletes use `POST` not `DELETE` method:
```
POST /api/cameras/delete/{id}    ✅
DELETE /api/cameras/{id}          ❌ not implemented
```

### 7. Bulk Save vs single-item Update
Save endpoints accept arrays `[{...}, {...}]` — for single item, still wrap in array.
Update endpoints accept a single object `{...}`.

### 8. Camera position on floor plan — NULL until pinned in web
`cameras.x` and `cameras.y` are stored as percentages (0.0–1.0) relative to the floor plan image.
They start as `NULL` — no camera has a position until someone drags a pin onto the floor plan in the web UI.

**What frontend needs to handle:**
- If `x`/`y` is `null` → show camera in an "unplaced" list, not on the map
- Pin placement calls `PATCH /api/cameras/{id}/position` with `{ "x": 0.35, "y": 0.72 }`
- Only `admin` and `user` roles can place pins — `viewer` gets 403

### 9. Rack position in room — NULL until placed in web
`rooms` has layout fields `x`, `y`, `w`, `h` (pixel coords of the room on the floor plan) and `width_m`, `length_m` (physical size).
`racks` themselves don't have their own x/y — rack position within a room is determined by `Room_ID` (which room it's in) and will be set by drag-and-drop in the web room layout editor.

**These fields start as NULL in the DB.** Don't assume a room has layout coordinates — check before rendering.

### 10. PoE watt fields — stored but NOT displayed yet
`poe_switches` has two watt fields:
- `poe_budget_w` — max budget from spec sheet (static, in DB)
- `poe_used_w` — actual usage, requires **manual per-device measurement** (walk to each switch and read)

**Do not show `poe_used_w` in any UI for now.** The data exists in the DB/Excel template but values will be blank until someone physically measures each switch. This will be a separate feature later.
`poe_budget_w` can be displayed as-is (it comes from the spec sheet at setup time).

### 11. Rack power (`max_power_w`) — stored but NOT displayed yet
`racks.max_power_w` is the rated max power of the rack cabinet.
Same situation as `poe_used_w` — field exists in the DB, value may be blank if not filled at setup.
Do not show rack power consumption in any UI for now. Will be a separate feature later.

---

## CORS — Allowed Origins (Dev)

```
http://localhost:5173
http://localhost:3000
http://localhost:5174
```

If you run on a different port, tell us and we'll add it to `Web.config`.

---

## Bruno Collection

Test requests are in `bruno/` — import into Bruno app.
Set environment variable `admin_token` to your JWT after login.
Collections: `auth`, `sites`, `buildings`, `floors`, `cameras`, `nvrs`, `poeSwitches`, `racks`, `rooms`, `devices`, `pingLogs`, `alertLogs`, `auditLogs`, `syncLogs`, `users`, `phase8-tests`

---

*Generated 2026-05-26. Backend: Ran. Frontend questions go to backend team before sprint start.*
