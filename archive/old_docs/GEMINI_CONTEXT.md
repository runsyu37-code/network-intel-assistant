# SSM Surveillance Monitor — Project Context for External Review

## What Is This Project?

**SSM (Surveillance Site Monitor)** is an internal web dashboard for a network operations team to monitor CCTV cameras, NVRs, and PoE switches across multiple physical sites (buildings, floors, rooms, racks).

- **Stack:** ASP.NET Web API 5.x (.NET Framework 4.8) backend + React 18 + TypeScript frontend (not started yet)
- **DB:** SQL Server (on-premise)
- **Auth:** JWT HS256, 8-hour expiry, BCrypt password hashing
- **Users:** ~10–30 internal staff (admin, user, viewer roles)
- **Not public-facing** — internal LAN only

---

## Current Phase

**Phase 7 — Week 0 (Backend prep before React starts)**

Phase 6 (CRUD endpoints) was already complete. Week 0 is adding what the frontend *actually needs* before it can be built:

| # | Item | Status |
|---|------|--------|
| 1 | CORS config | ✅ Done |
| 2 | JWT Auth (login endpoint + filter) | ✅ Done |
| 3 | Swagger UI | ✅ Done |
| 4 | Rename all routes to kebab-case | ✅ Done |
| 5 | Aggregate endpoints (hierarchy tree, device status, breadcrumb, dashboard summary) | ✅ Done |
| 6 | `PATCH /api/cameras/{id}/position` | ✅ Done |
| 7 | Floor plan upload endpoints | ✅ Done |
| 8 | Schema migration SQL (cameras + floor_plans table) | ✅ Written, pending SSMS run |
| 9 | Stress mock data (1000+ rows) | ⏳ Pending |
| 10 | Bruno test collections update | ⏳ Pending |

---

## Architecture Decisions Made

### 1. Framework Choice — ASP.NET Web API 5.x (NOT .NET Core)
- Existing codebase was already .NET Framework 4.8
- No migration budget or timeline
- **Risk acknowledged:** no modern middleware pipeline, no minimal API style

### 2. JWT Implementation
- Algorithm: HS256
- Secret: hardcoded string in `JwtHelper.cs` (flagged for production change)
- Expiry: 8 hours
- Claims: `sub` = User_ID (int), `unique_name` = username, `role`
- No refresh token mechanism

### 3. N+1 Query Solution — 3 Flat Queries + In-Memory Nesting
`GET /api/hierarchy/tree` fetches sites, buildings, floors in 3 separate SQL queries, then nests them in C# using LINQ `GroupBy` + `ToDictionary`.

**Why not a single recursive CTE?** Chosen for simplicity and debuggability. The full dataset is small (<500 sites/buildings/floors combined expected).

### 4. Camera Position — Percentage (0.0–1.0), Not Pixels
Stored as `DECIMAL(10,4)`. Chosen so coordinates are resolution-independent when floor plan images are resized.

### 5. Floor Plan Versioning — Separate Table
`floor_plans` table separate from `cameras`. One row per upload, soft-deactivation (`is_active = 0`) on new upload. Unique filtered index ensures only one active plan per floor.

### 6. Floor Plan Upload — 6-Layer Validation
1. JWT auth (global filter)
2. Role = admin only
3. Floor must exist in DB
4. File extension whitelist (.jpg, .jpeg, .png)
5. File size ≤ 10 MB
6. Magic byte verification (actual file header matches declared type)

**TOCTOU mitigation:** Write to `.tmp` file first, then `File.Move()` atomically.

### 7. Renderer Pattern — MVP vs Phase 8
- **Phase 7 MVP:** Site/Building overview uses `renderer="cards"` (CardListRenderer) — React components, no canvas
- **Phase 8:** Swap to `renderer="isometric"` (IsometricRenderer, Pixi.js) — same data layer, only renderer changes
- Isometric 3D is **deferred, not cancelled**

### 8. "Quick Add" Sidebar Feature
Technician shortcut for camera registration (was called "My Devices", renamed).

---

## Reviews Completed

### Review V1 — Initial Frontend Plan Review
**Key findings:**
- P0 blockers before frontend: CORS missing, no JWT, N+1 queries everywhere, no aggregate endpoints
- Estimated Week 0 at 8–10 days
- Recommended kebab-case routes

**Conclusion:** Frontend cannot start until Week 0 is done. All P0 items listed.

### Review V2 — Round 2 Feedback
**Key findings:**
- Isometric 3D questioned → decision: defer to Phase 8, not cancel (Renderer Pattern)
- Camera position must be percentage not pixels
- "My Devices" renamed to "Quick Add"
- floor_plans needs its own table (not inline in cameras)

**Conclusion:** Architecture solidified. Renderer Pattern accepted. Phase 8 timeline TBD.

### Review V2.1 — Security Deep Dive
**Key findings:**
- Floor plan upload needs 6-layer validation (not just MIME check)
- TOCTOU attack vector identified — write-to-temp-then-move pattern required
- Single IT admin model for uploads (not per-user)
- Magic byte verification mandatory (MIME headers can be spoofed)

**Conclusion:** Upload security spec finalized. All 6 layers implemented in `floorPlansController.cs`.

---

## Database Schema (Relevant Portions)

```sql
-- Existing
sites         (Site_ID NVARCHAR PK, name, code, location)
buildings     (Building_ID NVARCHAR PK, Site_ID FK, name, code, floor_count)
floors        (Floor_ID NVARCHAR PK, Building_ID FK, floor_number, name, main_function)
rooms         (Room_ID NVARCHAR PK, Floor_ID FK, name)
racks         (Rack_ID NVARCHAR PK, Room_ID FK, name)
cameras       (id INT PK, Site_ID, Building_ID, Floor_ID, device_name, status, ...)
nvrs          (NVR_ID NVARCHAR PK, ...)
poe_switches  (SW_ID NVARCHAR PK, ...)
users         (User_ID INT PK, username, pw_hash BCRYPT, role, is_active, last_login)

-- Week 0 additions (migration pending)
cameras       + position_x DECIMAL(10,4), position_y DECIMAL(10,4),
                position_set_at DATETIME, position_set_by INT FK users

floor_plans   (floor_plan_id INT PK, floor_id FK, image_path, image_width,
               image_height, file_size_bytes, version, uploaded_at, uploaded_by FK,
               is_active BIT)
-- Unique filtered index: only one is_active=1 per floor_id
```

---

## Existing SQL Views (Used by API)
- `vw_camera_full_path` — camera with full site→building→floor path
- `vw_nvr_full_path` — NVR with full path including room/rack
- `vw_switch_full_path` — PoE switch with full path
- `vw_dashboard_summary` — per-site aggregate counts (cameras online/offline/warning, NVRs, switches, buildings, floors, rooms, racks)

---

## API Endpoints Summary (After Week 0)

### Auth
| Method | Route | Auth |
|--------|-------|------|
| POST | `/api/auth/login` | Public |
| GET | `/api/auth/me` | JWT |

### Hierarchy & Status (New)
| Method | Route | Auth |
|--------|-------|------|
| GET | `/api/hierarchy/tree` | JWT |
| GET | `/api/status/devices` | JWT |
| GET | `/api/{type}/{id}/breadcrumb` | JWT |
| GET | `/api/dashboard/summary` | JWT |

### Floor Plans (New)
| Method | Route | Auth |
|--------|-------|------|
| GET | `/api/floors/{floorId}/floor-plan` | JWT |
| POST | `/api/floors/{floorId}/floor-plan` | JWT + Admin |
| DELETE | `/api/floors/{floorId}/floor-plan` | JWT + Admin |

### Camera Position (New)
| Method | Route | Auth |
|--------|-------|------|
| PATCH | `/api/cameras/{id}/position` | JWT |

### CRUD (Existing, renamed to kebab-case)
`/api/cameras`, `/api/nvrs`, `/api/poe-switches`, `/api/sites`, `/api/buildings`, `/api/floors`, `/api/rooms`, `/api/racks`, `/api/alert-logs`, `/api/audit-logs`, `/api/users`, etc.

---

## What Frontend Plans to Build (Phase 7 MVP)

1. **Login page** → JWT stored in `localStorage`
2. **Home / Topology** → calls `/api/hierarchy/tree` + `/api/dashboard/summary`
3. **Site overview** → Card list of buildings (Phase 8 = isometric)
4. **Building detail** → Card list of floors
5. **Floor plan view** → Floor plan image + camera pins draggable (calls `PATCH /position`)
6. **Device detail** → Camera/NVR/switch detail page
7. **Alert log** → Filterable table
8. **Sidebar** → Persistent hierarchy nav + "Quick Add" shortcut

**State management:** Zustand + React Query (TanStack)

---

## Known Risks / Open Questions
1. JWT secret is hardcoded — needs env-var or config-file approach for production
2. No refresh token — 8h expiry, user must re-login
3. `File.Move()` atomicity depends on same-filesystem (temp and dest on same drive) — assumed true for on-premise deployment
4. Floor plan image serving — currently saved to `~/uploads/` inside the API app folder, no CDN
5. Camera position `PATCH` is not role-restricted — any authenticated user can move cameras
6. No rate limiting anywhere
7. `vw_dashboard_summary` — unknown query cost at scale, no index hints documented
