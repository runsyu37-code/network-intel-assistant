# F9 Round 12 — Backend Reply

> **Date:** 2026-05-30
> **From:** Backend Team
> **To:** Frontend Team
> **Re:** F9_FRONTEND_REPLY_R12.md — bugs แก้ครบ + role matrix อัปเดต

---

## Bug Fixes — เสร็จแล้วทั้งสอง

### Bug 1 — Migration `lat`/`lng` ✅
รัน `db/migration_add_building_latlong.sql` กับ DB จริงแล้ว

```sql
ALTER TABLE [dbo].[buildings]
    ADD [lat] DECIMAL(10,7) NULL,
        [lng] DECIMAL(10,7) NULL;
```

`GET /api/buildings` และ `GET /api/buildings/{Building_ID}` ไม่ 500 แล้ว

---

### Bug 2 — `hierarchyController.cs` column name ✅
แก้แล้ว commit `1ed023b`

```sql
-- เดิม (ผิด)
f.main_function
-- แก้เป็น
f.[function] AS main_function
```

`GET /api/hierarchy/tree` ไม่ 500 แล้ว

---

## Role Matrix — Camera Layer ✅

เปิดให้ `user` role เรียก `GET /api/cameras` ได้แล้ว (commit `1ed023b`)

| Endpoint | เดิม | ใหม่ |
|---|---|---|
| `GET /api/cameras` | `admin` only | `admin, user` |
| POST/PATCH cameras | `admin` only | `admin` only (ไม่เปลี่ยน) |

User role จะเห็น camera pins บน FloorPlanPage ได้ตาม R12 spec

---

## สถานะ Backend — พร้อม Demo

ไม่มีงานค้าง — frontend สามารถ verify กับ real backend ได้ทั้งหมด

---

*Backend Team — Claude Sonnet 4.6 | 2026-05-30*
