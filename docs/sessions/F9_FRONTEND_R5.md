# F9 Round 5 — Backend → Frontend Spec

> **Date:** 2026-05-29
> **From:** Backend Team
> **To:** Frontend Team
> **Priority:** Mixed — see per-task priority below

---

## Summary

3 new tasks. Two are mostly frontend, one requires backend change first (warning logic). Backend will ship the ping warning change in this same session — frontend can build against it immediately.

---

## Task 1 — Hover Tooltip on Device Pins / Cards

**Priority:** 🟡 Medium
**Who:** Frontend only — no backend change needed
**Data:** Already in existing API responses

### What it should do

When a user holds the mouse over a device (camera pin on floor plan, camera card in list, rack device row), show a popover/tooltip with key device info — no click required.

### Minimum fields to show

| Context | Fields |
|---|---|
| Floor plan camera pin | `device_name`, `ip_address`, `status`, `brand`, `last_seen` |
| Cameras list row | `serial_no`, `mac_address`, `install_location`, `nvr_channel` |
| NVRs list row | `ip_internet` (ETH1), `ip_cctv` (ETH2), `brand`, `status` |
| Rack detail device row | `ip_address`, `status`, `brand`, `poe_port_number` (if camera) |

### Files to change (frontend)

```
src/pages/FloorPlanPage.tsx          ← add onMouseEnter/Leave on camera pin div
src/pages/CamerasPage.tsx            ← add Tooltip wrapper on table row or card
src/pages/NvrsPage.tsx               ← same pattern
src/pages/RacksPage/ or RackDetailPage.tsx  ← devices list rows
```

Use Ant Design `<Tooltip>` or `<Popover>` — already in the stack.

---

## Task 2 — Ping Warning State (2 fails = warning, 3 fails = offline + alert)

**Priority:** 🔴 High
**Who:** Backend (done) + Frontend (needs update)

### Backend change — already shipped

`PingService` now sets status to `"warning"` after 2 consecutive ping failures instead of going straight to `"offline"`. Alert is only created at 3 failures.

| fail_count | New status | Alert created? | Discord sent? |
|---|---|---|---|
| 1 | `"warning"` | No | No |
| 2 | `"warning"` | No | No |
| 3+ | `"offline"` | Yes | Yes |
| ping OK | `"online"` | No (resolves existing) | No |

### What frontend needs to handle

`"warning"` is now a valid status value returned by:
- `GET /api/cameras`
- `GET /api/nvrs`
- `GET /api/poe-switches`
- `GET /api/status/devices`
- `GET /api/dashboard/summary` (aggregate counts)

### UI rules

| Status | Color | Icon | Badge |
|---|---|---|---|
| `"online"` | Green | ✅ | `success` |
| `"warning"` | Yellow/Orange | ⚠️ | `warning` |
| `"offline"` | Red | 🔴 | `error` |

- Warning devices should appear in the dashboard alert feed (different style from offline — softer, no bell sound if any)
- Floor plan camera pin: show yellow pin color for warning
- Status filter dropdowns: add `"warning"` as a filter option alongside `"online"` / `"offline"`

### Files to change (frontend)

```
src/pages/CamerasPage.tsx            ← status badge + filter dropdown
src/pages/NvrsPage.tsx               ← status badge + filter dropdown
src/pages/SwitchesPage.tsx           ← status badge + filter dropdown
src/pages/FloorPlanPage.tsx          ← pin color (green/yellow/red)
src/pages/DashboardPage.tsx          ← alert feed — show warning devices separately
src/components/StatusBadge.tsx       ← if extracted as component, add warning case
src/pages/RackDetailPage.tsx         ← device status in rack
```

---

## Task 3 — Building Map (Top-Down / Satellite View)

**Priority:** 🟢 Lower — needs design decision first
**Who:** Frontend mostly, backend may need new fields

### What it should show

A top-down "satellite-style" view of the campus showing:
- Building footprints (rectangles or shapes) positioned on a canvas
- Per-building device count + status summary (how many online/warning/offline)
- Click a building → navigate to building detail

### Two options — choose one before building

**Option A — Fixed layout (no GPS, frontend draws it)**
- Frontend draws buildings as positioned rectangles on a canvas/SVG
- Positions are hardcoded or stored in a config file on the frontend
- No backend change needed
- Good for: single campus, layout doesn't change
- Limit: positions are manually maintained

**Option B — GPS coordinates (real map)**
- Buildings get `lat` and `lng` columns in DB
- Backend: new migration + expose via `GET /api/buildings`
- Frontend: use Leaflet + OpenStreetMap (or satellite tile layer)
- Good for: multiple sites, accurate real-world positions
- Limit: need to enter real GPS coordinates per building

### Backend — what GET /api/buildings currently returns

```json
{
  "Building_ID": "B01",
  "Site_ID": "S01",
  "name": "อาคาร A",
  "code": "BLD-A",
  "floor_count": 4,
  "alert_count": 2
}
```

Does NOT include `lat`, `lng`, `width_m`, `height_m` — those would need to be added if Option B.

### Recommendation

Start with Option A (fixed SVG layout) to unblock the feature. If the system is deployed across multiple real sites, migrate to Option B later. Backend will add `lat`/`lng` fields on request.

### Files to change (frontend)

```
src/pages/SitesPage.tsx or new src/pages/BuildingMapPage.tsx
src/components/BuildingMap.tsx       ← new component (SVG or Leaflet canvas)
src/router/                          ← add route if new page
```

---

## API Reference — No New Endpoints Needed for Task 1 and 2

Existing endpoints are sufficient:

| Endpoint | Used for |
|---|---|
| `GET /api/cameras?Floor_ID=` | Floor plan pins (includes position_x/y now) |
| `GET /api/status/devices` | Dashboard polling — returns status per device |
| `GET /api/dashboard/summary` | Overview counts per site |
| `GET /api/hierarchy/tree` | Site → Building → Floor tree |

For Task 3 Option B, backend will need to add a migration and update `GET /api/buildings`.

---

## Fix Plan Reminder (from review — still pending)

These from the review fix plan are still open and should be done before or alongside R5:

| Fix | Phase |
|---|---|
| F1-1: RouteGuard + NotAuthorizedPage | 1 — blocking |
| F1-2: FloorPlanPage edit mode role guard | 1 — blocking |
| F2-2: Remove fallback data (all pages) | 2 |
| F2-3: Fix site filter | 2 |
| F3-1: Handle 403 in Axios interceptor | 3 |
| F3-2: Floor plan image decision | 3 |

---

*Backend: Ran | Builder: Claude Sonnet 4.6 | 2026-05-29*
