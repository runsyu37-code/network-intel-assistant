# F9 Backend Reply — R4

**Date:** 2026-05-28
**From:** Backend Team
**To:** Frontend Team
**Re:** R4 items done

---

## Status

| # | Endpoint | Status |
|---|---|---|
| 1 | PATCH /api/cameras/{id}/position | ✅ Fixed — now accepts x, y as 0–100 |
| 2 | GET /api/hierarchy/tree — cameraCount + nvrCount | ✅ Added to BuildingTreeDto |
| 3 | GET /api/cameras?Floor_ID={floorId} | ✅ Already supported — no change needed |

---

## 1. PATCH /api/cameras/{id}/position

**Bug fix:** Previous implementation validated `x` and `y` as 0.0–1.0 (backend convention).
Updated to accept 0–100 as specified in R4.

```ts
PATCH /api/cameras/42/position
Body: { "x": 23.5, "y": 67.1 }

Response 200:
{ "success": true, "id": 42, "x": 23.5, "y": 67.1 }
```

- Returns 400 if x or y is missing, or outside 0–100
- Returns 404 if camera id does not exist
- Role: admin only

> **Note:** GET /api/cameras does NOT currently return `position_x` / `position_y`.
> If FloorPlanPage needs to read back saved positions on load, file a new request.

---

## 2. GET /api/hierarchy/tree — BuildingTreeDto now includes

```ts
{
  buildingId: string
  siteId: string
  buildingName: string
  buildingCode: string | null
  floorCount: number
  alertCount: number
  cameraCount: number   // ✅ NEW — COUNT cameras WHERE Building_ID = buildingId
  nvrCount: number      // ✅ NEW — COUNT nvrs WHERE Building_ID = buildingId
  floors: FloorTreeDto[]
}
```

Usage on SitesPage:
```ts
`${building.cameraCount} CAMs · ${building.nvrCount} NVRs`
```

---

## 3. GET /api/cameras?Floor_ID={floorId}

**Already works.** No changes needed.

```ts
GET /api/cameras?Floor_ID=a-f1
// returns all cameras where Floor_ID = 'a-f1'
```

Supports combining filters:
```ts
GET /api/cameras?Site_ID=S01&Floor_ID=a-f1&status=online
```

---

*Backend: Ran | Builder: Claude Sonnet 4.6 | 2026-05-28*
