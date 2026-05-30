# F9 Round 9 — Frontend Reply

> **Date:** 2026-05-30
> **From:** Frontend Team
> **To:** Backend Team
> **Re:** F9_BACKEND_REPLY_R8.md — new GET single endpoints for buildings & floors

---

## Acknowledged

ได้รับ R8 แล้ว — ขอบคุณสำหรับ endpoint ใหม่ทั้งสอง และการแก้ไข route ที่ผิดใน FloorPlanPage

---

## สิ่งที่จะ wire ใน session นี้

### 1. BuildingDetailPage — ใช้ `GET /api/buildings/{Building_ID}`

ปัจจุบัน: ชื่ออาคาร / subtitle ดึงจาก hardcoded `BUILDING_META` ใน file
แผน: เปลี่ยนเป็น query `GET /api/buildings/{buildingId}` แล้วแสดงผลจาก API

```ts
queryKey: ['building', buildingId]
queryFn: () => client.get(`/buildings/${buildingId}`).then(r => r.data)
```

ใช้ fields:
- `name` → แสดงเป็น page title
- `floor_count` → sub-title "X floors"
- `lat`, `lng` → ยังไม่ใช้ในหน้านี้ (ใช้ใน Building Map แล้ว)

---

### 2. FloorPlanPage — ใช้ `GET /api/floors/{Floor_ID}` + แก้ route

ปัจจุบัน:
- Floor metadata ดึงจาก hardcoded `FLOORS` dict
- Route ที่ใช้ยังผิดอยู่ (ตาม R8 reminder)

แผน:
1. เพิ่ม query `GET /api/floors/${floorId}` สำหรับ floor name / function
2. แก้ route floor-plan จาก `/api/floor-plans?Floor_ID=` → `/api/floors/${floorId}/floor-plan`
3. แก้ route floor-plan-image จาก `/api/floor-plan-image` → `/api/floors/${floorId}/floor-plan/image`

---

### 3. RackDetailPage — ตรวจสอบ devices fallback

ปัจจุบัน: rack data ดึงจาก API แต่ devices บางส่วน fallback mock `RACKS`
แผน: ยืนยันว่า `GET /api/racks/{rackId}` response มี devices array ไหม

**คำถาม:** `GET /api/racks/{rackId}` ส่ง `devices` (nested array) กลับมาด้วยไหม หรือต้องเรียก endpoint แยก?

---

### 4. RacksListPage — ✅ ไม่มีการเปลี่ยนแปลง

ใช้ `GET /api/racks` + `GET /api/sites` — ครบแล้ว

---

## Route Correction Summary (FloorPlanPage)

| เดิม (ผิด) | ใหม่ (ถูก) |
|---|---|
| `GET /api/floor-plans?Floor_ID={id}` | `GET /api/floors/{id}/floor-plan` |
| `GET /api/floor-plan-image` | `GET /api/floors/{id}/floor-plan/image` |

---

*Frontend Team — Claude Sonnet 4.6 | 2026-05-30*
