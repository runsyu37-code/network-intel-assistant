# Mock Data Guide — SSM_DB

> **ข้อมูลทั้งหมดใน DB เป็น mock สำหรับพัฒนาและทดสอบ frontend เท่านั้น**
> เมื่อได้ข้อมูลจริง ให้ล้างด้วย TRUNCATE script ด้านล่างแล้ว INSERT ข้อมูลจริงแทน

---

## สิ่งที่ seed ไว้ (ณ 2026-05-31)

| ตาราง | จำนวน | รายละเอียด |
|---|---|---|
| sites | 1 | S001 สำนักงานใหญ่ กรุงเทพฯ |
| buildings | 4 | B001–B004 ในพื้นที่เดียวกัน พิกัด Bangkok |
| floors | 11 | B001=4ชั้น, B002=2ชั้น, B003=3ชั้น, B004=2ชั้น |
| rooms | 4 | ห้องเซิร์ฟเวอร์ 1 ห้องต่ออาคาร |
| racks | 4 | 1 rack ต่ออาคาร |
| poe_switches | 4 | 1 switch ต่ออาคาร |
| nvrs | 4 | 1 NVR ต่ออาคาร |
| cameras | 12 | 2–3 ตัวต่อชั้น มี position_x/y สำหรับ floor plan |
| ping_logs | 12 | ping ล่าสุดต่ออุปกรณ์ |
| alert_logs | 2 | 1 camera offline, 1 NVR warning |

### Building coordinates (Bangkok — mock)

| Building_ID | ชื่อ | lat | lng |
|---|---|---|---|
| B001 | อาคาร A | 13.7510 | 100.5612 |
| B002 | อาคารสาขา | 13.7510 | 100.5620 |
| B003 | อาคาร B | 13.7500 | 100.5616 |
| B004 | อาคาร B | 13.7500 | 100.5608 |

---

## วิธีล้างข้อมูล (TRUNCATE — Method 2)

> รันบน SSMS → SSM_DB
> TRUNCATE เร็วกว่า DELETE และ reset IDENTITY อัตโนมัติ

```sql
USE SSM_DB;
GO

-- 1. ปิด FK ก่อน
EXEC sp_MSforeachtable 'ALTER TABLE ? NOCHECK CONSTRAINT ALL';
GO

-- 2. ล้างทุกตาราง (ลำดับไม่สำคัญเพราะปิด FK แล้ว)
TRUNCATE TABLE [dbo].[alert_logs];
TRUNCATE TABLE [dbo].[ping_logs];
TRUNCATE TABLE [dbo].[cameras];
TRUNCATE TABLE [dbo].[nvrs];
TRUNCATE TABLE [dbo].[poe_switches];
TRUNCATE TABLE [dbo].[racks];
TRUNCATE TABLE [dbo].[rooms];
TRUNCATE TABLE [dbo].[floors];
TRUNCATE TABLE [dbo].[buildings];
TRUNCATE TABLE [dbo].[sites];
GO

-- 3. เปิด FK กลับ + ตรวจความสมบูรณ์
EXEC sp_MSforeachtable 'ALTER TABLE ? WITH CHECK CHECK CONSTRAINT ALL';
GO

-- ตรวจว่าล้างหมดแล้ว
SELECT 'sites'       AS tbl, COUNT(*) AS cnt FROM [dbo].[sites]
UNION ALL SELECT 'buildings',   COUNT(*) FROM [dbo].[buildings]
UNION ALL SELECT 'floors',      COUNT(*) FROM [dbo].[floors]
UNION ALL SELECT 'cameras',     COUNT(*) FROM [dbo].[cameras]
UNION ALL SELECT 'nvrs',        COUNT(*) FROM [dbo].[nvrs]
UNION ALL SELECT 'poe_switches',COUNT(*) FROM [dbo].[poe_switches]
UNION ALL SELECT 'racks',       COUNT(*) FROM [dbo].[racks];
-- ทุกตัวต้องเป็น 0
```

---

## วิธีเพิ่มข้อมูล mock กลับ

```sql
-- รันไฟล์นี้บน SSMS
-- File: db/mock_data.sql
-- ต้อง TRUNCATE ก่อนถ้า DB ไม่ว่าง (FK จะ error ถ้า ID ซ้ำ)
```

เปิดไฟล์ `db/mock_data.sql` ใน SSMS แล้วกด **Execute (F5)**

---

## วิธีเพิ่มข้อมูลจริงในอนาคต

1. รัน TRUNCATE script ด้านบน
2. INSERT ข้อมูลจริงทีละตาราง **ตามลำดับ FK** (top-down):

```
sites → buildings → floors → rooms → racks → poe_switches → nvrs → cameras
```

3. สำหรับ lat/lng ของ buildings ใช้ endpoint:
```
PATCH /api/buildings/{Building_ID}/coordinates
Body: { "lat": ..., "lng": ... }
```

4. สำหรับ position_x/y ของ cameras บน floor plan ใช้ endpoint:
```
PATCH /api/cameras/{id}/position
Body: { "x": ..., "y": ... }
```
(ค่า x/y เป็น % ของขนาด floor plan — 0 คือซ้ายบน, 100 คือขวาล่าง)

---

## ข้อควรระวัง

- `cameras.id` เป็น IDENTITY — ห้ามระบุค่าตอน INSERT, DB กำหนดให้อัตโนมัติ
- `ping_logs` และ `alert_logs` ล้างทิ้งได้เลย ข้อมูลจะถูกเขียนทับโดย PingService เมื่อระบบ run จริง
- ตาราง `users` ไม่ได้ TRUNCATE ในสคริปต์นี้ เพราะ accounts `admin`/`ssm_user` ต้องคงอยู่เสมอ
