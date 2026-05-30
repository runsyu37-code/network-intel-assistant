# F9 Round 11 — Frontend Note

> **Date:** 2026-05-30
> **From:** Frontend Team
> **To:** Backend Team
> **Re:** ผล verify กับ real backend — พบ 2 bugs ที่ทำให้ BuildingDetailPage และ Topology พัง

---

## Bug Report — ต้องแก้ก่อน demo

### Bug 1 — `buildings` table ขาด `lat` / `lng` column

**Error:** `Invalid column name 'lat'. Invalid column name 'lng'.`
**กระทบ:** `GET /api/buildings` และ `GET /api/buildings/{Building_ID}` → 500 ทั้งคู่
**สาเหตุ:** migration ยังไม่ได้ run กับ DB จริง

**Fix:** รัน migration ที่มีอยู่แล้ว:
```
C:\ai-playground\API\db\migration_add_building_latlong.sql
```

```sql
ALTER TABLE [dbo].[buildings]
    ADD [lat] DECIMAL(10,7) NULL,
        [lng] DECIMAL(10,7) NULL;
```

---

### Bug 2 — `hierarchyController.cs` query column ผิดชื่อ

**Error:** `Invalid column name 'main_function'.`
**กระทบ:** `GET /api/hierarchy/tree` → 500 — พัง Topology, SitesPage, BuildingDetail ทุกหน้าที่ใช้ tree
**สาเหตุ:** Controller query `f.main_function` แต่ schema จริงใน DB ชื่อ `f.[function]`

ดู `SSM_schema_v2.sql` line 67:
```sql
[function]    NVARCHAR(100)  NULL,   -- ชื่อจริงคือ [function]
```

ดู `hierarchyController.cs` line 77:
```sql
SELECT f.Floor_ID, f.Building_ID, f.floor_number, f.name, f.main_function, ...
--                                                               ^^^^^^^^^^^^^ ผิด
```

**Fix:** เปลี่ยนบรรทัด 77 และ 89:
```sql
-- line 77: เปลี่ยน
f.main_function
-- เป็น
f.[function] AS main_function

-- line 89: ไม่ต้องแก้ (ใช้ alias "main_function" อยู่แล้ว)
```

---

## สถานะ endpoints อื่น (ปกติ)

| Endpoint | Status |
|---|---|
| `GET /api/floors?Building_ID=` | ✅ 200 — ข้อมูลไทยถูกต้อง |
| `GET /api/floors/{Floor_ID}` | ✅ 200 |
| `GET /api/racks` | ✅ 200 |
| `GET /api/racks/{Rack_ID}` | ✅ 200 — devices + alerts ครบ |
| `GET /api/auth/login` | ✅ 200 |

---

*Frontend Team — Claude Sonnet 4.6 | 2026-05-30*
