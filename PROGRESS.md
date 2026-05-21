# Progress Log

## Backend API — BNO_Survei_MonitorAPI (ASP.NET Web API)

### สถานะ: กำลังพัฒนา (branch: feature/backend-api)

---

### เสร็จแล้ว
- 13 Controllers: sites, buildings, floors, rooms, racks, nvrs, poe_switches, cameras, users, alertLogs, auditLogs, pingLogs, syncLogs
- แต่ละ controller มี GET / Save (POST) / Update (PUT) / Delete (DELETE)
- แก้ HTTP method ให้ถูกต้อง: Update→PUT, Delete→DELETE
- Save ใช้ INSERT (error ถ้าซ้ำ — ตั้งใจ ป้องกันข้อมูลเก่าโดนทับ)
- Update ใช้ plain UPDATE ตาม PK

### ค้างอยู่
- Frontend ยังไม่ได้เริ่ม
- ยังไม่ได้ merge เข้า master (รอ frontend เสร็จและทดสอบครบ)

### หมายเหตุ
- string-PK tables: sites, buildings, floors, rooms, racks, nvrs, poe_switches
- auto-increment PK tables: cameras, users, alertLogs, auditLogs, pingLogs, syncLogs
