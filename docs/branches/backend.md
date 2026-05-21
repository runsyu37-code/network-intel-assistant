# Branch: backend

> C# REST API — ASP.NET WebAPI, Visual Studio solution ครบ

---

## โครงสร้างหลัก

| Folder/File | คืออะไร |
|---|---|
| `BNO_Survei_MonitorAPI/` | Visual Studio solution ทั้งหมด |
| `BNO_Survei_MonitorAPI/Controllers/` | 13 Controllers (sites, buildings, cameras ฯลฯ) |
| `BNO_Survei_MonitorAPI/Models/` | 13 Models ตรงกับ DB tables |
| `BNO_Survei_MonitorAPI/ConnectionDB/` | connection string ต่อ SQL Server |
| `BNO_Survei_MonitorAPI/Web.config` | config หลัก (connection string อยู่ตรงนี้) |
| `bruno/` | Bruno collections ครบทุก table — GET/SAVE/UPDATE/DELETE พร้อม JSON body |
| `BACKEND.md` | สรุป API ทำอะไรได้ สถานะ และ endpoints |
| `PROGRESS.md` | backend เสร็จแล้ว, frontend ยังค้าง |

---

## Endpoints ที่มี (13 tables)

`sites` · `buildings` · `floors` · `rooms` · `racks` · `cameras` · `nvrs` · `poeSwitches` · `pingLogs` · `alertLogs` · `auditLogs` · `syncLogs` · `users`

แต่ละ table มีครบ 4 operations: **GET / SAVE / UPDATE / DELETE**

| Operation | Method | URL pattern |
|---|---|---|
| GET | `GET` | `/api/Get{table}` |
| SAVE | `POST` | `/api/Save{table}` |
| UPDATE | `POST` | `/api/Update{table}/{id}` |
| DELETE | `POST` | `/api/Delete{table}/{id}` |

> ใช้ POST ทุก operation ยกเว้น GET — ตาม convention ของทีม

---

## วิธีเปิดใช้งาน

```
1. git checkout backend
2. เปิด BNO_Survei_MonitorAPI/BNO_Survei_MonitorAPI.slnx ใน Visual Studio
3. แก้ connection string ใน Web.config
4. Run (F5)
5. ทดสอบด้วย Bruno collections ใน bruno/
```

---

## สถานะ

| ส่วน | สถานะ |
|---|---|
| C# REST API | ✅ เสร็จแล้ว |
| Bruno test collections | ✅ เสร็จแล้ว |
| Frontend (web app) | 📋 ยังไม่เริ่ม |
