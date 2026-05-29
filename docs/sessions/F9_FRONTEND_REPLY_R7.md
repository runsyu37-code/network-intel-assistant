# F9 Round 7 — Frontend Reply

> **Date:** 2026-05-29
> **From:** Frontend Team (Ran)
> **To:** Backend Team
> **Re:** API Wiring Progress — 7/12 pages done

---

## Status Update — API Wiring

ต่อจาก R6 (BuildingMapPage) — session วันที่ 2026-05-29 ทำต่อหลังพรีเซ็น

### Pages wired to real API (this session)

| Page | Route | API Used | Commit |
|---|---|---|---|
| CamerasPage | `/dashboard/cameras` | `GET /api/cameras` + `GET /api/sites` | `c727461` |
| NVRsPage | `/dashboard/nvrs` | `GET /api/nvrs` + `GET /api/sites` | `c727461` |
| SwitchesPage | `/dashboard/switches` | `GET /api/poe-switches` + `GET /api/sites` | `c727461` |
| SitesPage | `/dashboard/sites/:siteId` | `GET /api/hierarchy/tree` | `c727461` |
| NVRDetailPage | `/dashboard/nvrs/:id` | `GET /api/nvrs?NVR_ID=` | `efc4ac8` |
| SwitchDetailPage | `/dashboard/switches/:id` | `GET /api/poe-switches?SW_ID=` | `efc4ac8` |
| UsersPage | `/dashboard/users` | `GET /api/users` | `efc4ac8` |

**Total wired: 7/12 pages** (+ BuildingMapPage from R6 = 8 including map)

---

## Pages Still on Mock (deadline: 2026-06-04)

| Page | API Needed |
|---|---|
| BuildingDetailPage | `GET /api/buildings/{id}` + `GET /api/floors?Building_ID=` |
| FloorPlanPage | `GET /api/floors/{id}` + `GET /api/floor-plans?Floor_ID=` + cameras |
| RacksListPage | `GET /api/racks` + `GET /api/sites` |
| RackDetailPage | `GET /api/racks/{id}` |

---

## API Behavior Notes (discovered during wiring)

- **NVR / Switch single-item:** `?NVR_ID=` / `?SW_ID=` query param works correctly — no issue
- **`last_seen` UTC:** must append `'Z'` before parsing: `new Date(ts + 'Z')` — done on frontend side
- **`GET /api/users`:** 403 if not admin — frontend handles gracefully (empty list)
- **`GET /api/hierarchy/tree`:** works great for SitesPage — returns nested buildings+floors with camera/alert counts
- **HDD data:** API returns `hdd_total_tb` + `hdd_used_pct` — frontend simulates single drive entry from these two fields. Good enough for now.

---

## Request to Backend (optional — low priority)

No new endpoints needed before 2026-06-04. All existing endpoints are sufficient.

One nice-to-have for after the deadline: if `GET /api/buildings` could return `warning_count` + `offline_count` separately (not just `alert_count`), BuildingMapPage could show 3-color markers (green/yellow/red). Currently using 2-color only.

---

## Resume Instructions — Frontend (branch: `frontend`)

```powershell
git checkout frontend
git pull origin frontend
npm install
npm run dev   # → http://localhost:3001
```

**Next session tasks (in order):**
1. Wire `BuildingDetailPage` → `getBuildings({ Building_ID })` + `getFloors({ Building_ID })`
2. Wire `RacksListPage` → `getRacks()` + `getSites()` (group by site)
3. Wire `RackDetailPage` → `getRackById(id)` (rack slot layout stays mock — no slot API)
4. Wire `FloorPlanPage` → `getFloors()` + `getFloorPlanImage()` + `getCameras({ Floor_ID })`

**Key files for next session:**
- `src/api/hierarchy.ts` — `getBuildings()`, `getFloors()`, `getRacks()`, `getRackById()` already implemented
- `src/api/types.ts` — `FloorApi`, `RackApi` types already defined
- `src/pages/BuildingDetailPage.tsx` — currently mock, wire next
- `BACKLOG.md` — full task list with API endpoints

---

## Resume Instructions — Backend (branch: `backend`)

```powershell
# Open in Visual Studio:
BNO_Survei_MonitorAPI\BNO_Survei_MonitorAPI.sln
# Copy Web.config from template if needed
# F5 → runs on localhost:44342
```

**No backend changes needed** before 2026-06-04 — all required endpoints exist.

Pending (lower priority):
- Run `db/migration_add_building_latlong.sql` on the real DB if not done yet (lat/lng for map)
- `SitesCrudPage` POST/DELETE endpoints — not urgent, CRUD is local-only for now
