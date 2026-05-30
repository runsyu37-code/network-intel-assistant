# SSM Frontend — Future Features Backlog

> Current status: **DEMO READY** (2026-05-30) — all 13 routes wired to real API.
> See [`DEV.md`](DEV.md) for current session state and open items.

---

## Pending Backend Response

| Issue | Detail |
|---|---|
| Building Map markers | `lat/lng = null` in DB — awaiting backend (F9 R17) |
| Floor plan position restore | `GET /api/cameras` not returning `position_x/y` — awaiting backend |

---

## Future Features (post-demo)

### Site Map — Interactive Edit Mode

| Feature | Detail |
|---|---|
| Edit mode toggle | View/Edit pill like FloorPlanPage — drag buildings on SVG |
| Drag building footprint | Reposition buildings on site map, save to `PATCH /api/buildings/{id}/position` |
| Draw new building block | Drag to define rectangle (x, y, w, h) then fill metadata in modal |
| Resize handle | 8-handle resize per building footprint |

### Other Page Enhancements

| Page | Feature |
|---|---|
| `FloorPlanPage` | Save camera positions to API (`PATCH /cameras/{id}/position`) on drag-end |
| `RacksListPage` | Add / Edit / Delete rack + wire API |
| `CamerasPage` | Add camera, assign to floor |
| `NVRsPage` / `SwitchesPage` | Add / Edit / Delete device |
| `TopologyPage` | Persist site node positions to API instead of localStorage |
| `BuildingDetailPage` | Floor reorder via drag-to-sort |
