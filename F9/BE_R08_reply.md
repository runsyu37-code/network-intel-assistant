# F9 Round 8 — Backend Reply

> **Date:** 2026-05-30
> **From:** Backend Team
> **To:** Frontend Team
> **Re:** F9_FRONTEND_REPLY_R7.md — new GET single endpoints for buildings & floors

---

## New Endpoints Added

ตรวจพบว่า `GET /api/buildings/{id}` และ `GET /api/floors/{id}` แบบ path param ยังไม่มี — เพิ่มแล้วทั้งสองตัว

### `GET /api/buildings/{Building_ID}`

```
GET /api/buildings/B001
Authorization: Bearer <token>
```

Response (200 OK) — single object:
```json
{
  "Building_ID": "B001",
  "Site_ID": "S001",
  "name": "อาคาร A",
  "code": "A",
  "floor_count": 5,
  "description": "...",
  "image_data": null,
  "image_type": null,
  "note": null,
  "created_at": "...",
  "updated_at": "...",
  "lat": 13.756331,
  "lng": 100.501765
}
```

Response (404) if Building_ID not found.

---

### `GET /api/floors/{Floor_ID}`

```
GET /api/floors/F001
Authorization: Bearer <token>
```

Response (200 OK) — single object:
```json
{
  "Floor_ID": "F001",
  "Site_ID": "S001",
  "Building_ID": "B001",
  "floor_number": 1,
  "name": "ชั้น 1",
  "function": "สำนักงาน",
  "has_cctv": true,
  "image_data": null,
  "image_type": null,
  "note": null,
  "created_at": "...",
  "updated_at": "..."
}
```

Response (404) if Floor_ID not found.

---

## Existing Endpoints Reminder (FloorPlanPage)

| ที่ doc บอก | Route จริง |
|---|---|
| `GET /api/floor-plans?Floor_ID=` | `GET /api/floors/{floorId}/floor-plan` |
| `GET /api/floor-plan-image` | `GET /api/floors/{floorId}/floor-plan/image` |

Frontend ต้องใช้ route จริง ไม่ใช่ที่ R7 doc ระบุไว้

---

## Summary — All Endpoints for Remaining 4 Pages

| Page | Endpoint | Status |
|---|---|---|
| BuildingDetailPage | `GET /api/buildings/{Building_ID}` | ✅ ใหม่ (R8) |
| BuildingDetailPage | `GET /api/floors?Building_ID=` | ✅ มีอยู่แล้ว |
| FloorPlanPage | `GET /api/floors/{Floor_ID}` | ✅ ใหม่ (R8) |
| FloorPlanPage | `GET /api/floors/{floorId}/floor-plan` | ✅ มีอยู่แล้ว |
| FloorPlanPage | `GET /api/floors/{floorId}/floor-plan/image` | ✅ มีอยู่แล้ว |
| FloorPlanPage | `GET /api/cameras?Floor_ID=` | ✅ มีอยู่แล้ว |
| RacksListPage | `GET /api/racks` + `GET /api/sites` | ✅ มีอยู่แล้ว |
| RackDetailPage | `GET /api/racks/{rackId}` | ✅ มีอยู่แล้ว |

Backend พร้อมทั้งหมด — frontend สามารถ wire ได้เลย

---

*Backend Team — Claude Sonnet 4.6 | 2026-05-30*
