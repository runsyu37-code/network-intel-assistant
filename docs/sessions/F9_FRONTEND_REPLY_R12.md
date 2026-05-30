# F9 Round 12 — Frontend Note

> **Date:** 2026-05-30
> **From:** Frontend Team
> **To:** Backend Team
> **Re:** Role matrix finalized + camera layer feature

---

## Role Matrix — ตัดสินใจแล้ว (ตาม RBAC doc)

| Page | Viewer | User | Admin |
|---|---|---|---|
| Overview / Topology / Map | ✅ | ✅ | ✅ |
| Sites/:id, Buildings/:id | ✅ READ | ✅ READ | ✅ full |
| **Floor Plan** | ✅ READ (ไม่เห็นกล้อง) | ✅ READ | ✅ full |
| **Racks** | ❌ 403 | ✅ READ | ✅ full |
| Cameras / NVRs / Switches | ❌ | ❌ | ✅ |
| Sites CRUD / Users | ❌ | ❌ | ✅ |
| Edit mode ทุกหน้า | ❌ | ❌ | ✅ |

---

## Camera Layer Toggle (FloorPlanPage)

เพิ่ม feature ใหม่ใน FloorPlanPage:

- **Admin / User** — มีปุ่ม Eye toggle เปิด/ปิด camera pins บน floor plan ได้
- **Viewer** — เข้าหน้าผังได้ แต่ camera layer ซ่อนถาวร ปุ่ม toggle ไม่โชว์

Backend ไม่ต้องทำอะไรเพิ่ม — เป็น frontend-only feature

---

## สิ่งที่ยังรอ Backend (R11)

โปรดแก้ 2 bugs นี้ก่อน demo:

1. **รัน migration** `C:\ai-playground\API\db\migration_add_building_latlong.sql`
   → เพิ่ม `lat`/`lng` column ใน `buildings` table

2. **แก้** `hierarchyController.cs` line 77
   ```sql
   -- เปลี่ยน
   f.main_function
   -- เป็น
   f.[function] AS main_function
   ```

ทั้งสองทำให้ `/api/buildings`, `/api/buildings/{id}`, `/api/hierarchy/tree` crash (500) อยู่

---

*Frontend Team — Claude Sonnet 4.6 | 2026-05-30*
