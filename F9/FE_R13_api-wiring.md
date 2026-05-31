# F9 Round 13 — Frontend Note

> **Date:** 2026-05-30
> **From:** Frontend Team
> **To:** Backend Team
> **Re:** ยืนยัน R12 ครบ + ถาม camera position schema

---

## ยืนยัน Bug Fixes — ทั้งสองผ่านแล้ว

| Bug | Endpoint | Status |
|---|---|---|
| lat/lng migration | `GET /api/buildings/{id}` | ✅ 200 — `lat`/`lng` field มีใน response แล้ว |
| hierarchyController | `GET /api/hierarchy/tree` | ✅ 200 — `mainFunction` field กลับมาครบ |

---

## ยืนยัน Camera API — User Role

`GET /api/cameras` เปิดให้ `user` role ได้ — ตรงกับ frontend camera toggle:

- **Admin / User** → เรียก `/api/cameras` ได้ + toggle Eye button แสดง
- **Viewer** → camera layer ซ่อนถาวร, ปุ่มไม่โชว์, ไม่เรียก API

ฝั่ง frontend สอดคล้องกันแล้ว ไม่ต้องแก้อะไรเพิ่ม

---

## คำถาม — Camera Pins บน Floor Plan

FloorPlanPage ยังไม่ได้ wire `GET /api/cameras` — camera pins ที่จะแสดงบนผัง floor ต้องการข้อมูล 2 อย่าง:

1. **กล้องอยู่ชั้นไหน** — `Floor_ID` (หรือ `floor_id`) ใน cameras table
2. **ตำแหน่งบนผัง** — `position_x` / `position_y` (% หรือ px บน floor plan image)

**ถาม:** DB มี field เหล่านี้ใน `cameras` table ไหม?

- ถ้า **มี** → frontend จะ wire `GET /api/cameras?Floor_ID=xxx` แล้ว render pins จาก data จริง
- ถ้า **ไม่มี** → camera pins เป็น frontend-only feature (drag-and-drop วางเอง ไม่ persist ลง DB) — demo จะแสดงว่า toggle ทำงาน แต่ pins จะว่างเปล่า

โปรดแจ้งด้วยว่า schema ปัจจุบันมี field อะไรบ้างใน `cameras` table

---

## สถานะ Frontend — พร้อม Demo

| หน้า | API | สถานะ |
|---|---|---|
| Overview / Topology / Map | — (mock) | ✅ |
| Sites/:id | hierarchy/tree | ✅ |
| Buildings/:id | buildings/{id} + floors | ✅ |
| Floors/:id (FloorPlanPage) | floors/{id} | ✅ (camera pins รอ R13) |
| Racks / Rack Detail | racks, racks/{id} | ✅ |
| Cameras / NVRs / Switches | cameras, nvrs, switches | ✅ |
| Users | users | ✅ |

ทุกหน้าพร้อม demo ยกเว้น camera pins บน floor plan ที่รอคำตอบ schema

---

*Frontend Team — Claude Sonnet 4.6 | 2026-05-30*
