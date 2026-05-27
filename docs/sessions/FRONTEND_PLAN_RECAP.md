# Frontend Plan Recap -- 2026-05-27

**Purpose:** Context document for switching machines (home computer).  
**Status:** Backend Phase 13 complete. Frontend not started. This file = starting brief.

---

## Phase 13 Note

Phase 13 = reflection-based endpoint security gate (`scripts/Check-EndpointSecurity.ps1`).  
**No adversarial review was done. No HTTP test was needed.**  
The script IS the test -- it ran and produced 43/43 PASS. Done.

---

## Where We Are

| Layer | Status |
|---|---|
| Backend (Phases 7-13) | **Complete** -- maintenance mode only |
| Frontend | **Not started** -- planning approved, ready to build |

---

## Approved Frontend Stack

| Tool | Purpose |
|---|---|
| React + Vite | UI framework + dev server |
| React Router | Client-side routing |
| Axios | HTTP client (handles JWT headers) |
| Zustand | Auth state (token + role) |
| React Flow | Topology page (HQ + Sites nodes) |
| Recharts | Dashboard charts |
| Konva.js / CSS absolute | Floor plan drag-and-drop camera pins |

---

## Approved MVP Pages (12 pages)

| # | Route | Role | Description |
|---|---|---|---|
| 1 | `/login` | Public | JWT login form |
| 2 | `/` (Topology) | All | React Flow: HQ center, sites around it, status badges |
| 3 | `/sites/:id` | All | Site overview -- buildings as cards with alert count |
| 4 | `/sites/:id/buildings/:bid` | All | Building detail -- floors list with camera counts |
| 5 | `/floors/:id/plan` | All | Floor plan -- camera pins on image, drag to reposition (admin/user) |
| 6 | `/rooms/:id` | admin + user | Room detail -- rack layout |
| 7 | `/racks/:id` | admin + user | Rack detail -- U-level device positions |
| 8 | `/cameras/:id` | admin | Camera detail -- specs + NVR channel |
| 9 | `/dashboard` | admin | Summary stats + charts |
| 10 | `/users` | admin | User list + role management |
| 11 | `/alerts` | admin | Alert log table |
| 12 | `/quick-add` | admin + user | Quick Add Camera modal |

---

## Key Architecture Decisions (Approved)

### 1. Dynamic Sidebar
Sidebar content changes per layer:
```
/ (Topology)    --> Sites list
/sites/:id      --> Buildings in that site
/buildings/:id  --> Floors in that building
/floors/:id     --> Rooms (or camera list)
/rooms/:id      --> Devices in rack
```
Each layer has a "go up" button. Quick Add appears on every layer.

### 2. Renderer Pattern (No Isometric in MVP)
Site Overview and Building Detail use **card lists in MVP**.  
Isometric view is deferred to post-MVP via renderer pattern:
```jsx
<BuildingRenderer renderer="cards" />     // MVP
<BuildingRenderer renderer="isometric" /> // Post-MVP swap -- no data layer change
```

### 3. Camera Positions = Percentages (0.0-1.0)
- `cameras.x` and `cameras.y` stored as percentages, NOT pixels
- Origin = top-left of floor plan image
- `NULL` = camera not placed yet --> show in "unplaced" list
- Drag-drop saves to `PATCH /api/cameras/{id}/position`
- Multiply by rendered image size to get pixel position

### 4. Floor Plan Upload = Manual File Copy + Register Path
- IT admin copies image to server at `/uploads/floor_plans/site-{id}/building-{id}/floor-{id}/v{N}.png`
- UI calls `POST /api/floor-plans/validate-path` first (6-layer security check)
- Then calls `POST /api/floor-plans` to register (TOCTOU re-validate inside)
- Old plans kept (not deleted) for audit/rollback

### 5. Flat Routes + Breadcrumb from API
All routes are flat (`/rooms/123` not `/sites/1/buildings/2/floors/3/rooms/123`).  
Breadcrumb calls `GET /api/rooms/{id}/breadcrumb` --> `[{type, id, name}, ...]`

### 6. Topology = HQ + Sites Only
React Flow shows HQ center node + site nodes only.  
Do NOT add device-level nodes -- scale breaks at 30+ devices.  
If sites > 30 --> group by region.

---

## Backend API -- What Frontend Needs to Know

### Auth
```
POST /api/auth/login
Body: { "username": "...", "password": "..." }
Response: { "token": "eyJ...", "role": "admin", "displayName": "Ran", "expiresIn": 28800 }

Token expires in 8 hours. No refresh endpoint.
On 401 --> redirect to /login.
```

### Token Storage Decision (NOT YET DECIDED)
- `localStorage` -- simpler, XSS risk
- `httpOnly cookie` -- more secure, needs CORS `supportsCredentials: true` on backend

**Pick one before writing auth code.**

### CORS Origins (Dev)
```
http://localhost:5173   (Vite default)
http://localhost:3000
http://localhost:5174
```
If running on a different port, update `Web.config` on the backend.

### Key Endpoints

| Method | URL | Auth | Description |
|---|---|---|---|
| POST | `/api/auth/login` | None | Login --> JWT |
| GET | `/api/auth/me` | Any | Current user info |
| GET | `/api/hierarchy/tree` | Any | Full Site>Building>Floor>Room tree in 1 call |
| GET | `/api/dashboard/summary` | admin | Aggregate counts (cameras, NVRs, alerts) |
| GET | `/api/status/devices` | Any | Polling endpoint -- status + last_seen only |
| PATCH | `/api/cameras/{id}/position` | admin/user | Update x/y position |
| GET | `/api/floors/{id}/floor-plan/image` | Any | Binary image (needs Auth header!) |
| POST | `/api/floor-plans/validate-path` | admin | Validate file path (6-layer) |
| POST | `/api/floor-plans` | admin | Register floor plan |

### Error Format
```json
{ "Message": "Human-readable error string" }
```

| Status | Meaning | Frontend action |
|---|---|---|
| 400 | Validation error | Show `Message` to user |
| 401 | Token expired/missing | Redirect to /login |
| 403 | Wrong role | Show "Access denied" |
| 404 | Not found | Show 404 page or empty state |
| 500 | Server error | Show generic "Something went wrong" |

---

## Gotchas -- Things That Will Bite You

### 1. Floor plan image needs Auth header
```js
// WRONG -- gets 401
<img src="/api/floors/1/floor-plan/image" />

// RIGHT
const blob = await axios.get('/api/floors/1/floor-plan/image', {
  responseType: 'blob',
  headers: { Authorization: `Bearer ${token}` }
});
const url = URL.createObjectURL(blob.data);
<img src={url} />
```

### 2. `last_seen` is UTC
```js
// Always convert before display
new Date(device.last_seen + 'Z').toLocaleString('th-TH')
```

### 3. Alert messages are in Thai
`alert_logs.message` contains Thai text (`"camera 'CAM-01' ไม่ตอบสนอง 3 รอบติดต่อกัน"`).  
Decide: keep Thai, or ask backend to switch to English.

### 4. DELETE uses POST, not HTTP DELETE
```
POST /api/cameras/delete/{id}   <-- correct
DELETE /api/cameras/{id}         <-- not implemented
```

### 5. Save = array, Update = single object
```js
// Save (POST) -- wrap single item in array
axios.post('/api/cameras', [{ name: 'CAM-01', ... }])

// Update (POST /{id}) -- single object
axios.post('/api/cameras/5', { name: 'CAM-01-updated', ... })
```

### 6. Camera x/y starts as NULL
Cameras have no position until someone places a pin on the floor plan.  
```js
if (camera.x === null) {
  // Render in "Unplaced cameras" list, NOT on map
}
```

### 7. No pagination on any endpoint
All lists return full results. Fine for < 500 devices. Will need pagination later.

### 8. Do NOT show `poe_used_w` or `rack.max_power_w`
These fields exist in DB but values are blank (require physical measurement).  
Hide them from UI entirely for now.

---

## Role Matrix -- Frontend Display Rules

> Source of truth: `review/ROLE_MATRIX.md` -- confirmed by Ran, implemented Phase 10.
> **All write operations are admin only. No exceptions.**

| Element | admin | user | viewer |
|---|---|---|---|
| See cameras / NVRs / devices | YES | **NO** (hide page) | **NO** (hide page) |
| See rooms / racks | YES | YES | **NO** |
| Edit/Delete buttons (any resource) | Show | **Hide** | **Hide** |
| Camera pin drag-and-drop | Allow | **Disable** (403 if attempted) | **Disable** |
| User management page | Show | **Hide** | **Hide** |
| Floor plan upload | Show | **Hide** | **Hide** |
| Alert / audit / ping logs | Show | **Hide** | **Hide** |
| Dashboard page | Show | **Hide** | **Hide** |

```js
const { user } = useAuthStore();
const isAdmin = user?.role === 'admin';
const canSeeDevices = user?.role === 'admin';          // cameras, NVRs, switches
const canSeeRooms   = user?.role === 'admin' || user?.role === 'user';

// All write actions gated to admin only
{isAdmin && <EditButton />}
{isAdmin && <DeleteButton />}
{isAdmin && <DragPin />}
{isAdmin && <UserManagementLink />}
```

---

## Approved MVP Roadmap

Based on FRONTEND_PLAN_REVIEW_V2_1.md (the approved version):

| Week | Focus |
|---|---|
| 1 | Setup (Vite + React + Router + Axios + Zustand), Login page, auth store, token flow |
| 2 | Topology page (React Flow), Hierarchy sidebar, Site Overview cards |
| 3 | Building Detail, Floor Plan view (image + unplaced list) |
| 4 | Floor Plan edit mode (pin drag-drop, PATCH position), Floor Plan upload |
| 5 | Dashboard, Alert logs, Quick Add Camera modal |
| 6 | User management, polish, bug fixes, demo prep |

---

## Open Questions (Decide Before Coding)

1. **Token storage** -- `localStorage` or `httpOnly cookie`?
2. **Production URL** -- What intranet URL will frontend deploy to? (affects CORS)
3. **Alert language** -- Thai or English in `alert_logs.message`?
4. **Floor plan image dimensions** -- Use `width`/`height` from API response, or measure from rendered `<img>` element?
5. **Polling strategy** -- 30-second interval timer, or something smarter?

---

## Files to Read When Starting

| File | Why |
|---|---|
| `review/FRONTEND_HANDOFF.md` | Full backend API contract -- read this first |
| `review/ROLE_MATRIX.md` | Confirmed RBAC access matrix |
| `review/FRONTEND_PLAN_REVIEW_V2_1.md` | Full approved plan + wireframe review |
| `README.md` | Quick start + endpoint list |
| `bruno/` | All API test examples -- use these to understand request/response shapes |

---

*Generated 2026-05-27. Context for home computer session. Next task: start frontend Phase F1 (setup + login).*
