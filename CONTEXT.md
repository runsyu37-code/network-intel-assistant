# CONTEXT — backend branch

> สำหรับ AI: อ่านไฟล์นี้จบแล้วรู้ทุกอย่างที่ต้องทำใน branch นี้

---

## branch นี้คืออะไร

**C# REST API — BNO_Survei_MonitorAPI (ASP.NET WebAPI)**
Backend ของระบบ SSM (Surveillance Smart-Monitor)
ให้ข้อมูลแก่ frontend React ผ่าน HTTP

---

## สถานะตอนนี้ (อัปเดต 2026-05-24)

| ส่วน | สถานะ |
|---|---|
| 13 Controllers (CRUD ครบ) | ✅ เสร็จและทดสอบแล้ว |
| devicesController (unified search) | ✅ เสร็จแล้ว |
| Route names — PascalCase ทั้งหมด | ✅ เสร็จแล้ว |
| Bruno test collections | ✅ อัปเดต PascalCase แล้ว |
| Cascade delete (hierarchy) | ✅ แก้แล้ว (pre-delete logic) |
| connectionStrings.config | ✅ gitignored — แต่ละเครื่องสร้างเอง |
| Frontend (web app) | 📋 Phase 7 — ยังไม่เริ่ม |

---

## HTTP Method Convention

> ใช้ POST ทุก operation ยกเว้น GET — ตาม convention ของทีม

| Operation | Method | Pattern |
|---|---|---|
| GET all | `GET` | `/api/Get{table}` |
| SAVE | `POST` | `/api/Save{table}` |
| UPDATE | `POST` | `/api/Update{table}/{id}` |
| DELETE | `POST` | `/api/Delete{table}/{id}` |

---

## งานที่ต้องทำต่อ

**Phase 7 — Frontend web app**
Backend พร้อมแล้ว ขั้นตอนถัดไปคือสร้าง frontend

---

## โครงสร้าง Folder

```
BNO_Survei_MonitorAPI/
├── Controllers/     ← 13 controllers (แก้ไขตรงนี้)
├── Models/          ← 13 models (ตรงกับ DB tables)
├── ConnectionDB/    ← connection string
└── Web.config       ← แก้ connection string ตรงนี้ก่อน run

bruno/               ← test collections (อัปเดตหลังเพิ่ม endpoint ใหม่)
PROGRESS.md          ← session log และ checklist
```

---

## วิธีรัน Project

```
1. เปิด BNO_Survei_MonitorAPI/BNO_Survei_MonitorAPI.slnx ใน Visual Studio
2. สร้างไฟล์ connectionStrings.config (gitignored — ไม่มีใน repo)
3. Run (F5) → ขึ้นที่ https://localhost:44342
4. ทดสอบด้วย Bruno (bruno/ folder)
```

### connectionStrings.config — ต้องสร้างเองบนแต่ละเครื่อง

ไฟล์นี้ gitignored วางไว้ที่:
`BNO_Survei_MonitorAPI/BNO_Survei_MonitorAPI/connectionStrings.config`

**Home laptop (ltH) — Windows Auth:**
```xml
<connectionStrings>
  <add name="CN" connectionString="Data Source=localhost\SQLEXPRESS;Initial Catalog=SSM_DB;Integrated Security=True;" />
</connectionStrings>
```

**Work notebook — SQL Auth:**
```xml
<connectionStrings>
  <add name="CN" connectionString="Data Source=DESKTOP-R2SH8R7\SQLEXPRESS;Initial Catalog=SSM_DB;Integrated Security=False;User ID=sa;Password=Buono@1234;" />
</connectionStrings>
```

### SSM_DB ยังไม่มี?

รัน SQL ตามลำดับใน SSMS:
```
1. CREATE DATABASE SSM_DB;
2. SSM_schema_v2.sql
3. mock_data.sql
```

---

## อยากรู้ Schema ของ DB

→ ดูที่ `database/SSM_schema_v2.sql` ใน branch `master` หรือ `work-safe`

---

## Roadmap

```
เพิ่ม GET filter (7 endpoints)
    → เพิ่ม GET by ID (13 endpoints)
        → อัปเดต Bruno collections
            → backend พร้อมให้ frontend เรียก
```
