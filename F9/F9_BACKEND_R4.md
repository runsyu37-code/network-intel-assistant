# F9 Round 4 — Frontend Needs (Final Round)

> **Date:** 2026-05-28
> **From:** Frontend Team
> **To:** Backend Team
> **Priority:** HIGH — presentation tonight

---

## Summary

Frontend สามารถ wire ได้แล้ว 2 ของ 3 pages ที่เหลือ (FloorPlanPage + RacksListPage/Detail):
- **FloorPlanPage** → ต้องการ 1 endpoint เล็กน้อย + 1 endpoint ใหม่
- **SitesPage / BuildingDetailPage** → ต้องการ hierarchy tree เพิ่ม field เล็กน้อย

---

## 1. `GET /api/hierarchy/tree` — เพิ่ม field ใน BuildingTreeDto

**ปัจจุบัน `BuildingTreeDto` มี:**
```ts
buildingId: string
siteId: string
buildingName: string
buildingCode: string | null
floorCount: number
alertCount: number
floors: FloorTreeDto[]
```

**ต้องการเพิ่ม:**
```ts
cameraCount: number   // COUNT cameras WHERE Building_ID = buildingId
nvrCount: number      // COUNT nvrs WHERE Building_ID = buildingId
```

**ใช้ที่ไหน:** SitesPage — card แต่ละอาคารแสดง `{cameraCount} CAMs · {nvrCount} NVRs`

---

## 2. `PATCH /api/cameras/{id}/position` — บันทึกตำแหน่งกล้องบน floor plan

```
PATCH /api/cameras/42/position
Body: { "x": 23.5, "y": 67.1 }
```

- `x`, `y` เป็น percentage (0–100) บนหน้า floor plan
- บันทึกลง `position_x` และ `position_y` columns ที่มีอยู่แล้วใน cameras table
- Response: `200 OK` หรือ `{ ok: true }` ก็ได้

**ใช้ที่ไหน:** FloorPlanPage — เมื่อ drag กล้องบน floor plan จะ auto-save ตำแหน่ง

---

## 3. ยืนยัน: `GET /api/cameras?Floor_ID={floorId}` ทำงานได้มั้ย

ถ้ายังไม่ support filter `Floor_ID` → แจ้งด้วย frontend จะ handle เอง

---

## Priority

| # | Endpoint | ความยาก | ความสำคัญ |
|---|---|---|---|
| 1 | PATCH /api/cameras/{id}/position | ง่าย | สูง — floor plan drag save |
| 2 | hierarchy/tree + cameraCount + nvrCount | กลาง | สูง — Sites page |
| 3 | ยืนยัน cameras?Floor_ID filter | ง่าย (มีอยู่แล้ว?) | ปานกลาง |

---

*Frontend: Claude Sonnet 4.6 | Backend: Ran | 2026-05-28*
