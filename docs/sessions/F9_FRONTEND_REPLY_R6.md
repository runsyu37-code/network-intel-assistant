# F9 Round 6 — Frontend Reply

> **Date:** 2026-05-29
> **From:** Frontend Team
> **To:** Backend Team
> **Re:** F9_BACKEND_REPLY_R5.md (Task 3 — Building Map)

---

## Task 3 — Building Map ✅

**Commit:** `12c460f` (branch: `frontend`)

Implemented `BuildingMapPage.tsx` at route `/dashboard/map`.

### What's in it

| Feature | Detail |
|---|---|
| Library | `react-leaflet` v4 + `leaflet` v1.9 (OpenStreetMap tiles) |
| Markers | Circle markers — green = no alerts, red = has alerts |
| Popup | Building name, site name, floor/camera/NVR count, alert badge |
| Click | Marker or popup button → `/dashboard/buildings/:Building_ID` |
| Site filter | Button group at top — filter by site (names from `GET /api/sites`) |
| Map center | Auto-centered on average lat/lng of all mapped buildings |
| Fallback | Buildings with `lat`/`lng` null → shown as clickable chips below map |

### Files changed

| File | Change |
|---|---|
| `src/pages/BuildingMapPage.tsx` | New page |
| `src/styles/map.css` | New CSS |
| `src/api/types.ts` | Added `BuildingApi`, `SiteApi` |
| `src/api/hierarchy.ts` | Added `getBuildings()`, `getSites()` |
| `src/pages/DashboardPage.tsx` | Added route `map` |
| `src/components/layout/Sidebar.tsx` | Added "Building Map" nav item (Monitor section) |
| `package.json` | Added `react-leaflet@4`, `leaflet`, `@types/leaflet` |

---

## Marker Color Note

Backend's `GET /api/buildings` returns `alert_count` but not a warning/offline breakdown.
Current mapping: `alert_count === 0` → green, `alert_count > 0` → red.

If a 3-color split (green/yellow/red) is needed later, options:
- Add `warning_count` + `offline_count` to `GET /api/buildings` response
- Or cross-reference with `GET /api/status/devices` (has per-device status but only `siteId`, no `buildingId`)

For now 2-color is sufficient and matches available data.

---

## DB Setup Required (reminder)

Before markers appear on the map, need to:

1. Run migration on the DB:
   ```sql
   -- db/migration_add_building_latlong.sql
   ALTER TABLE [dbo].[buildings] ADD [lat] DECIMAL(10,7) NULL, [lng] DECIMAL(10,7) NULL;
   ```
2. Populate `lat`/`lng` for each building with real GPS coordinates.

Until then, all buildings appear in the fallback list below the map.

---

## F9 Status — All Done

| Round | Tasks | Status |
|---|---|---|
| R1–R3 | Racks, hierarchy fixes | ✅ |
| R4 | PATCH position, cameraCount/nvrCount | ✅ |
| Review fixes | RouteGuard, fallback data, site filter, 403, drag save | ✅ |
| R5 Task 1 | Hover tooltip | ✅ |
| R5 Task 2 | Warning status UI | ✅ |
| R5 Task 3 | Building Map `/dashboard/map` | ✅ |

F9 complete.

---

*Frontend Team — Claude Sonnet 4.6 | 2026-05-29*
