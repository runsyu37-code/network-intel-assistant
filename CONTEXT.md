# CONTEXT — backend branch

> สำหรับ AI: อ่านไฟล์นี้จบแล้วรู้ทุกอย่างที่ต้องทำใน branch นี้

---

## branch นี้คืออะไร

**C# REST API — BNO_Survei_MonitorAPI (ASP.NET WebAPI)**
Backend ของระบบ SSM (Surveillance Smart-Monitor)
ให้ข้อมูลแก่ frontend React ผ่าน HTTP

---

## สถานะตอนนี้

| ส่วน | สถานะ |
|---|---|
| 13 Controllers (CRUD ครบ) | ✅ เสร็จแล้ว |
| Bruno test collections | ✅ เสร็จแล้ว |
| GET by parent filter | ❌ ยังไม่มี |
| GET by ID (single record) | ❌ ยังไม่มี |

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

## งานที่ต้องทำต่อ (ตามลำดับ)

### 1. เพิ่ม GET by Parent Filter (สำคัญมาก — frontend ต้องใช้)

| Endpoint ที่ต้องเพิ่ม | ใช้ตอนไหน |
|---|---|
| `GET /api/Getbuildings?site_id=` | drill-down เข้า Site |
| `GET /api/Getfloors?building_id=` | drill-down เข้า Building |
| `GET /api/Getrooms?floor_id=` | drill-down เข้า Floor |
| `GET /api/Getracks?room_id=` | drill-down เข้า Room |
| `GET /api/Getcameras?rack_id=` | drill-down เข้า Rack |
| `GET /api/Getnvrs?rack_id=` | drill-down เข้า Rack |
| `GET /api/GetpoeSwitches?rack_id=` | drill-down เข้า Rack |

วิธีทำใน C#:
```csharp
[Route("api/Getbuildings")]
[HttpGet]
public IHttpActionResult Getbuildings(string site_id = null)
{
    // ถ้า site_id มีค่า → WHERE Site_ID = @site_id
    // ถ้าไม่มี → คืนทั้งหมด (เหมือนเดิม)
}
```

### 2. เพิ่ม GET by ID (Single Record)

| Endpoint ที่ต้องเพิ่ม |
|---|
| `GET /api/Getsites/{id}` |
| `GET /api/Getbuildings/{id}` |
| *(และทุก table)* |

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
2. แก้ connection string ใน Web.config
3. Run (F5) → ขึ้นที่ https://localhost:44342
4. ทดสอบด้วย Bruno (bruno/ folder)
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
