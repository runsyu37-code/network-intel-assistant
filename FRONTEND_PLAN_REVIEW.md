# FRONTEND_PLAN_REVIEW.md
## Technical Review & Retrospective — SSM v1.0 (Phase 1 → Phase 7)

> **Reviewer role:** Senior System Architect & Tech Lead
> **Reviewee:** Ran (Susan) — Intern Network Engineer, Year 4
> **Review date:** 2026-05-22
> **Scope:** Phase 1-6 retrospective + Phase 7 (Frontend) plan + Wireframes + Backend changes
> **Deadline reference:** Early July 2026 (~6 weeks)
> **Mode:** Solo developer

---

## Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [Phase 1 Review — Data Sanitizer](#2-phase-1--data-sanitizer)
3. [Phase 2 Review — SQL Schema v2](#3-phase-2--sql-schema-v2)
4. [Phase 3 Review — Excel Template v4](#4-phase-3--excel-template-v4)
5. [Phase 4 Review — Python Importer (Retired)](#5-phase-4--python-importer-retired)
6. [Phase 5 Review — Mock Data SQL](#6-phase-5--mock-data-sql)
7. [Phase 6 Review — Backend API (C#)](#7-phase-6--backend-api-c)
8. [Phase 7 Review — Frontend Plan](#8-phase-7--frontend-plan)
9. [Wireframe Review](#9-wireframe-review)
10. [RACK_POSITION.md Review](#10-rack_positionmd-review)
11. [Backend Changes Review (7 new endpoints)](#11-backend-changes-review)
12. [Answers to Open Decisions](#12-answers-to-open-decisions)
13. [Final MVP Roadmap (6-week timeline)](#13-final-mvp-roadmap)
14. [Critical Action Items Before Coding](#14-critical-action-items-before-coding)

---

## 1. Executive Summary

### โดยรวม
Ran ทำงานในระดับที่ **เกินคาดสำหรับ intern** — มี engineering mindset, documentation ครบ, test coverage จริง, และ wireframe ที่ออกแบบมีความคิด UX ที่ดี

### แต่ความเป็นจริงต้องพูดตรงๆ
Scope ของ Phase 7 ที่วางไว้ (52 forms + 3 roles + realtime + isometric + topology + floor plan editor + rack editor) คือ **scope ของทีม 3-4 คน × 3 เดือน** การพยายามทำให้ครบใน 6 สัปดาห์ คนเดียว = **fail แน่นอน** ไม่ใช่เพราะ Ran ไม่เก่ง แต่เพราะ physics ของเวลา

### Verdict
- ✅ **Architecture decisions ส่วนใหญ่ถูก** — schema, stack choice, intranet deployment
- ⚠️ **มี blocker 3 ตัวที่ต้องแก้ก่อนเขียน React บรรทัดแรก** (CORS, Auth, Aggregate endpoints)
- 🔴 **MVP scope ต้องตัดลงอีก** — แม้แต่ MVP ที่ Ran agree ก็ยังเสี่ยงไม่ทัน
- 🔴 **Wireframe มี structural inconsistency** — sidebar behavior กับ navigation flow ขัดแย้งกัน

---

# Part A — Phase 1-6 Retrospective

## 2. Phase 1 — Data Sanitizer

### Strengths
- 28 unit tests = engineering discipline ระดับ professional
- Deterministic mapping (regex + mapping table) เป็น choice ที่ถูก
- Re-usable design — ใช้กับโปรเจกต์อื่นได้

### Findings

#### [P1] Collision Risk ใน Mapping Table

**WHY:** เมื่อ sanitize ข้อมูลปริมาณมาก (เช่น 1000+ IPs) ถ้า random space ของค่าปลอมแคบ จะเกิด collision — IP จริง 2 ตัวที่ต่างกัน ถูก map เป็น IP ปลอมตัวเดียวกัน → ข้อมูลที่ส่งออกไป "ผิด semantic" โดยไม่รู้ตัว → AI cloud ที่ analyze จะวิเคราะห์ผิด

ตัวอย่าง: traffic ที่ควรมี 2 source กลายเป็น source เดียว → analyst สรุปว่า "มี server แค่ตัวเดียว" ซึ่งผิด

**HOW (mitigation):**
- เพิ่ม assertion ใน sanitizer: ก่อน return ตรวจว่า reverse-map (fake → real) ต้อง 1:1
- ถ้าเจอ collision → raise error ทันที ไม่ silent fail
- เพิ่ม statistics ใน output: `Sanitized 247 unique IPs → 247 fake IPs, 0 collisions`

#### [P2] Mapping Persistence

**WHY:** ถ้า mapping table อยู่ใน memory อย่างเดียว แต่ละครั้งรัน script จะได้ค่าปลอมไม่เหมือนเดิม — sanitize log วันนี้แล้วพรุ่งนี้ sanitize log ใหม่ที่มี IP ตัวเดิม กลายเป็นค่าปลอมคนละตัว → analyst correlate ไม่ได้

**HOW:**
- Persist mapping ลง JSON file (`sanitizer/mapping_state.json`)
- Load ทุกครั้งที่รัน, generate ค่าใหม่เฉพาะ entity ที่ยังไม่เคยเจอ
- Add `.gitignore` entry สำหรับไฟล์นี้ (ไม่ commit mapping ที่อาจรั่วข้อมูลจริง)

### Impact on Phase 7
ไม่กระทบโดยตรง — แต่ Phase 1 คือ asset ที่ "ขายได้" ดีที่สุดเวลา demo ให้ supervisor/อาจารย์ดู เพราะแสดง security mindset

---

## 3. Phase 2 — SQL Schema v2

> Schema is **LOCKED** — mitigation จะอยู่ที่ API/Service/Frontend layer เท่านั้น

### Strengths
- Hierarchy ถูกต้อง (Site → Building → Floor → Room → Rack → Device)
- Filtered index = SQL Server best practice
- 5 views พร้อมใช้งาน (asset ที่ยังไม่ได้ใช้ใน Phase 6!)
- Column order ตรง Excel = workflow optimization ที่ดี

### Findings

#### [P0] N+1 Query Trap ใน Frontend

**WHY:** Hierarchy 6 ระดับ + 13 CRUD endpoints แยกกัน = ถ้า React จะ render tree view จะต้องเรียก API ดังนี้:

```
GET /sites              → 5 sites
ต่อแต่ละ site:
  GET /buildings?siteId=X    → 5 calls
  ต่อแต่ละ building:
    GET /floors?buildingId=Y → 25 calls
    ต่อแต่ละ floor:
      GET /rooms?floorId=Z   → 125 calls
      ...
```

นี่คือ classic **N+1 problem** ที่จะทำให้หน้า Topology/Site/Building load ช้ามากเมื่อข้อมูลจริงเข้า ถ้า site มี 50 อยู่ใน 5 buildings, แต่ละ building 10 floors → คุณจะเรียก API หลายพันครั้งต่อ 1 หน้าจอ

**HOW (mitigation ที่ API layer — ต้องทำก่อน Phase 7):**

เพิ่ม **aggregate endpoints** ก่อนเริ่ม React:

```
GET /api/hierarchy/tree
  → คืน nested JSON ทั้ง tree ใน 1 call
  ใช้กับ: Topology page, Site overview, Building detail

GET /api/sites/{id}/full
  → คืน 1 site + buildings + floors (limit 3 levels)
  ใช้กับ: Site Overview drill-down

GET /api/dashboard/summary
  → คืน aggregate stats (total devices, online count, alert count per site)
  ใช้กับ: Topology badge counts
```

ใช้ existing 5 views ที่มีอยู่แล้วในการ implement — ไม่ต้องเขียน JOIN ใหม่จากศูนย์

#### [P1] Filtered Index = Vendor Lock-in

**WHY:** Filtered index เป็น **SQL Server-specific feature** ถ้าวันหนึ่งต้องย้ายไป PostgreSQL/MySQL ต้องเขียนใหม่ทั้งหมด

นี่ไม่ใช่ปัญหาเฉพาะหน้า แต่เป็นเทคนิคที่จะต้อง document ไว้ใน `docs/architecture/DATABASE_DECISIONS.md` ว่า "schema นี้ผูกกับ SQL Server"

**HOW:** เพิ่ม document `database/PORTABILITY_NOTES.md` ระบุ:
- Features ที่ใช้: filtered index, ALIAS, computed columns
- Migration path ถ้าต้องย้าย DB

#### [P1] Optional Fields ที่ควรเป็น Required

**WHY:** `serial_no` และ `mac_address` ของ device ในระบบ surveillance จริง = **identity ของ hardware** — ถ้า optional แปลว่า DB ยอมรับ device ที่ไม่มี identity = อาจมี duplicate ที่ตรวจไม่ได้

**HOW (Service layer validation ใน C#):**
```csharp
// DeviceValidationService.cs
public ValidationResult ValidateForActive(Device device)
{
    if (device.Status == "Active")
    {
        if (string.IsNullOrEmpty(device.SerialNo))
            return Error("Active device must have serial number");
        if (string.IsNullOrEmpty(device.MacAddress))
            return Error("Active device must have MAC address");
    }
    return Success();
}
```

อนุญาต NULL เฉพาะ status = "Planned" หรือ "Decommissioned"

### Impact on Phase 7
**P0 finding ข้างบนคือสิ่งสำคัญที่สุดในรอบ review นี้** — ไม่แก้ Phase 7 จะ load ช้าเป็น 5-10 วินาทีต่อหน้า

---

## 4. Phase 3 — Excel Template v4

### Strengths
- Sheet order ตรง FK order — ป้องกัน import error
- Column order ตรง schema — copy-paste ได้ทันที
- Lower barrier สำหรับ staff ที่ไม่รู้ database

### Findings

#### [P2] Manual ETL = ไม่มี Audit Trail

**WHY:** Workflow ปัจจุบัน Staff กรอก Excel → copy-paste เข้า SSMS = manual ETL ที่ไม่มี:
- Audit trail (ใครกรอก? เมื่อไหร่? แก้อะไร?)
- Validation ตอนกรอก (IP ผิด format ก็เข้า DB ได้)
- Concurrency control (2 คนกรอก site เดียวกันพร้อมกัน)
- Version control ของข้อมูล

**HOW (long-term, ไม่ใช่ตอนนี้):**
- เป้าหมาย post-MVP: ให้ React frontend มี form แทน Excel
- Excel เก็บไว้เป็น "bulk import tool ครั้งแรก" เท่านั้น
- หลัง Phase 7: ข้อมูลใหม่ผ่าน API → ได้ audit, validation, auth ครบ

#### [P3] Column Order Hidden Contract

**WHY:** "Column order ตรง schema" คือ optimization ที่ดี แต่สร้าง **hidden coupling** — ถ้าวันหนึ่งเพิ่ม column ตรงกลาง schema (เช่น `created_by`) Excel template ต้องแก้ตาม ถ้าลืม → paste ผิด column ทั้งหมด → data corruption เงียบๆ

**HOW:**
- ใส่ cell A1 ของแต่ละ sheet เป็น schema version (`SCHEMA_V2.1`)
- เขียน macro หรือ manual checklist ตรวจก่อน paste

### Impact on Phase 7
Frontend ต้องตัดสินใจ scope ให้ชัด: เป็น "data entry tool" หรือ "viewer-only"? Plan ของ Ran บอก "data entry ครบ" → scope ใหญ่กว่าที่ทำทันใน 6 สัปดาห์ (จะกลับมาที่หัวข้อนี้)

---

## 5. Phase 4 — Python Importer (Retired)

### Strengths
- การตัดสินใจ retire = pragmatic — copy-paste เร็วกว่าจริง
- 5 bug fixes = ความเข้าใจ schema ที่ลึกขึ้น
- เก็บไว้เป็น portfolio = แสดง automation skills

### Findings

#### [P1] Business Rules หายไปจาก Enforcement Layer

**WHY:** การแก้ bug 5 จุด (example row, IP invalid, encoding, ฯลฯ) คือ **business rules** ที่ encode ไว้ใน Python — เมื่อ retire แล้ว rules เหล่านี้ **หายไปจาก enforcement layer** ตอนนี้ "validation" อยู่ในหัวคน — staff ต้องจำเองว่า "อย่า paste example row"

**HOW (กระจาย validation ไปหลาย layer = defense in depth):**

**1. DB layer — CHECK constraints:**
```sql
-- กัน example row
ALTER TABLE sites ADD CONSTRAINT CHK_sites_not_example
    CHECK (site_name NOT LIKE 'e.g.%' AND site_name NOT LIKE 'example%');

-- กัน IP format ผิด (basic)
ALTER TABLE cameras ADD CONSTRAINT CHK_cameras_ip_format
    CHECK (ip_address IS NULL OR ip_address LIKE '%.%.%.%');
```

**2. C# Service layer — business validation:**
```csharp
public class ValidationService {
    public ValidationResult ValidateIp(string ip) { /*...*/ }
    public ValidationResult ValidateMacAddress(string mac) { /*...*/ }
}
```

**3. React layer — form validation (Phase 7):**
```jsx
<Input 
    pattern="^\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}$" 
    onBlur={validateIp} />
```

#### [P2] Deprecated Script ยังเก็บอยู่ = Risk

**WHY:** ถ้ามีคนใหม่เข้ามา project (เพื่อน intern คนต่อไป?) จะเข้าใจผิดว่า script นี้ยังใช้งานอยู่ → ใช้แล้วเจอ bug ที่ไม่ได้แก้

**HOW:** ใส่ header ใน `ssm_import.py`:
```python
"""
⚠️ DEPRECATED — DO NOT USE IN PRODUCTION
This script is retained for portfolio purposes only.
Current workflow: copy-paste via SSMS.
See docs/workflow/IMPORT_DECISION.md
Last working version: 2026-05-20
"""
import sys
sys.exit("This script is deprecated. See docs/workflow/IMPORT_DECISION.md")
```

### Impact on Phase 7
Validation rules ที่หายไป → ต้อง re-implement ใน React + C# ทั้งสองที่ ไม่ใช่ที่ใดที่หนึ่ง

---

## 6. Phase 5 — Mock Data SQL

### Strengths
- มีข้อมูลครบทุก table — test ได้ทันที
- ไม่ต้องรอ staff กรอกข้อมูลจริง
- Verify FK relationships ได้

### Findings

#### [P1] Performance Blind Spot

**WHY:** Mock data ปัจจุบัน: รวม **<20 rows ทั้ง DB** — เมื่อต่อ React ทุกอย่างจะดู "เร็วและสวย" แต่พอ deploy จริงด้วยข้อมูล 100 sites, 1000 devices จะเจอ:
- Tree view render ช้า / freeze browser
- Search/filter ไม่ทัน
- API timeout
- ไม่มี pagination → frontend crash หรือ memory leak

นี่คือ **production reality gap** ที่หลายโปรเจกต์ฝึกงานเจอตอน deploy จริง

**HOW:** สร้าง `database/mock_data_stress.sql`:
```sql
DECLARE @i INT = 1;
WHILE @i <= 1000 BEGIN
  INSERT INTO cameras (...) VALUES (CONCAT('CAM-', @i), ...);
  SET @i = @i + 1;
END
```

ทดสอบ API response time ด้วย stress mock **ก่อนเขียน React** — ถ้า API ช้า ต้องแก้ก่อน

#### [P2] ไม่มี Edge Case Data

**WHY:** Mock ปัจจุบันคือ "happy path" ทั้งหมด ไม่มี:
- Device ที่ offline
- Device ที่ไม่มี IP
- Camera ที่ NVR_CH ทับซ้อน
- Unicode/Thai characters ใน names
- Floor ที่ไม่มี room (orphan parent)

**HOW:** สร้าง `database/mock_data_edge_cases.sql` — Phase 7 จะได้ test UI กับข้อมูล "น่าเกลียด" ตั้งแต่แรก ไม่ใช่ตอน user เจอ

### Impact on Phase 7
- ต้องใช้ stress mock ก่อนตัดสินใจ pagination strategy
- ต้องใช้ edge case mock ทดสอบ alert color logic (จะรู้ตอนไหนว่า device offline แสดงสีถูก?)

---

## 7. Phase 6 — Backend API (C#)

นี่คือ phase ที่ผม **กังวลมากที่สุดสำหรับ Phase 7** เพราะ React จะกินตรงๆ

### Strengths
- 13 CRUD controllers ครบ
- Bruno collection = manual test + docs ในตัว
- HTTP methods แก้ถูกแล้ว
- Mock data ทดสอบ pass หมด

### Findings

#### [P0] ไม่มี Authentication / Authorization

**WHY:** จาก `PHASE_LOG.md` และ `MEGA_CONTEXT.md` **ไม่มีคำว่า auth, JWT, token, role, permission เลย** — API เปิดให้ทุกคนเรียกได้

ในระบบ surveillance:
- ข้อมูล CCTV/NVR position = **security-sensitive** สูงมาก (โจรรู้ตำแหน่งกล้องได้)
- ถ้า frontend deploy แล้ว URL leak ออกไป = ข้อมูลทั้ง organization เปิดเผย
- แม้จะเป็น intranet ก็ต้องมี auth — กัน insider threat (พนักงานเอง, malware)

**HOW (ต้องทำก่อน Phase 7):**

**Option A — JWT (recommended, 1-2 วัน):**
```csharp
// Install: Microsoft.AspNetCore.Authentication.JwtBearer
// Add LoginController:
[HttpPost("login")]
public IActionResult Login(LoginRequest req) {
    var user = _userService.Authenticate(req.Username, req.Password);
    if (user == null) return Unauthorized();
    var token = GenerateJwtToken(user);
    return Ok(new { token, role = user.Role });
}

// Add [Authorize] บน controllers:
[Authorize]
[ApiController]
public class CamerasController : ControllerBase { /*...*/ }

// Role-based:
[Authorize(Roles = "Admin")]
[HttpDelete("{id}")]
public IActionResult Delete(int id) { /*...*/ }
```

**Option B — API Key (basic, 2 ชม.):**
```csharp
// Middleware ตรวจ header `X-API-Key`
// ใช้สำหรับ MVP เร่งด่วนเท่านั้น — ไม่รองรับ RBAC
```

**คำเตือน:** ถ้าทำ Auth ไม่ทัน → deploy ใน internal network **ห้าม expose สู่ internet** เด็ดขาด

#### [P0] CORS Configuration

**WHY:** React (Phase 7) จะรันที่ `localhost:5173` (Vite default) C# API รันที่ port อื่น (เช่น `localhost:5001`) → browser block ทุก request ด้วย CORS policy ถ้าไม่ config

นี่คือ **blocker ที่ทำให้ React ไม่สามารถเรียก API ได้แม้แต่ครั้งเดียว** ถ้าไม่แก้ก่อน

**HOW (`Program.cs` หรือ `Startup.cs`):**
```csharp
services.AddCors(options => {
    options.AddPolicy("ReactDev", builder => {
        builder.WithOrigins("http://localhost:5173", "http://localhost:3000")
               .AllowAnyMethod()
               .AllowAnyHeader()
               .AllowCredentials();  // สำคัญถ้าใช้ cookie auth
    });
});

// ใน Configure:
app.UseCors("ReactDev");

// Production: ใช้ origin ของ intranet server จริง เท่านั้น
```

#### [P1] ไม่มี Standardized Error Response

**WHY:** ใน communication ระหว่าง C# API กับ React, **error format ที่ consistent คือสิ่งจำเป็น** ถ้าแต่ละ endpoint คืน error คนละแบบ React จะเขียน error handling ยากมาก

**HOW:** สร้าง `ApiResponse<T>` wrapper:
```csharp
public class ApiResponse<T> {
    public bool Success { get; set; }
    public T Data { get; set; }
    public ApiError Error { get; set; }
    public DateTime Timestamp { get; set; }
}

public class ApiError {
    public string Code { get; set; }      // "DEVICE_NOT_FOUND"
    public string Message { get; set; }    // user-facing
    public object Details { get; set; }    // validation errors, etc.
}
```

ใช้ใน controllers ทุกตัว:
```csharp
return Ok(new ApiResponse<Camera> {
    Success = true,
    Data = camera,
    Timestamp = DateTime.UtcNow
});
```

React จะมี contract ที่ชัด:
```typescript
if (!response.success) {
    showError(response.error.message);
}
```

#### [P1] ไม่มี Swagger / OpenAPI

**WHY:** Bruno collection ดีสำหรับ test แต่:
- React dev (Ran เอง) ต้องเปิด Bruno แต่ละไฟล์อ่าน body ทีละอัน
- ไม่มี TypeScript types generate อัตโนมัติ
- ถ้า API เปลี่ยน → ต้องอัปเดต Bruno ด้วยมือ → frontend ไม่รู้ → silent bug

**HOW (5 นาที):**
```bash
dotnet add package Swashbuckle.AspNetCore
```

```csharp
// Program.cs
builder.Services.AddSwaggerGen();

if (app.Environment.IsDevelopment()) {
    app.UseSwagger();
    app.UseSwaggerUI();
}
```

จากนั้นใน Phase 7:
```bash
npx openapi-typescript http://localhost:5001/swagger/v1/swagger.json -o src/api/types.ts
```

→ ได้ TypeScript types ทุก endpoint ฟรี

#### [P2] HTTP Methods เคยใช้ผิด = ไม่มี Test

**WHY:** จาก `PHASE_LOG.md`: *"HTTP methods บาง endpoint ใช้ผิด → แก้ไขแล้ว"* แก้แล้วดี แต่บ่งชี้ว่า **ไม่มี automated test** จับเรื่องนี้ได้ ถ้า refactor อีกครั้งอาจพังอีก

**HOW:** เพิ่ม integration test พื้นฐาน:
```csharp
// SmokeTests.cs
[Fact]
public async Task GetSites_Returns200() {
    var response = await _client.GetAsync("/api/sites");
    Assert.Equal(HttpStatusCode.OK, response.StatusCode);
}
```

อย่างน้อย 1 test ต่อ controller — กัน regression

#### [P2] Connection String Management

**WHY:** Home laptop ใช้ Windows Auth, Work notebook ใช้ SQL Auth — ถ้า hardcode ใน `Web.config` ต้องแก้ทุกครั้งสลับเครื่อง → เสี่ยง **commit password เข้า git โดยไม่ตั้งใจ**

**HOW:**
- ใช้ User Secrets ของ .NET (`dotnet user-secrets set`) — secrets เก็บนอก project folder
- Add `appsettings.Development.json` ใน `.gitignore`

### Impact on Phase 7
Phase 6 มี blocker ใหญ่ที่สุด — ต้องแก้อย่างน้อย 4 เรื่องก่อนเขียน React บรรทัดแรก:
1. CORS (1 ชม.)
2. JWT Auth (1-2 วัน)
3. Swagger (30 นาที)
4. Aggregate endpoint (1 วัน — ต่อในหัวข้อ Backend Changes)

---

# Part B — Phase 7 Frontend Review

## 8. Phase 7 — Frontend Plan Review

### Strengths
- Stack choices ส่วนใหญ่ถูกต้อง (React Flow, Recharts, Axios)
- RBAC matrix ครบและคิดละเอียด
- MVP scope ตกลงแล้ว (กับผมรอบที่แล้ว)
- Sitemap ครบ 12 หน้า

### Findings

#### [P0] Konva.js กับ Isometric — Stack Inconsistency

**WHY:**
- Plan ระบุ **Konva.js สำหรับ Floor Plan** (2D drag-drop) — เหมาะสมมาก
- แต่ Site Overview และ Building Detail ต้องการ **isometric 3D rendering** — Konva.js ไม่เหมาะ
- ใน FRONTEND_PLAN.md ระบุว่า "Isometric View — Unknown — awaiting recommendation"

Wireframe ปัจจุบัน (Claude Design generated) ไม่ใช่ isometric จริง — เป็น **flat polygon ที่วาดให้ดูเฉียง** ซึ่งเป็น "fake 3D" — render hollow และดูไม่สวย (Ran ก็เห็นว่า issue แล้ว)

**HOW — 3 options trade-off:**

| Option | Tech | Effort | Quality | คำแนะนำ |
|---|---|---|---|---|
| **A** | SVG ที่วาดด้วย React + math (ไม่ใช้ lib) | Medium | Medium | ✅ **แนะนำสำหรับ MVP** |
| **B** | Three.js — true 3D | High | High | ❌ overkill, 1 สัปดาห์ขึ้นไป |
| **C** | ทิ้ง isometric → ใช้ 2D top-down + card list | Low | Low-Medium | ✅ ถ้าไม่ทันใช้นี่ |

**คำแนะนำเชิงปฏิบัติ:** **เริ่มจาก Option C** (2D top-down + card list) ทำให้เสร็จเร็ว แล้ว upgrade เป็น Option A ถ้ามีเวลา ไม่ต้องเสียเวลากับ isometric ใน MVP

อย่ามองข้ามว่า "ตึก isometric เท่ๆ" คือ requirement — มัน **ไม่ใช่** requirement การ monitor — เป็น nice-to-have ที่กิน effort เยอะมาก

#### [P0] RBAC Logic ขัดแย้งกับ MVP Scope

**WHY:** Plan บอก MVP scope ตัด RBAC ออก ("Phase 7.5 — Basic RBAC") — แต่ RBAC matrix ใน plan ระบุละเอียดว่า:
- User เห็น camera name อย่างเดียว
- Guest ไม่เข้า floor plan
- Admin only เข้า Room/Rack

ถ้า MVP ไม่มี RBAC → ทุกคนเห็นทุกอย่าง → **leak ข้อมูล surveillance** ทันที (ไม่ปลอดภัย)
ถ้า MVP มี RBAC → scope ใหญ่กว่า MVP

**HOW:**

**ตัดสินใจตอนนี้:** MVP ต้องมี **basic RBAC** อย่างน้อย 2 levels:
- **Admin** — เห็นทุกอย่าง
- **Non-Admin** (= User+Guest รวม) — เห็นแค่ Topology + Site list + Site Overview (อ่านอย่างเดียว)

ตัด Guest layer ออกใน MVP — รวมกับ User เป็น "Viewer" → simpler RBAC, ทำได้ใน 1 วัน

หลัง demo ค่อยแยก User/Guest อีก

#### [P1] Topology + React Flow — Scale Limitation

**WHY:** Wireframe topology แสดง **6 sites + HQ = 7 nodes** ดูดี

แต่ถ้าจริงๆ มี:
- 50+ sites (enterprise scale)
- หรือ topology ต้องแสดง **devices ด้วย** (NVR, Switch หลายร้อย)

React Flow จะ render ช้าและ overwhelm user ทันที — ไม่เหมาะกับ scale จริง

**HOW (mitigation):**
- Topology = HQ + Sites เท่านั้น (ตอนนี้ถูกแล้ว) — **อย่าขยายไปแสดง device level**
- ถ้า site เกิน 30 → group เป็น region (เช่น "Bangkok area: 12 sites")
- ทำเฉพาะกับ HQ + Sites ใน MVP — เพียงพอสำหรับ demo

#### [P2] Routing Pattern Inconsistency

**WHY:** Sitemap มี mixed pattern:
```
/sites/:site_id/buildings/:building_id/floors/:floor_id    ← nested
/rooms/:room_id                                            ← flat
/racks/:rack_id                                            ← flat
/devices/cameras/:id                                       ← flat
```

ปัญหา:
- Breadcrumb ทำยาก (flat route ไม่มี parent context ใน URL)
- ถ้าผู้ใช้ bookmark `/rooms/123` แล้วเปิดใหม่ → ไม่รู้ room นี้อยู่ floor ไหน → breadcrumb แสดงไม่ได้

**HOW — 2 options:**

**Option A — All nested (consistent):**
```
/sites/:site_id/buildings/:building_id/floors/:floor_id/rooms/:room_id/racks/:rack_id
/sites/:site_id/buildings/:building_id/floors/:floor_id/rooms/:room_id/racks/:rack_id/devices/cameras/:id
```
ยาวแต่ self-contained

**Option B — Flat + query parent in API:**
```
/rooms/:room_id  →  React fetch room, API คืน room พร้อม parent chain
```
URL สั้น แต่ต้องการ API endpoint คืน parent chain ด้วย

**คำแนะนำ:** **Option B** — ใช้ flat routes แต่ทำ API endpoint:
```
GET /api/rooms/{id}/breadcrumb
  → คืน [{ type: "site", id: 1, name: "HQ" }, { type: "building", ... }, ...]
```

React ใช้ breadcrumb data render แถบบนได้ง่าย ไม่ผูก URL ยาว

#### [P2] "My Devices" Sidebar — Unclear UX

**WHY:** Plan บอก "My Devices = permanent menu ทุก layer, กด Add กรอก IP/ข้อมูล sync อัตโนมัติ"

คำถาม:
- "My Devices" คืออะไรในเชิง business? Devices ที่ user คนนี้ดูแลส่วนตัว?
- "Sync อัตโนมัติ" หมายถึง ping device แล้ว auto-discover? หรือ?
- เกี่ยวข้องอย่างไรกับ hierarchy หลัก (Site→Building→...)?

ถ้าตอบไม่ได้ชัด → **ตัดออกจาก MVP** — เพิ่ม feature ที่ unclear = bug magnet

**HOW:** ตัด "My Devices" ออกจาก MVP — มี Sites + Hierarchy navigation พอ

---

## 9. Wireframe Review

ดูจากภาพถ่ายมือที่ Ran วงสีแดงไว้ — สื่อชัดเจนว่า Ran รู้ปัญหาอยู่แล้ว ผมจะวิเคราะห์ทีละจุด

### 9.1 Topology Page (Home)

**สิ่งที่ดีมาก:**
- Layout สะอาด, hierarchy ชัด
- HQ ตรงกลาง, sites รอบๆ = correct mental model
- Status badges + alert count = informative
- Minimap = nice touch
- Footer notes (Library/Polling/Click/Alert) = helpful as design doc

**Red circles ของ Ran:**

#### [P1] Sidebar เนื้อหาตายตัวทุกหน้า — Dynamic Sidebar Spec

**WHY:** Wireframe ทุกหน้าแสดง sidebar เดียวกัน (Sites list) — ไม่ได้สะท้อน layer ปัจจุบัน WIREFRAME_STATUS.md ของ Ran spec ไว้ดีแล้วว่าต้อง dynamic:

```
Layer ปัจจุบัน    →  Sidebar แสดง
Home/Topology      →  Sites list
Site Overview      →  Buildings ใน site นั้น
Building Detail    →  Floors ใน building นั้น
Floor Plan         →  Rooms (หรือ cameras list)
Room/Rack          →  Devices ใน rack
```

ผมเห็นด้วย 100% กับ spec นี้ — เป็น **context-aware navigation** ที่ดี

**HOW (implementation guidance for React):**
```jsx
// useContext + route params
const sidebarItems = useSidebarItems();  // hook ที่ derive จาก current route

// /sites/:site_id  → useSidebarItems return buildings of site_id
// /sites/:site_id/buildings/:building_id  → return floors
```

**สำคัญ:** Sidebar ต้องมี **"กลับขึ้น 1 ระดับ" button** ด้วย — ไม่งั้น user ติดในระดับล่างสุดออกไปไหนไม่ได้นอกจากกด browser back

#### [P2] "My Devices" ตามคำเตือนข้างบน — ตัดออก

ไม่ต้องอธิบายซ้ำ

### 9.2 Topology Footer Notes — Implementation Detail Leak

**WHY:** Wireframe มี footer ที่อธิบาย:
- "Library — React Flow. Nodes draggable in dev only..."
- "Polling — GET /api/topology every 30s..."
- "Click site node → route to /sites/:site_id..."

นี่คือ **implementation notes** ที่ดีสำหรับเป็น dev documentation **แต่ห้ามแสดงให้ user เห็น** ใน production

**HOW:**
- ใน wireframe เก็บไว้ได้ (เป็น communication กับ dev)
- ใน production: ลบออกหมด หรือซ่อนใต้ feature flag `?debug=true`

### 9.3 Site Overview — Hollow Buildings Issue

**WHY:** Ran เห็นปัญหานี้แล้ว — Claude Design render ออกมาเป็น polygon โปร่ง ไม่ใช่ solid 3D

ปัญหารากเหง้า: tool ที่ generate ไม่เหมาะกับงาน 3D isometric — เป็น vector drawing tool ทั่วไป

**HOW:** ตามที่ผมแนะนำในหัวข้อ 8 — **drop isometric ทิ้ง** ใช้ 2D top-down + card list แทน:

```
┌─────────────────────────────────────┐
│ Site A — HQ Bangkok                 │
├─────────────────────────────────────┤
│ ┌─────────┐ ┌─────────┐ ┌─────────┐│
│ │Building │ │Building │ │Building ││
│ │A — Main │ │B — Annex│ │C — WH   ││
│ │🔴 2 fail│ │🟢 ok    │ │🟢 ok    ││
│ │8 floors │ │4 floors │ │1 floor  ││
│ │42 dev   │ │18 dev   │ │6 dev    ││
│ └─────────┘ └─────────┘ └─────────┘│
└─────────────────────────────────────┘
```

หรือถ้าอยาก "เห็นตำแหน่งจริง" → upload map image ของ site (รูปจริง) แล้ววาง building marker บนรูป (Konva.js ทำได้ — เหมือน Floor Plan layer)

### 9.4 Building Detail — Same Hollow Issue

เหมือนกับ Site Overview — drop isometric, ใช้ floor list แทน:

```
Building A — Main Tower (8 floors)

Floor 8  🟢 12 cameras
Floor 7  🟢  8 cameras
Floor 6  🔴  6 cameras (2 offline)
Floor 5  🟢 10 cameras
Floor 4  🟢  8 cameras
...
```

แทบจะดีกว่า isometric ในแง่ readability — admin scan ได้เร็วกว่า

### 9.5 Floor Plan, Rack Detail (ไม่มีในภาพถ่ายมือ)

จาก WIREFRAME_STATUS.md:
- Floor Plan ✅ Draft — View/Edit mode toggle, camera icons
- Rack Detail ✅ Draft — "best page so far"

**Concern P1 ที่ผมเห็นล่วงหน้า:**

**Floor Plan:**
- ต้องมี floor plan image upload feature → admin upload รูป plan ของชั้น
- ถ้าไม่มีรูป plan → fall back เป็น grid ธรรมดา?
- Plan image stored ที่ไหน? File system? DB blob? CDN?

**Rack Detail:**
- u_subposition (sub 1-3 ใน 1 U) ยังไม่ implement ตามที่ WIREFRAME_STATUS ระบุ — Ran รู้แล้ว
- จริงๆ ก็พอ MVP — sub-position ใส่ทีหลังได้

---

## 10. RACK_POSITION.md Review

### Strengths
- Spec ละเอียดมาก, มี diagram ASCII art อธิบายชัด
- WHY ของ sub-position (airflow 14mm vs 44mm) = engineering reasoning ที่ดี
- Known Limitation section = honest documentation
- CHECK constraints ครบ

### Findings

#### [P1] Hardcoded `BETWEEN 1 AND 3` คือ Time Bomb

**WHY:** เอกสารระบุชัดเจน:
- `racks.units_per_u` รับค่า 1-12
- แต่ CHECK constraint บน `u_subposition` hardcode `BETWEEN 1 AND 3`

ในวันที่มี rack ที่ใช้ `units_per_u = 6` (อนาคต) → save ไม่ได้ → silent failure ที่ผู้ใช้งงมาก

แม้ document ระบุว่า "v1.0 ทุก rack ใช้ default = 3" แต่:
- ไม่มี **runtime guard** บอก admin ว่า "อย่าตั้ง units_per_u > 3"
- ถ้ามีคนเปลี่ยน rack config โดยไม่อ่าน doc → data inconsistent

**HOW (mitigation ที่ Service layer):**

**ตอนนี้:** เพิ่ม validation ใน C# Service:
```csharp
public ValidationResult ValidateRackConfig(Rack rack) {
    if (rack.UnitsPerU != 3) {
        return Warning("v1.0 supports units_per_u = 3 only. " +
                       "Devices with u_subposition > 3 cannot be saved.");
    }
    return Success();
}
```

**Phase 7 (UI):** Form ของ Rack — disable input `units_per_u` ใน v1.0 (lock at 3) พร้อม tooltip อธิบาย

**Future (v2.0):** ตามที่ doc บอก — เปลี่ยน CHECK เป็น trigger ที่อ่าน parent rack

#### [P2] Cameras ไม่มี Rack Position — Plan UI ไม่ครอบคลุม

**WHY:** RACK_POSITION.md ระบุชัด: *"Cameras are excluded — wall/ceiling mounted"*

แต่ทาง wireframe Floor Plan ระบุ camera icons วางบนแปลน — ดี
แต่ใน RACK_POSITION.md ไม่กล่าวว่าใน schema มี field สำหรับ **wall position** ของ camera

คำถาม: camera มี field `x_position`, `y_position` บน floor plan มั้ย? ถ้าไม่มี → drag-drop ใน Floor Plan layer **save ไม่ได้**

**HOW:**
- ตรวจ schema ว่ามี field สำหรับ camera position บน floor plan หรือยัง
- ถ้าไม่มี → ต้องเพิ่ม field ใน `cameras` table:
  ```sql
  ALTER TABLE cameras ADD position_x DECIMAL(10,2) NULL;
  ALTER TABLE cameras ADD position_y DECIMAL(10,2) NULL;
  ALTER TABLE cameras ADD floor_plan_id INT NULL;  -- FK to floor plan image
  ```
- ถ้าไม่มี → drag-drop ใน Phase 7 จะใช้งานไม่ได้

**ผมไม่มี SQL schema ในมือตอนนี้** — Ran ช่วยเช็คให้ที

#### [P3] Index Naming Inconsistency

**WHY:** `IX_nvrs_rack_slot` vs `IX_sw_rack_slot` — table หนึ่งใช้ full name (nvrs) อีก table ย่อ (sw)

ไม่ใช่ปัญหาใหญ่ แต่ inconsistent — ควร normalize เป็น `IX_poe_switches_rack_slot`

### Impact on Phase 7
Rack UI implementation พึ่งพา spec นี้ — สามารถ MVP ได้โดย:
1. แสดง U-position level เท่านั้น (ไม่ render sub-position)
2. Drag-drop snap to U
3. v2.0 ค่อย add sub-position rendering

---

## 11. Backend Changes Review

> Branch: `backend` — เพิ่ม endpoints สำหรับ Phase 7

### Endpoint List (จาก FRONTEND_PLAN.md)

```
GET /api/Getbuildings?site_id=
GET /api/Getfloors?building_id=
GET /api/Getrooms?floor_id=
GET /api/Getracks?room_id=
GET /api/Getcameras?rack_id=
GET /api/Getnvrs?rack_id=
GET /api/GetpoeSwitches?rack_id=
GET /api/Get{table}/{id}
```

### Findings

#### [P0] Filter Endpoints ตาม Anti-Pattern (Still N+1)

**WHY:** การมี `GET /api/Getbuildings?site_id=X` ก็ยังไม่แก้ N+1 problem — React ยังต้องเรียก:
```
1. GET /api/Getsites → 5 sites
2. ต่อ site:
   GET /api/Getbuildings?site_id=1 → 5 buildings
   GET /api/Getbuildings?site_id=2 → 5 buildings
   ... × 5 calls
3. ต่อ building:
   GET /api/Getfloors?building_id=1 → ...
   ... × 25 calls
```

ใช้ filter parameter = พัฒนาขึ้นจาก get-all แต่ **ยังไม่พอ** สำหรับ render tree

**HOW (เพิ่ม aggregate endpoints):**

แทนที่จะทำแค่ filter endpoints ให้เพิ่ม 3 endpoints หลัก:

```csharp
// 1. Tree hierarchy
[HttpGet("hierarchy/tree")]
public ApiResponse<List<SiteTreeDto>> GetTree() {
    // ใช้ existing view → nested DTOs ใน 1 call
}

// 2. Aggregate stats per site
[HttpGet("dashboard/summary")]
public ApiResponse<DashboardDto> GetDashboard() {
    // { totalSites: 4, totalDevices: 87, alertCount: 3, ... }
}

// 3. Breadcrumb path (สำหรับ flat routes)
[HttpGet("rooms/{id}/breadcrumb")]
public ApiResponse<List<BreadcrumbDto>> GetBreadcrumb(int id) {
    // [{ type: "site", id: 1, name: "HQ" }, ...]
}
```

**Filter endpoints ก็ทำเก็บไว้** สำหรับกรณี dynamic load (เช่น sidebar dropdown) แต่ **อย่าใช้สำหรับ initial tree render**

#### [P1] Naming Convention — `Get` Prefix ซ้ำซ้อน

**WHY:** REST convention คือ HTTP method (GET) บอก action อยู่แล้ว — ไม่ต้องใส่ `Get` ใน URL

```
❌ GET /api/Getbuildings
❌ GET /api/Getcameras
✅ GET /api/buildings
✅ GET /api/cameras
```

แม้จะดูเล็กน้อย แต่:
- เป็น industry standard
- ทำให้ Swagger docs สะอาดขึ้น
- ทำให้ TypeScript generated names ดูเป็นมืออาชีพ

**HOW:** Rename ก่อน Phase 7 (15 นาที):
```
GET /api/Getbuildings → GET /api/buildings
GET /api/buildings?site_id=X
GET /api/buildings/{id}
```

**Case sensitivity:** ใช้ lowercase ทั้งหมด — `buildings` ไม่ใช่ `Buildings` (URL ควรเป็น lowercase ตาม convention)

#### [P1] Inconsistent Casing — `GetpoeSwitches`

**WHY:** Mixed camelCase + lowercase ใน endpoint name = บ่งบอกว่ายังไม่มี style guide

ถ้าใช้ kebab-case (industry standard for URLs):
```
✅ GET /api/poe-switches
✅ GET /api/poe-switches/{id}
✅ GET /api/poe-switches?rack-id=1
```

**HOW:** Standardize ทั้งหมด:
- URL path: kebab-case (`poe-switches`, `floor-plans`)
- Query parameter: camelCase (`?rackId=1`) หรือ snake_case (`?rack_id=1`) — เลือกแบบเดียว

#### [P2] ไม่มี Pagination

**WHY:** `GET /api/cameras` คืน camera ทั้งหมด — ถ้ามี 1000 cameras = response 1000 records → slow, heavy memory

**HOW:**
```
GET /api/cameras?page=1&pageSize=50
→ { data: [...], total: 1000, page: 1, pageSize: 50, totalPages: 20 }
```

ใส่ใน base controller ใช้ซ้ำ:
```csharp
public class PagedResponse<T> {
    public List<T> Data { get; set; }
    public int Total { get; set; }
    public int Page { get; set; }
    public int PageSize { get; set; }
    public int TotalPages { get; set; }
}
```

#### [P2] ไม่มี Filter / Sort Standard

**WHY:** ถ้าต้องการ "ดึง cameras ที่ offline เท่านั้น" — endpoint ไหน?

**HOW:**
```
GET /api/cameras?status=offline
GET /api/cameras?status=offline&sort=name&order=asc
GET /api/cameras?building_id=1&status=offline
```

ทำ query parameter เป็น standard ใน base controller

#### [P1] ไม่มี Realtime Status Endpoint

**WHY:** Plan บอก polling 30 วินาที — เรียก endpoint อะไร?

ถ้าเรียก `GET /api/cameras` ทุก 30 วินาที → ดึงข้อมูลครบทั้งหมด = หนัก

**HOW:** สร้าง endpoint เฉพาะสำหรับ realtime status:
```
GET /api/status/devices
→ คืนเฉพาะ {id, type, status, last_seen} ของทุก device
→ lightweight, ~few KB แม้มี 1000 devices
```

React polling endpoint นี้แทนการ refresh ทั้ง tree

#### [P0] ไม่มี Authentication Endpoints

**WHY:** ตามที่ review Phase 6 — ต้องมี:
```
POST /api/auth/login   → { token, role, expiresIn }
POST /api/auth/logout
GET  /api/auth/me      → current user info
```

ไม่มี = ไม่มี auth = ไม่มี RBAC = scope ทั้งหมดที่วางไว้พังหมด

### สรุป Backend Changes ที่ต้องทำก่อน Phase 7

| Priority | Change | Effort |
|---|---|---|
| P0 | Auth endpoints (login/logout/me) | 1-2 วัน |
| P0 | CORS config | 1 ชม. |
| P0 | Aggregate endpoints (tree, dashboard, breadcrumb) | 1 วัน |
| P0 | Status endpoint สำหรับ polling | 4 ชม. |
| P1 | Rename endpoints (drop `Get` prefix) | 30 นาที |
| P1 | Standardize casing (kebab-case URLs) | 15 นาที |
| P1 | Swagger setup | 30 นาที |
| P1 | Standard error response wrapper | 4 ชม. |
| P2 | Pagination | 4 ชม. |
| P2 | Filter/sort standard | 4 ชม. |

**Total estimate: ~5-7 วันทำงาน ก่อนแตะ React**

---

## 12. Answers to Open Decisions

### Q1: State Management — Zustand / Context API / Redux?

**Recommendation: Zustand + React Query (TanStack Query)**

**WHY:**

| Option | Pros | Cons | Verdict |
|---|---|---|---|
| **Context API** | Built-in, ไม่ต้อง install | ช้าเมื่อ state ใหญ่, re-render ทั้งtree | ❌ |
| **Redux Toolkit** | Mature, devtools ดี | Boilerplate เยอะ, learning curve | ❌ overkill |
| **Zustand** | Small (1KB), zero boilerplate, simple API | Community เล็กกว่า Redux | ✅ |
| **React Query** | จัดการ server state, caching, refetch อัตโนมัติ | ไม่ใช่ client state library | ✅ ใช้ร่วม Zustand |

**HOW (split responsibility):**
- **Zustand** = client state (user, theme, sidebar collapsed, current layer)
- **React Query** = server state (sites, devices, alerts — auto-cache, auto-refetch ทุก 30 วินาที)

```jsx
// stores/authStore.js
import { create } from 'zustand'
export const useAuthStore = create((set) => ({
    user: null,
    setUser: (user) => set({ user }),
    logout: () => set({ user: null })
}))

// hooks/useDevices.js
import { useQuery } from '@tanstack/react-query'
export const useDevices = () => useQuery({
    queryKey: ['devices'],
    queryFn: fetchDevices,
    refetchInterval: 30000  // polling 30s
})
```

**Why this combo คือ industry standard 2025-2026:**
- Vercel, Linear, Notion ใช้ pattern นี้
- น้อย boilerplate ที่สุดในตัวเลือกทั้งหมด
- Built-in caching = polling ไม่หนัก network

### Q2: Routing — React Router Structure?

**Recommendation: React Router v6 + Flat routes + Breadcrumb API**

**HOW:**
```jsx
<BrowserRouter>
  <Routes>
    <Route path="/login" element={<Login />} />
    <Route element={<ProtectedLayout />}>  {/* requires auth */}
      <Route path="/" element={<Topology />} />
      <Route path="/sites" element={<SiteList />} />
      <Route path="/sites/:siteId" element={<SiteOverview />} />
      <Route path="/sites/:siteId/buildings/:buildingId" element={<BuildingDetail />} />
      <Route path="/sites/:siteId/buildings/:buildingId/floors/:floorId" element={<FloorPlan />} />
      
      {/* Flat routes for deep layers */}
      <Route element={<AdminOnlyLayout />}>  {/* requires Admin */}
        <Route path="/rooms/:roomId" element={<RoomView />} />
        <Route path="/racks/:rackId" element={<RackDetail />} />
        <Route path="/devices/cameras/:id" element={<CameraDetail />} />
        <Route path="/devices/nvrs/:id" element={<NvrDetail />} />
        <Route path="/devices/switches/:id" element={<SwitchDetail />} />
        <Route path="/admin/users" element={<UserManagement />} />
      </Route>
    </Route>
  </Routes>
</BrowserRouter>
```

**Layout components:**
- `ProtectedLayout` — เช็ค auth, redirect ไป login ถ้าไม่มี token
- `AdminOnlyLayout` — เช็ค role === 'admin', แสดง 403 ถ้าไม่ใช่

**Breadcrumb:** ใช้ API endpoint `/api/{type}/{id}/breadcrumb` แทนการ derive จาก URL

### Q3: Isometric View Library?

**Recommendation: Drop isometric. ใช้ 2D top-down + card list สำหรับ MVP**

ตามที่ review ในหัวข้อ 8 และ 9 แล้ว — isometric กิน effort เยอะมาก, ไม่ใช่ requirement การ monitor

**ถ้าจริงๆ ต้องการ visual ของ building (post-MVP):**
- **Option A:** Upload image ของ floor plan แต่ละชั้น → ใช้ Konva.js (เหมือน Floor Plan layer)
- **Option B:** Three.js (เกินกำลัง MVP)

---

## 13. Final MVP Roadmap

### Updated MVP Scope (ตัดให้เหลือทำได้จริง 6 สัปดาห์)

#### Week 0 (ก่อนเขียน React) — Backend Prep
- [ ] CORS config
- [ ] JWT Auth + Login endpoint
- [ ] Rename endpoints (drop `Get` prefix, kebab-case)
- [ ] Swagger setup
- [ ] Standard error response wrapper
- [ ] Aggregate endpoint: `GET /api/hierarchy/tree`
- [ ] Status endpoint: `GET /api/status/devices`
- [ ] Breadcrumb endpoint: `GET /api/{type}/{id}/breadcrumb`
- [ ] Stress mock data (1000+ rows)

**Estimate: 5-7 วัน**

#### Week 1 — React Setup + Auth
- [ ] Vite + React + TypeScript project
- [ ] Tailwind CSS setup
- [ ] React Router setup
- [ ] Zustand + React Query
- [ ] Axios instance + interceptor (auto-attach JWT)
- [ ] Login page + auth flow
- [ ] ProtectedLayout component
- [ ] Generate TypeScript types from Swagger

#### Week 2 — Layout + Topology + Site List
- [ ] Sidebar component (dynamic, context-aware)
- [ ] Breadcrumb component
- [ ] Topology page (React Flow)
- [ ] Site list page (cards/grid)

#### Week 3 — Site Overview + Building Detail
- [ ] Site Overview (2D top-down + building cards) — **ไม่ทำ isometric**
- [ ] Building Detail (floor list)
- [ ] Alert propagation logic

#### Week 4 — Floor Plan + Rack
- [ ] Floor Plan page (Konva.js)
  - Static view mode only (drag-drop เป็น stretch goal)
- [ ] Room View (rack list)
- [ ] Rack Detail (vertical U-position diagram)
  - U-level only (sub-position post-MVP)

#### Week 5 — Device Detail + Realtime
- [ ] Camera Detail (info + Recharts ping graph — refresh-on-load)
- [ ] NVR Detail
- [ ] Switch Detail
- [ ] Polling integration (30s status refresh)
- [ ] Alert popup (when status changes)

#### Week 6 — Polish + Deploy + Buffer
- [ ] AdminOnlyLayout (basic RBAC: admin vs viewer)
- [ ] Dark mode toggle
- [ ] Error states / loading states ทุกหน้า
- [ ] Build + deploy to internal server
- [ ] Buffer for bugs + supervisor feedback

### ตัดออกจาก MVP (ไป Phase 7.5 หรือ Phase 8)
- ❌ Isometric 3D rendering (ทุกหน้า)
- ❌ Floor Plan Edit mode (drag-drop camera)
- ❌ CRUD forms ทั้ง 13 tables
- ❌ User Management UI
- ❌ Audit log
- ❌ Discord alert integration (server-side OK, UI ไม่ทำ)
- ❌ "My Devices" sidebar feature
- ❌ Guest role (รวมกับ User เป็น "Viewer")
- ❌ Sub U-position rendering ใน Rack
- ❌ SignalR realtime (ใช้ polling พอ)

---

## 14. Critical Action Items Before Coding

### ต้องทำเลย (สัปดาห์นี้)

| # | Task | Priority | Owner |
|---|---|---|---|
| 1 | ตรวจ schema: cameras มี position_x, position_y มั้ย? ถ้าไม่มี → เพิ่ม | P0 | Ran |
| 2 | เพิ่ม CORS ใน C# API | P0 | Ran |
| 3 | เพิ่ม Auth endpoints + JWT | P0 | Ran |
| 4 | สร้าง aggregate endpoints (tree, status, breadcrumb) | P0 | Ran |
| 5 | Setup Swagger | P1 | Ran |
| 6 | Rename endpoints, ลบ `Get` prefix | P1 | Ran |
| 7 | Generate stress mock data | P1 | Ran |
| 8 | Document deprecation ใน ssm_import.py | P2 | Ran |

### ต้องตัดสินใจ (ก่อนเริ่ม Week 1)

| # | Decision | Recommendation |
|---|---|---|
| 1 | Isometric rendering — ทำหรือไม่ทำ? | **ตัดออก** ใน MVP |
| 2 | "My Devices" sidebar — เก็บหรือตัด? | **ตัดออก** |
| 3 | Guest role — แยกหรือรวม User? | **รวมเป็น Viewer** |
| 4 | Floor Plan Edit mode — ทำใน MVP? | **เก็บไว้ post-MVP** |
| 5 | Building Detail isometric — ทำใน MVP? | **floor list แทน** |

### Documentation ที่ต้องเขียน

| # | Document | Reason |
|---|---|---|
| 1 | `docs/architecture/DECISIONS.md` | บันทึก architectural decisions + rationale |
| 2 | `docs/workflow/VALIDATION_RULES.md` | Capture business rules ที่ Python เคยมี |
| 3 | `database/PORTABILITY_NOTES.md` | SQL Server-specific features |
| 4 | `api/AUTH.md` | Auth flow + token format |

---

## Final Reviewer Notes

### สิ่งที่ Ran ทำได้ดีกว่าคนทั่วไปที่ฝึกงาน

1. **Documentation discipline** — `MEGA_CONTEXT.md`, `PHASE_LOG.md`, `RACK_POSITION.md` คุณภาพระดับ professional
2. **Engineering thinking** — แก้ schema, retire script, ทำ Bruno collection — ทุกอย่างมีเหตุผล
3. **Security awareness** — sanitizer + กังวลเรื่อง intranet — ระดับ senior แล้ว
4. **เรียนรู้เร็ว** — จาก Python → SQL → C# → React = stack กว้าง

### สิ่งที่อยากให้ Ran เก็บไว้คิด

1. **MVP คือ "เล็กแต่ครบ" ไม่ใช่ "ลดคุณภาพ"** — demo 1 หน้าที่ทำงานได้สมบูรณ์ ดีกว่า 10 หน้าที่พัง
2. **Scope creep คือศัตรู** — ทุก feature ที่เพิ่ม = เวลาที่หายไปจาก core features
3. **Polish 80% เก็บ 20%** — Pareto principle ใช้ได้กับโปรเจกต์ฝึกงาน
4. **Document decisions เพิ่ม** — ทุก "ทำไมเลือกอันนี้" เขียนไว้ — ตัวคุณเองตอน 3 เดือนข้างหน้าจะขอบคุณตัวเองตอนนี้

### Realistic Assessment สำหรับ Demo กรกฎาคม

**สิ่งที่ทำได้ทันด้วย MVP scope:**
- ✅ Login + Auth
- ✅ Topology (React Flow) + Sites list
- ✅ Site → Building → Floor navigation (ไม่ isometric)
- ✅ Floor Plan view-only (Konva.js render camera icons)
- ✅ Device detail page + ping graph (refresh-on-load)
- ✅ Status polling 30 วินาที
- ✅ Basic RBAC (admin vs viewer)

**Demo message:** "ระบบ end-to-end ครบ loop จาก DB → API → UI พร้อม auth + RBAC พื้นฐาน + monitoring realtime"

**ห้ามพูด:** "MVP เท่านั้น เดี๋ยวจะทำอีกเยอะ" — ให้พูดว่า "Phase 7 เสร็จเรียบร้อย Phase 8 จะเพิ่ม CRUD UI + user management"

---

## Sign-off

| Section | Status |
|---|---|
| Phase 1-6 Retrospective | ✅ Reviewed |
| Phase 7 Plan | ✅ Reviewed |
| Wireframes | ✅ Reviewed |
| RACK_POSITION.md | ✅ Reviewed |
| Backend Changes | ✅ Reviewed |
| Open Decisions | ✅ Answered |
| MVP Roadmap | ✅ Proposed |

**Total findings:**
- P0: 8
- P1: 12
- P2: 11
- P3: 2

**Next steps:** Ran review เอกสารนี้ → ตอบกลับว่า agree/disagree ตรงไหน → ผมช่วยลงรายละเอียดเฉพาะส่วนที่ Ran เลือกได้

---

*End of Review — 2026-05-22*
