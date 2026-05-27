# FRONTEND_PLAN_REVIEW_V2.md
## Technical Review & Retrospective — SSM v1.0 (Phase 1 → Phase 7) — Revised Edition

> **Reviewer role:** Senior System Architect & Tech Lead
> **Reviewee:** Ran (Susan) — Intern Network Engineer, Year 4
> **Review date:** 2026-05-22
> **Version:** 2.0 — incorporates Ran's feedback from Round 1, 2, and 3
> **Previous version:** `FRONTEND_PLAN_REVIEW.md`
> **Deadline reference:** Early July 2026 (~6 weeks)
> **Mode:** Solo developer

---

## What Changed from V1

This V2 incorporates Ran's pushback and clarifications from 3 rounds of feedback:

| Section | V1 Recommendation | V2 Revision | Reason |
|---|---|---|---|
| 8. Isometric | Drop entirely | **Defer to post-MVP + use renderer pattern** | Visual layer has value for non-technical staff + extensibility for future facility mgmt |
| 8. My Devices | Cut from MVP | **Rename to "Quick Add" + keep in MVP (Camera only)** | Technician shortcut for device registration — valid workflow |
| 8. Guest role | Merge with User → Viewer | **Same — agreed** | Simpler RBAC for MVP |
| 10. Camera position | Add position_x/y as DECIMAL | **Use percentage (0.0–1.0) + separate floor_plans table** | Robust to image resize/replace; floor plan version belongs to floor not camera |
| 10. Floor plan upload | Multi-admin upload workflow | **Single IT admin model + 6-layer path validation + TOCTOU mitigation** | Operational simplicity + security boundary |
| 14. Action items | Original 8 items | **Added: schema changes for camera position + floor_plans table + security spec** | Needed before Floor Plan layer can work |

---

## Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [Phase 1 Review — Data Sanitizer](#2-phase-1--data-sanitizer)
3. [Phase 2 Review — SQL Schema v2](#3-phase-2--sql-schema-v2)
4. [Phase 3 Review — Excel Template v4](#4-phase-3--excel-template-v4)
5. [Phase 4 Review — Python Importer (Retired)](#5-phase-4--python-importer-retired)
6. [Phase 5 Review — Mock Data SQL](#6-phase-5--mock-data-sql)
7. [Phase 6 Review — Backend API (C#)](#7-phase-6--backend-api-c)
8. [Phase 7 Review — Frontend Plan (REVISED)](#8-phase-7--frontend-plan-revised)
9. [Wireframe Review](#9-wireframe-review)
10. [Camera Position + Floor Plan Spec (REVISED)](#10-camera-position--floor-plan-spec-revised)
11. [Backend Changes Review](#11-backend-changes-review)
12. [Answers to Open Decisions](#12-answers-to-open-decisions)
13. [Final MVP Roadmap (REVISED)](#13-final-mvp-roadmap-revised)
14. [Critical Action Items Before Coding (REVISED)](#14-critical-action-items-before-coding-revised)

---

## 1. Executive Summary

### โดยรวม
Ran ทำงานในระดับที่ **เกินคาดสำหรับ intern** — มี engineering mindset, documentation ครบ, test coverage จริง, และ wireframe ที่ออกแบบมีความคิด UX ที่ดี การพูดคุย review 3 รอบที่ผ่านมา Ran มี **product thinking** ที่ดี ไม่ใช่แค่ technical thinking — push back ด้วยเหตุผลในจุดที่ควร push back และเข้าใจ security boundaries เมื่อมีการอธิบาย

### แต่ความเป็นจริงต้องพูดตรงๆ
Scope ของ Phase 7 (รวม Quick Add + RBAC + drag-drop floor plan + realtime polling + floor plan management) ยัง **เกินกำลัง 1 คน × 6 สัปดาห์** ผมยังยืนยันว่าต้องตัด feature บางอย่าง — แต่ตัดน้อยกว่า V1

### Verdict
- ✅ **Architecture decisions ส่วนใหญ่ถูก** — schema, stack choice, intranet deployment
- ⚠️ **มี blocker 3 ตัวที่ต้องแก้ก่อนเขียน React** (CORS, Auth, Aggregate endpoints)
- ⚠️ **เพิ่ม schema change ใหม่** — `cameras.position_x/y` + `floor_plans` table — ต้องทำก่อน Floor Plan layer
- 🔒 **Floor plan upload มี security implications** — ต้อง implement 6-layer validation + TOCTOU mitigation
- 🟢 **MVP scope ที่ revised แล้วทำได้จริง** ถ้าทุก week มี discipline ไม่ scope creep

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
> **Exception:** Camera position fields และ floor_plans table ที่จะเพิ่มใน V2 — ดู Section 10

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
- Quick Add feature (Section 8) คือ first step ของ direction นี้
- Excel เก็บไว้เป็น "bulk import tool ครั้งแรก" เท่านั้น

#### [P3] Column Order Hidden Contract

**WHY:** "Column order ตรง schema" คือ optimization ที่ดี แต่สร้าง **hidden coupling** — ถ้าวันหนึ่งเพิ่ม column ตรงกลาง schema (เช่น `created_by` หรือ position_x ที่จะเพิ่มใหม่) Excel template ต้องแก้ตาม ถ้าลืม → paste ผิด column ทั้งหมด → data corruption เงียบๆ

**HOW:**
- ใส่ cell A1 ของแต่ละ sheet เป็น schema version (`SCHEMA_V2.1`)
- เขียน macro หรือ manual checklist ตรวจก่อน paste
- **สำคัญ:** หลังจาก ALTER TABLE เพิ่ม position_x/y → Excel template ต้องอัปเดต

### Impact on Phase 7
- Phase 7 Quick Add ใน MVP = web-based alternative to Excel (เริ่มจาก Camera type)
- หลัง MVP → ลด dependency บน Excel ทีละ table

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

**3. React layer — form validation (Phase 7 Quick Add):**
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
Validation rules ที่หายไป → ต้อง re-implement ใน React + C# ทั้งสองที่ ไม่ใช่ที่ใดที่หนึ่ง โดยเฉพาะใน Quick Add modal

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
- **Camera ที่มี/ไม่มี position_x/y** (จะเพิ่มหลัง schema change)

**HOW:** สร้าง `database/mock_data_edge_cases.sql` — Phase 7 จะได้ test UI กับข้อมูล "น่าเกลียด" ตั้งแต่แรก ไม่ใช่ตอน user เจอ

### Impact on Phase 7
- ต้องใช้ stress mock ก่อนตัดสินใจ pagination strategy
- ต้องใช้ edge case mock ทดสอบ alert color logic (จะรู้ตอนไหนว่า device offline แสดงสีถูก?)
- Mock data ต้องมี camera ที่ position_x/y = NULL (เพื่อทดสอบ "unplaced cameras" view)

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
               .AllowCredentials();
    });
});

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
[Fact]
public async Task GetSites_Returns200() {
    var response = await _client.GetAsync("/api/sites");
    Assert.Equal(HttpStatusCode.OK, response.StatusCode);
}
```

#### [P2] Connection String Management

**WHY:** Home laptop ใช้ Windows Auth, Work notebook ใช้ SQL Auth — ถ้า hardcode ใน `Web.config` ต้องแก้ทุกครั้งสลับเครื่อง → เสี่ยง **commit password เข้า git โดยไม่ตั้งใจ**

**HOW:**
- ใช้ User Secrets ของ .NET (`dotnet user-secrets set`)
- Add `appsettings.Development.json` ใน `.gitignore`

### Impact on Phase 7
Phase 6 มี blocker ใหญ่ที่สุด — ต้องแก้อย่างน้อย 4 เรื่องก่อนเขียน React บรรทัดแรก

---

# Part B — Phase 7 Frontend Review (REVISED)

## 8. Phase 7 — Frontend Plan (REVISED)

### Strengths
- Stack choices ส่วนใหญ่ถูกต้อง (React Flow, Recharts, Axios)
- RBAC matrix ครบและคิดละเอียด
- MVP scope ตกลงแล้ว
- Sitemap ครบ 12 หน้า
- Push back ต่อ V1 feedback ด้วยเหตุผลที่ดี — Ran มี product thinking

### Findings

#### [P1] Isometric — Defer with Renderer Pattern (REVISED from V1)

**Ran's reasoning (accepted):** "Visual site/building map makes UI more intuitive for non-technical staff (security team, building managers) who need to locate a camera physically, not just find it in a list. Also has extensibility for facility management use cases."

ผมเห็นด้วยกับ logic นี้ — แต่ implementation ใน MVP ต้องใช้ pattern ที่ allow swap renderer ในอนาคต

**HOW (Renderer Pattern):**

แยก data layer ออกจาก visualization layer ตั้งแต่ MVP:

```jsx
// SiteOverview.jsx (MVP — uses CardListRenderer)
function SiteOverview({ siteId }) {
    const { data: site } = useSite(siteId);
    return (
        <div>
            <SiteHeader site={site} />
            <BuildingRenderer 
                buildings={site.buildings}
                renderer="cards"  // MVP
                // renderer="isometric"  // Post-MVP swap
                onBuildingClick={navigateToBuilding}
            />
        </div>
    );
}

// BuildingRenderer.jsx — strategy pattern
function BuildingRenderer({ buildings, renderer, onBuildingClick }) {
    switch (renderer) {
        case "cards":
            return <BuildingCardList buildings={buildings} onClick={onBuildingClick} />;
        case "isometric":
            return <BuildingIsometricView buildings={buildings} onClick={onBuildingClick} />;
        default:
            return <BuildingCardList ... />;
    }
}
```

**Benefit:**
- Phase 7 ใช้ CardList — เร็ว, ไม่กิน design effort
- Phase 8 เพิ่ม IsometricView component ใหม่ — swap renderer prop ไม่ต้องแก้ data layer
- เก็บ component contract เดียวกัน

**Phase 8 implementation note:**
- Library choice: **Three.js** เป็น choice หลัก (สามารถทำ isometric จริงได้, มี community ใหญ่)
- หรือ **SVG + math** ถ้าไม่อยาก dependency หนัก
- หรือ **upload site map image** + วาง building marker (เหมือน Floor Plan layer) = pragmatic ที่สุด

#### [P0] RBAC Logic — Simplified to Viewer + Admin (AGREED)

**Decision (agreed in Round 2):**
- **Admin** — full access
- **Viewer** (rename จาก User + Guest รวม) — read-only ทุก layer ที่ไม่มี sensitive info

หลัง demo ค่อยแยก permission ละเอียดอีก

**HOW:**
```jsx
// Simple 2-role check
const { user } = useAuthStore();
const isAdmin = user?.role === 'admin';

{isAdmin && <EditButton />}
{isAdmin && <DeleteButton />}
```

#### [P1] Quick Add Feature — Renamed from "My Devices" (REVISED from V1)

**Ran's reasoning (accepted):** "Web app is also a device management interface. Technicians need a quick way to register new devices without navigating Site → Building → Floor → Room → Rack every time."

ผมเปลี่ยนใจจาก V1 ที่บอก "ตัด" → ตอนนี้บอก **"keep with clearer scope"**

**Renamed: My Devices → Quick Add**

**WHY rename:**
- "My Devices" สื่อว่า "device ที่เป็นของฉัน" — สับสนกับ ownership concept
- "Quick Add" สื่อตรง intent: shortcut tool สำหรับ register

**MVP Scope:**

```
┌─ Sidebar ────────────────┐
│ 🗺 Sites                 │
│   ├ Site A 🔴            │
│   └ Site B 🟢            │
│                          │
│ ⚡ Quick Add             │
│   ├ + Add Camera         │
│   └ 📋 My Recent (5)     │
└──────────────────────────┘
```

**Quick Add Camera Flow:**
1. Click "+ Add Camera" → Modal opens
2. กรอก: name, IP, MAC, S/N
3. Cascade dropdown: Site → Building → Floor → Room → Rack → NVR (auto-filter children)
4. (Optional) อัปโหลด/select floor plan + กดตำแหน่งบนแปลน → save position_x/y
5. Save → device โผล่ที่ "My Recent" + อยู่ใน hierarchy
6. Toast notification ยืนยัน

**My Recent:**
- เก็บ 5-10 devices ล่าสุดที่ user คนนี้ register
- Persist ใน localStorage (per-user, per-browser) — ไม่ต้อง backend table
- Click → navigate ไป device detail
- Auto-expire หลัง 24 ชั่วโมง

**Why not include NVR/Switch ใน MVP:**
- Camera คือ device type ที่เพิ่มบ่อยที่สุด (พบบ่อยที่สุดใน operation)
- NVR/Switch register น้อยกว่า → ใช้ admin panel แบบเดิม (หรือ Excel) ไปก่อน
- ลด complexity ของ form (NVR มี channel config, Switch มี port config)
- หลัง Camera flow stable → ขยายเพิ่ม

**คำเตือนเรื่อง schema:**
- Current real data มี NVR/Switch แล้ว แต่ยังไม่มี Camera → Quick Add Camera คือ entry point ที่เหมาะที่สุด

#### [P2] "Catch-all สำหรับ future device types" — แยกออกจาก Quick Add

**WHY:** ถ้า device types ใหม่ไม่เข้า hierarchy ปัจจุบัน → ปัญหารากเหง้าคือ **schema design** ไม่ใช่ UI ใส่ catch-all ใน Quick Add = ปกปิด schema gap → debt สะสม

**HOW:** เมื่อมี device type ใหม่ (future) → ตัดสินใจอย่างใดอย่างหนึ่ง:
- (a) ขยาย hierarchy ให้รับได้ (schema change)
- (b) สร้าง standalone "External Devices" section แยก (ไม่ใช่ใน Quick Add)

อย่าใช้ Quick Add เป็นห้องเก็บของรก

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

**HOW:**

**Recommended:** ใช้ flat routes (สั้น) + API endpoint สำหรับ breadcrumb:
```
GET /api/rooms/{id}/breadcrumb
  → คืน [{ type: "site", id: 1, name: "HQ" }, { type: "building", ... }, ...]
```

React ใช้ breadcrumb data render แถบบนได้ง่าย ไม่ผูก URL ยาว

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

**Plus Quick Add ทุก layer** (ตามที่ revised ใน Section 8)

ผมเห็นด้วย 100% กับ spec นี้ — เป็น **context-aware navigation** ที่ดี

**HOW (implementation guidance for React):**
```jsx
// useContext + route params
const sidebarItems = useSidebarItems();  // hook ที่ derive จาก current route

// /sites/:site_id  → useSidebarItems return buildings of site_id
// /sites/:site_id/buildings/:building_id  → return floors
```

**สำคัญ:** Sidebar ต้องมี **"กลับขึ้น 1 ระดับ" button** ด้วย — ไม่งั้น user ติดในระดับล่างสุดออกไปไหนไม่ได้นอกจากกด browser back

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

**HOW (MVP):** ใช้ 2D top-down + card list ตาม Renderer Pattern (Section 8):

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

**Phase 8:** เพิ่ม IsometricView component ใหม่, swap renderer prop ของ `<BuildingRenderer />`

### 9.4 Building Detail — Same Hollow Issue

เหมือนกับ Site Overview — MVP ใช้ floor list:

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

**Floor Plan (REVISED — drag-drop is core requirement):**

Ran ยืนยันชัดเจน: *"drag-drop is a core requirement, not a nice-to-have. Physical camera positions change (cameras get relocated, replaced, added). The floor plan layer must support: drag to reposition, add new camera, delete camera."*

ผมเห็นด้วย — drag-drop คือ core feature ของ Floor Plan layer

**MVP scope for Floor Plan (revised):**
- ✅ View mode — render camera icons จาก position_x/y
- ✅ Edit mode (Admin) — drag camera, save percentage
- ✅ Add camera — click empty area → spawn camera placeholder → fill data via modal
- ✅ Delete camera — context menu / select + delete key

**Floor plan upload:**
- ตาม decision ของ Ran: manual file copy + register path ผ่าน UI
- ดู Section 10 สำหรับ floor_plans table spec และ security validation

**Rack Detail:**
- u_subposition (sub 1-3 ใน 1 U) ยังไม่ implement ตามที่ WIREFRAME_STATUS ระบุ — Ran รู้แล้ว
- จริงๆ ก็พอ MVP — sub-position ใส่ทีหลังได้

---

## 10. Camera Position + Floor Plan Spec (REVISED)

### Part A — Rack Position (unchanged from V1)

#### Strengths
- Spec ละเอียดมาก, มี diagram ASCII art อธิบายชัด
- WHY ของ sub-position (airflow 14mm vs 44mm) = engineering reasoning ที่ดี
- Known Limitation section = honest documentation
- CHECK constraints ครบ

#### [P1] Hardcoded `BETWEEN 1 AND 3` คือ Time Bomb

**WHY:** เอกสารระบุชัดเจน:
- `racks.units_per_u` รับค่า 1-12
- แต่ CHECK constraint บน `u_subposition` hardcode `BETWEEN 1 AND 3`

ในวันที่มี rack ที่ใช้ `units_per_u = 6` (อนาคต) → save ไม่ได้ → silent failure ที่ผู้ใช้งงมาก

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

#### [P3] Index Naming Inconsistency

**WHY:** `IX_nvrs_rack_slot` vs `IX_sw_rack_slot` — table หนึ่งใช้ full name (nvrs) อีก table ย่อ (sw)

ไม่ใช่ปัญหาใหญ่ แต่ inconsistent — ควร normalize เป็น `IX_poe_switches_rack_slot`

---

### Part B — Camera Position Spec (NEW IN V2)

**Context:** Ran ยืนยันชัดเจนว่า drag-drop คือ core requirement และ field ยังไม่มีใน schema ปัจจุบัน ผมตัดสินใจร่วมกัน:
- ใช้ percentage (0.0–1.0) ไม่ใช่ pixel
- แยก floor_plans เป็น table ของตัวเอง (ไม่อยู่ใน cameras)

#### Pixel vs Percentage — Trade-off (ตอบคำถาม Ran)

| Aspect | Pixel (absolute) | Percentage (0.0–1.0) |
|---|---|---|
| Resize floor plan image | ❌ Position พัง | ✅ Position คงที่ |
| Replace floor plan ใหม่ resolution | ❌ ต้อง re-position ทุก device | ✅ ใช้ได้เลย |
| Render บนหน้าจอขนาดต่าง | ❌ Position ผิดที่ถ้า zoom/fit | ✅ Adapt อัตโนมัติ |
| Math precision | ✅ Integer | ⚠️ Float (DECIMAL(10,4) เพียงพอ) |
| Human readability ใน DB | ✅ "x=450, y=320" | ⚠️ "x=0.6234, y=0.4156" |
| Drag-drop computation | ✅ Direct | ✅ แค่หาร offset/dimension |

**Verdict: Percentage ชนะขาด**

**Key reason:** Floor plan image ในระบบจริงจะถูก replace บ่อย:
- Architect ส่งแปลนใหม่ (resolution ต่าง)
- เปลี่ยน image จาก JPG เป็น SVG
- Crop หรือ rotate plan
- Plan ของชั้นเดียวกันแต่ scan ใหม่ resolution สูงขึ้น

ถ้าใช้ pixel → ทุกครั้งเปลี่ยนแปลน = re-position 50 cameras ด้วยมือ = **operational nightmare**

#### Recommended Schema Changes

**Step 1 — Camera position fields:**

```sql
-- Position บน floor plan (percentage 0.0–1.0, top-left origin)
ALTER TABLE cameras ADD position_x DECIMAL(10,4) NULL;
ALTER TABLE cameras ADD position_y DECIMAL(10,4) NULL;

-- Audit trail
ALTER TABLE cameras ADD position_set_at DATETIME NULL;
ALTER TABLE cameras ADD position_set_by INT NULL;  -- FK to users.id (when users table exists)

-- CHECK constraints
ALTER TABLE cameras ADD CONSTRAINT CHK_cameras_pos_x 
    CHECK (position_x IS NULL OR (position_x >= 0 AND position_x <= 1));
ALTER TABLE cameras ADD CONSTRAINT CHK_cameras_pos_y 
    CHECK (position_y IS NULL OR (position_y >= 0 AND position_y <= 1));
```

**Step 2 — Separate floor_plans table (สำคัญ — Ran's V1 idea ผมขอ adjust):**

**WHY แยก table:** Floor plan version เป็น attribute ของ **floor** ไม่ใช่ของ camera — แต่ละชั้นมี image ของตัวเอง อาจมีหลาย versions

```sql
CREATE TABLE floor_plans (
    floor_plan_id  INT IDENTITY PRIMARY KEY,
    floor_id       INT NOT NULL FOREIGN KEY REFERENCES floors(floor_id),
    image_path     NVARCHAR(500) NOT NULL,  
        -- e.g. "/uploads/floor_plans/site-1/building-2/floor-3/v1.png"
    image_width    INT NULL,    -- pixels ของ original image
    image_height   INT NULL,
    file_size_bytes BIGINT NULL,
    version        INT NOT NULL DEFAULT 1,
    uploaded_at    DATETIME NOT NULL DEFAULT GETDATE(),
    uploaded_by    INT NULL,
    is_active      BIT NOT NULL DEFAULT 1,
    notes          NVARCHAR(MAX) NULL,
    
    INDEX IX_floor_plans_floor_active (floor_id, is_active)
);

-- Constraint: 1 floor มีได้ 1 active plan เท่านั้น
CREATE UNIQUE INDEX UX_floor_plans_one_active
    ON floor_plans (floor_id)
    WHERE is_active = 1;
```

**Benefit ของ separate table:**
- Floor plan replace ได้โดยไม่กระทบ camera position (ใช้ percentage)
- เก็บ history ของ plan ทุก version (audit + rollback ได้)
- 1 floor มีหลาย plan versions = ดูย้อนหลังได้
- camera ผูก floor (เดิม) → ไม่ต้องผูก floor_plan_id โดยตรง

#### Coordinate System Convention (ต้อง document ให้ชัด)

```
Origin (0,0) = top-left corner ของ plan image
(1,1)        = bottom-right corner
X axis: 0 → 1 จากซ้ายไปขวา
Y axis: 0 → 1 จากบนลงล่าง (screen coordinate, ไม่ใช่ math coordinate)
```

**WHY top-left:** SVG, Canvas, CSS, Konva.js ทั้งหมดใช้ top-left origin → ตรงกัน ไม่ต้อง transform

#### React Implementation Preview

```jsx
// floor plan image: 1200x800 px (original)
// container on screen: 800x533 px (responsive)

function CameraIcon({ camera, planWidth, planHeight }) {
    const pixelX = camera.position_x * planWidth;   // 0.6234 * 800 = 498.7
    const pixelY = camera.position_y * planHeight;  // 0.4156 * 533 = 221.5
    
    return <Icon style={{ 
        left: pixelX, 
        top: pixelY, 
        position: 'absolute' 
    }} />;
}

// Drag end → save as percentage
function onDragEnd(camera, newPixelX, newPixelY) {
    const newPosX = newPixelX / planWidth;
    const newPosY = newPixelY / planHeight;
    
    saveCameraPosition(camera.id, {
        position_x: parseFloat(newPosX.toFixed(4)),
        position_y: parseFloat(newPosY.toFixed(4))
    });
}
```

---

### Part C — Floor Plan Upload Security Spec (NEW IN V2 — Round 3 update)

**Context (Round 3 decisions):**
- **Single IT admin model** — only one designated IT admin has server access for file copy
- **Path validation required** — API must verify file exists before saving path to DB

#### Operational Model

**Single IT Admin Decision:**

In this organization, only one IT admin has server-level access. Floor plan files will be managed by that person only — not by all admin users.

**Implications:**
- ✅ ไม่ต้องทำ file locking / version conflict resolution
- ✅ ไม่ต้องมี "who uploaded" confirmation flow
- ⚠️ **ต้อง document ให้ชัด** ใน `docs/workflow/FLOOR_PLAN_UPLOAD.md`
- ⚠️ **Single point of failure** — ถ้า IT admin ลาออก/ไม่อยู่ → ไม่มีใคร upload ได้

**Mitigation for SPOF (post-MVP):** Designate backup admin + document credential transfer procedure

#### 6-Layer Path Validation (Security Boundary)

**WHY validation matters:**

ถึงแม้ floor plan upload จะอยู่ใน intranet และจำกัดให้เฉพาะ IT admin แต่ **path validation ยังจำเป็น** เพราะ:
1. IT admin อาจพิมพ์ path ผิดโดยไม่ตั้งใจ
2. ป้องกัน attacker ที่ steal admin credentials
3. ป้องกัน insider threat (admin ใส่ path ผิดเพื่อ disrupt service)
4. **OWASP best practice** — defense in depth ทุก input ที่มาจาก user

**HOW (validate-path endpoint):**

```csharp
[HttpPost("floor-plans/validate-path")]
[Authorize(Roles = "Admin")]
public ApiResponse<FloorPlanValidationDto> ValidatePath([FromBody] ValidatePathRequest req)
{
    // === Layer 1: Path traversal protection ===
    // กัน admin (หรือ attacker) ใส่ path เช่น "../../etc/passwd"
    if (req.Path.Contains("..") || req.Path.Contains("~"))
        return Error("PATH_TRAVERSAL_DETECTED", 
                     "Path must not contain '..' or '~'");
    
    if (!req.Path.StartsWith("/uploads/floor_plans/"))
        return Error("INVALID_PATH_PREFIX", 
                     "Path must be under /uploads/floor_plans/");
    
    // === Layer 2: Resolve to absolute path safely ===
    var webRoot = _env.WebRootPath;
    var fullPath = Path.GetFullPath(Path.Combine(webRoot, req.Path.TrimStart('/')));
    
    // ตรวจซ้ำ: absolute path ต้องยังอยู่ใน /uploads/ จริง (กัน symlink attack)
    var uploadsRoot = Path.GetFullPath(Path.Combine(webRoot, "uploads/floor_plans/"));
    if (!fullPath.StartsWith(uploadsRoot))
        return Error("PATH_OUTSIDE_UPLOADS", 
                     "Resolved path escaped uploads directory");
    
    // === Layer 3: File existence ===
    if (!System.IO.File.Exists(fullPath))
        return Error("FILE_NOT_FOUND", 
                     $"File does not exist at: {req.Path}");
    
    // === Layer 4: Extension whitelist ===
    var ext = Path.GetExtension(fullPath).ToLowerInvariant();
    var allowed = new[] { ".png", ".jpg", ".jpeg", ".svg", ".webp" };
    if (!allowed.Contains(ext))
        return Error("INVALID_FILE_TYPE", 
                     $"File extension '{ext}' not allowed. Use: {string.Join(", ", allowed)}");
    
    // === Layer 5: File size sanity ===
    var fileInfo = new FileInfo(fullPath);
    if (fileInfo.Length == 0)
        return Error("EMPTY_FILE", "File is empty (0 bytes)");
    if (fileInfo.Length > 50 * 1024 * 1024)  // 50 MB max
        return Error("FILE_TOO_LARGE", "File exceeds 50 MB limit");
    
    // === Layer 6: Verify it's actually an image ===
    try {
        using var img = System.Drawing.Image.FromFile(fullPath);
        return Ok(new FloorPlanValidationDto {
            IsValid = true,
            Path = req.Path,
            ImageWidth = img.Width,
            ImageHeight = img.Height,
            FileSizeBytes = fileInfo.Length,
            LastModified = fileInfo.LastWriteTime
        });
    } catch (Exception ex) {
        return Error("CORRUPT_IMAGE", 
                     $"File is not a valid image: {ex.Message}");
    }
}
```

#### Why Each Layer Matters

| Layer | กันอะไร | WHY |
|---|---|---|
| **1. Path traversal** | `../../etc/passwd`, `~/.ssh/id_rsa` | OWASP Top 10 — Path Traversal คือ attack ที่ classic ที่สุด |
| **2. Resolve check** | Symlink attack, normalized path escape | บางครั้ง string ดูปกติแต่ resolved แล้วหลุดออก root |
| **3. File existence** | DB เก็บ path ที่ใช้ไม่ได้ | UI จะแสดง broken image — ผู้ใช้งง |
| **4. Extension whitelist** | Admin (โดยไม่ตั้งใจ) register .exe หรือ .html | กัน XSS ผ่าน SVG ที่มี script tag (ถ้า paranoid ตัด SVG ออกได้) |
| **5. Size sanity** | Empty file, file ที่ใหญ่เกินไป | UI freeze ตอน load รูป 500MB |
| **6. Image verification** | File ที่ rename extension แต่ไม่ใช่รูปจริง | คนเปลี่ยน `.txt` → `.png` แล้วระบบรับ |

#### TOCTOU Mitigation in Save Workflow

**WHY:** TOCTOU = Time-of-Check vs Time-of-Use

แม้ UI จะเรียก validate-path ก่อนแล้ว แต่ between calls อาจมีคนลบไฟล์ออก หรือ attacker เรียก endpoint โดยไม่ผ่าน UI ดังนั้น **save endpoint ต้อง re-validate** ด้วยตัวเอง — อย่าเชื่อ client

**HOW:**

```csharp
[HttpPost("floor-plans")]
[Authorize(Roles = "Admin")]
public async Task<ApiResponse<FloorPlan>> Register([FromBody] RegisterFloorPlanRequest req)
{
    // === Step 1: Re-validate path (don't trust client) ===
    var validation = await ValidatePath(new ValidatePathRequest { Path = req.Path });
    if (!validation.Success)
        return Error(validation.Error.Code, validation.Error.Message);
    
    // === Step 2: Check floor exists ===
    var floor = await _floorService.GetById(req.FloorId);
    if (floor == null)
        return Error("FLOOR_NOT_FOUND", "Floor does not exist");
    
    // === Step 3: Deactivate previous active plan (if any) ===
    await _floorPlanService.DeactivateActivePlanForFloor(req.FloorId);
    
    // === Step 4: Determine next version number ===
    var nextVersion = await _floorPlanService.GetNextVersionNumber(req.FloorId);
    
    // === Step 5: Insert new plan as active ===
    var newPlan = new FloorPlan {
        FloorId = req.FloorId,
        ImagePath = req.Path,
        ImageWidth = validation.Data.ImageWidth,
        ImageHeight = validation.Data.ImageHeight,
        FileSizeBytes = validation.Data.FileSizeBytes,
        Version = nextVersion,
        UploadedAt = DateTime.UtcNow,
        UploadedBy = _currentUser.Id,
        IsActive = true,
        Notes = req.Notes
    };
    
    await _floorPlanService.Insert(newPlan);
    return Ok(newPlan);
}
```

#### Folder Structure Convention

```
/uploads/
  floor_plans/
    site-{site_id}/
      building-{building_id}/
        floor-{floor_id}/
          v1.png
          v2.png
          ...
```

**Example:**
```
/uploads/floor_plans/site-1/building-2/floor-3/v1.png
/uploads/floor_plans/site-1/building-2/floor-3/v2.png  ← replacement
```

#### Storage Decision (Ran's choice)

**File system ของ server** — เก็บภายใต้ `/uploads/floor_plans/`
- เหมาะกับ intranet — simple, ไม่ต้อง cloud
- Backup: include `/uploads/` ใน daily backup ของ server
- Permission: web service มี **read access** เท่านั้น (ไม่ให้ web user delete file)
- IT admin มี write access ผ่าน FTP/SMB

#### Documentation Required: FLOOR_PLAN_UPLOAD.md

ต้องมี `docs/workflow/FLOOR_PLAN_UPLOAD.md` อธิบาย procedure สำหรับ IT admin:

```markdown
# Floor Plan Upload Procedure

## Designated IT Admin
- Primary: [ชื่อ IT admin]
- Backup: TBD (post-MVP — ต้องมีคนสำรองด้วย)

## File Preparation
- Supported formats: PNG, JPG, JPEG, SVG, WebP
- Max size: 50 MB
- Recommended: PNG ที่ optimized (ใช้ TinyPNG หรือ Squoosh)
- Resolution แนะนำ: 2000-4000 px ด้าน longest (พอสำหรับ zoom)

## File Path Convention
/uploads/floor_plans/site-{site_id}/building-{building_id}/floor-{floor_id}/v{N}.{ext}

ตัวอย่าง:
/uploads/floor_plans/site-1/building-2/floor-3/v1.png
/uploads/floor_plans/site-1/building-2/floor-3/v2.png  ← replacement

## Upload Steps
1. Connect to server via FTP/SMB (credential: ถาม IT lead)
2. Navigate to /uploads/floor_plans/
3. Create directory structure if not exists
4. Copy image file
5. Open SSM web app → Login as Admin
6. Navigate to Floor Plan Management page
7. Click "Register Floor Plan"
8. Select floor from dropdown
9. Enter path: /uploads/floor_plans/site-1/building-2/floor-3/v1.png
10. Click "Validate" → wait for confirmation
11. Preview image displayed → click "Register"

## Versioning Behavior
- Registering new plan automatically deactivates previous plan
- Old plans NOT deleted — kept for audit/rollback
- Camera positions persist across plan versions (percentage-based)

## Error Reference Table

| Error Code | Meaning | Fix |
|---|---|---|
| PATH_TRAVERSAL_DETECTED | Path มี ".." หรือ "~" | Use absolute clean path |
| INVALID_PATH_PREFIX | Path ไม่ขึ้นต้น /uploads/floor_plans/ | Must use this prefix |
| PATH_OUTSIDE_UPLOADS | Resolved path escaped uploads dir | Check for symlinks |
| FILE_NOT_FOUND | ไฟล์ไม่มีอยู่ตรง path ที่ระบุ | Verify file was copied to server |
| INVALID_FILE_TYPE | Extension ไม่ใช่ภาพที่รองรับ | Use .png/.jpg/.jpeg/.svg/.webp |
| EMPTY_FILE | ไฟล์ 0 bytes | Re-copy file from source |
| FILE_TOO_LARGE | เกิน 50 MB | Compress or resize image |
| CORRUPT_IMAGE | ไฟล์ไม่ใช่ image จริง | File is corrupted, regenerate |
```

#### Apply ที่อื่นด้วย — Consistency

**Logic เดียวกันใช้กับ:**
- Outdoor cameras บน Site Overview (ผูก site, ไม่ใช่ floor)
- Outdoor cameras บน Building exterior (ผูก building)
- ถ้าวันหนึ่งทำ rack visual position สำหรับ device → ใช้ percentage เหมือนกัน

**Future consideration:** ถ้ามี device type อื่นที่ต้องการ visual position → สร้าง generic `device_positions` table หรือ extend pattern เดียวกับ camera

### Impact on Phase 7
- Rack UI implementation พึ่งพา RACK_POSITION spec → MVP ใช้ U-level only
- Floor Plan UI พึ่งพา cameras.position_x/y + floor_plans table → ต้อง add schema **ก่อน** เขียน Floor Plan layer
- **Floor plan upload page ต้อง implement 6-layer validation + TOCTOU mitigation** → จัดเป็น security boundary
- Single IT admin model → simplify error handling, แต่ต้อง document SPOF mitigation post-MVP

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

**Filter endpoints ก็ทำเก็บไว้** สำหรับกรณี dynamic load (เช่น sidebar dropdown, Quick Add cascade) แต่ **อย่าใช้สำหรับ initial tree render**

#### [P1] Naming Convention — `Get` Prefix ซ้ำซ้อน

**WHY:** REST convention คือ HTTP method (GET) บอก action อยู่แล้ว — ไม่ต้องใส่ `Get` ใน URL

```
❌ GET /api/Getbuildings
❌ GET /api/Getcameras
✅ GET /api/buildings
✅ GET /api/cameras
```

**HOW:** Rename ก่อน Phase 7 (15 นาที):
```
GET /api/Getbuildings → GET /api/buildings
GET /api/buildings?siteId=1
GET /api/buildings/{id}
```

**Case sensitivity:** ใช้ lowercase ทั้งหมด — `buildings` ไม่ใช่ `Buildings`

#### [P1] Inconsistent Casing — `GetpoeSwitches`

**WHY:** Mixed camelCase + lowercase ใน endpoint name = บ่งบอกว่ายังไม่มี style guide

ถ้าใช้ kebab-case (industry standard for URLs):
```
✅ GET /api/poe-switches
✅ GET /api/poe-switches/{id}
✅ GET /api/poe-switches?rackId=1
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

#### [P2] ไม่มี Filter / Sort Standard

**HOW:**
```
GET /api/cameras?status=offline
GET /api/cameras?status=offline&sort=name&order=asc
GET /api/cameras?buildingId=1&status=offline
```

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

#### [P1] Floor Plan Endpoints (Updated with Round 3 security spec)

ต้องมี endpoint จัดการ floor_plans table — **ทุก endpoint ต้อง [Authorize(Roles = "Admin")]**:

```
GET    /api/floor-plans?floorId=X              → list plans ของ floor (รวม inactive)
GET    /api/floor-plans/{id}                    → get specific plan
GET    /api/floors/{id}/active-plan             → get active plan ของ floor (public ไม่ต้อง admin)
POST   /api/floor-plans/validate-path           → 6-layer validation (admin only)
POST   /api/floor-plans                         → register new plan + TOCTOU re-validate (admin only)
PUT    /api/floor-plans/{id}/activate           → switch active plan version (admin only)
DELETE /api/floor-plans/{id}                    → soft delete (set is_active=0, admin only)
```

**Implementation reference:** ดู Section 10 Part C สำหรับ full validation logic + TOCTOU pattern

#### [P1] Camera Position Endpoint

แยก endpoint สำหรับ update position โดยเฉพาะ (กัน update ทับ field อื่น):

```
PATCH /api/cameras/{id}/position
Body: { position_x: 0.6234, position_y: 0.4156 }
```

**Why PATCH ไม่ใช่ PUT:**
- PUT = replace ทั้ง resource (ต้องส่งทุก field)
- PATCH = update เฉพาะ field ที่ส่ง (เหมาะกับ drag-drop ที่อัปเดตแค่ position)

**Server-side validation:**
```csharp
[HttpPatch("cameras/{id}/position")]
[Authorize(Roles = "Admin")]
public async Task<ApiResponse<Camera>> UpdatePosition(int id, [FromBody] PositionUpdate req)
{
    // Validate range (defense in depth — DB CHECK already exists)
    if (req.PositionX < 0 || req.PositionX > 1)
        return Error("INVALID_POSITION_X", "position_x must be between 0 and 1");
    if (req.PositionY < 0 || req.PositionY > 1)
        return Error("INVALID_POSITION_Y", "position_y must be between 0 and 1");
    
    var camera = await _cameraService.GetById(id);
    if (camera == null) return Error("NOT_FOUND", "Camera not found");
    
    camera.PositionX = req.PositionX;
    camera.PositionY = req.PositionY;
    camera.PositionSetAt = DateTime.UtcNow;
    camera.PositionSetBy = _currentUser.Id;
    
    await _cameraService.Update(camera);
    return Ok(camera);
}
```

### สรุป Backend Changes ที่ต้องทำก่อน Phase 7

| Priority | Change | Effort |
|---|---|---|
| P0 | Auth endpoints (login/logout/me) | 1-2 วัน |
| P0 | CORS config | 1 ชม. |
| P0 | Aggregate endpoints (tree, dashboard, breadcrumb) | 1 วัน |
| P0 | Status endpoint สำหรับ polling | 4 ชม. |
| P0 | Schema: add camera position + floor_plans table | 4 ชม. |
| P0 | **Floor plan endpoints with 6-layer validation + TOCTOU** | 1.5 วัน |
| P0 | Camera position PATCH endpoint | 2 ชม. |
| P1 | Rename endpoints (drop `Get` prefix) | 30 นาที |
| P1 | Standardize casing (kebab-case URLs) | 15 นาที |
| P1 | Swagger setup | 30 นาที |
| P1 | Standard error response wrapper | 4 ชม. |
| P2 | Pagination | 4 ชม. |
| P2 | Filter/sort standard | 4 ชม. |

**Total estimate: ~8-10 วันทำงาน ก่อนแตะ React** (เพิ่มจาก V1 = 5-7 วัน, V2 round 2 = 7-9 วัน)

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
        <Route path="/admin/floor-plans" element={<FloorPlanManagement />} />
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

### Q3: Isometric View Library? (REVISED)

**MVP Recommendation:** ใช้ 2D top-down + card list ผ่าน Renderer Pattern

**Phase 8 Recommendation:** Three.js หรือ image-based positioning (upload site map → วาง building markers)

ตามที่ revise ใน Section 8 — Ran agree ที่จะ defer isometric ไว้ post-MVP

---

## 13. Final MVP Roadmap (REVISED)

### Updated MVP Scope (ตัดให้เหลือทำได้จริง 6 สัปดาห์)

#### Week 0 (ก่อนเขียน React) — Backend Prep (REVISED)
- [ ] CORS config
- [ ] JWT Auth + Login endpoint
- [ ] Rename endpoints (drop `Get` prefix, kebab-case)
- [ ] Swagger setup
- [ ] Standard error response wrapper
- [ ] Aggregate endpoint: `GET /api/hierarchy/tree`
- [ ] Status endpoint: `GET /api/status/devices`
- [ ] Breadcrumb endpoint: `GET /api/{type}/{id}/breadcrumb`
- [ ] Schema change — camera position + floor_plans table
- [ ] **Floor plan endpoints with 6-layer validation + TOCTOU**
- [ ] Camera position PATCH endpoint
- [ ] Stress mock data (1000+ rows)
- [ ] Write `docs/workflow/FLOOR_PLAN_UPLOAD.md`

**Estimate: 8-10 วัน** (เพิ่มจาก V1 = 5-7 วัน, V2 round 2 = 7-9 วัน)

#### Week 1 — React Setup + Auth
- [ ] Vite + React + TypeScript project
- [ ] Tailwind CSS setup
- [ ] React Router setup
- [ ] Zustand + React Query
- [ ] Axios instance + interceptor (auto-attach JWT)
- [ ] Login page + auth flow
- [ ] ProtectedLayout + AdminOnlyLayout components
- [ ] Generate TypeScript types from Swagger

#### Week 2 — Layout + Topology + Site List
- [ ] Sidebar component (dynamic, context-aware)
- [ ] Breadcrumb component
- [ ] Topology page (React Flow)
- [ ] Site list page (cards/grid)

#### Week 3 — Site Overview + Building Detail + Renderer Pattern
- [ ] Site Overview (CardListRenderer)
- [ ] Building Detail (floor list)
- [ ] Alert propagation logic
- [ ] **Renderer Pattern infrastructure** — `<BuildingRenderer renderer="cards" />` (เตรียม swap isometric ใน Phase 8)

#### Week 4 — Floor Plan + Rack + Quick Add (Camera) + Floor Plan Management
- [ ] Floor Plan page (Konva.js)
  - ✅ View mode
  - ✅ Edit mode (drag camera)
  - ✅ Add/Delete camera
  - ✅ position_x/y save as percentage
- [ ] **Floor Plan Management page** (admin only)
  - ✅ List existing plans per floor
  - ✅ Register new plan via path validation
  - ✅ Activate/deactivate versions
- [ ] Room View (rack list)
- [ ] Rack Detail (vertical U-position diagram, U-level only)
- [ ] Quick Add Camera modal + My Recent (localStorage)

#### Week 5 — Device Detail + Realtime
- [ ] Camera Detail (info + Recharts ping graph — refresh-on-load)
- [ ] NVR Detail
- [ ] Switch Detail
- [ ] Polling integration (30s status refresh)
- [ ] Alert popup (when status changes)

#### Week 6 — Polish + Deploy + Buffer
- [ ] Dark mode toggle
- [ ] Error states / loading states ทุกหน้า
- [ ] Build + deploy to internal server
- [ ] Buffer for bugs + supervisor feedback

### ตัดออกจาก MVP (ไป Phase 7.5 หรือ Phase 8)
- ⏸ Isometric 3D rendering (ทุกหน้า) — Phase 8 ใช้ Renderer Pattern swap
- ⏸ Quick Add NVR, Switch — Phase 7.5 (หลัง Camera flow stable)
- ⏸ CRUD forms ทั้ง 13 tables (full admin panel)
- ❌ User Management UI
- ❌ Audit log
- ❌ Discord alert integration (server-side OK, UI ไม่ทำ)
- ❌ Guest role (รวมกับ User เป็น "Viewer")
- ❌ Sub U-position rendering ใน Rack
- ❌ SignalR realtime (ใช้ polling พอ)
- ❌ Backup IT admin workflow (post-MVP — designate + document credentials transfer)

---

## 14. Critical Action Items Before Coding (REVISED)

### ต้องทำเลย (สัปดาห์นี้)

| # | Task | Priority | Effort |
|---|---|---|---|
| 1 | ALTER TABLE cameras add position_x, position_y, position_set_at, position_set_by | P0 | 30 นาที |
| 2 | CREATE TABLE floor_plans + constraints + indexes | P0 | 1 ชม. |
| 3 | Create `/uploads/floor_plans/` directory structure + permissions | P0 | 30 นาที |
| 4 | Update mock_data.sql to include sample positions + 1 floor_plan row | P0 | 1 ชม. |
| 5 | Update Excel template + SCHEMA version cell | P0 | 1 ชม. |
| 6 | เพิ่ม CORS ใน C# API | P0 | 1 ชม. |
| 7 | เพิ่ม Auth endpoints + JWT | P0 | 1-2 วัน |
| 8 | สร้าง aggregate endpoints (tree, status, breadcrumb) | P0 | 1 วัน |
| 9 | **Implement floor plan endpoints (6-layer validation + TOCTOU)** | P0 | 1.5 วัน |
| 10 | Camera position PATCH endpoint | P0 | 2 ชม. |
| 11 | **Write `docs/workflow/FLOOR_PLAN_UPLOAD.md`** | P0 | 1 ชม. |
| 12 | Setup Swagger | P1 | 30 นาที |
| 13 | Rename endpoints, ลบ `Get` prefix | P1 | 30 นาที |
| 14 | Generate stress mock data | P1 | 2 ชม. |
| 15 | Document deprecation ใน ssm_import.py | P2 | 15 นาที |

### Decisions Confirmed (Round 1, 2, 3)

| # | Decision | Status |
|---|---|---|
| 1 | Isometric rendering | **Defer to Phase 8, MVP ใช้ CardListRenderer** |
| 2 | "My Devices" sidebar | **Rename เป็น "Quick Add", MVP มี Add Camera + My Recent** |
| 3 | Guest role | **รวมเป็น Viewer ใน MVP** |
| 4 | Floor Plan Edit mode | **Include ใน MVP (drag-drop + add/delete)** |
| 5 | Building Detail isometric | **Floor list แทนใน MVP** |
| 6 | Camera position storage | **Percentage (0.0-1.0), top-left origin** |
| 7 | Floor plan storage | **File system /uploads/floor_plans/** |
| 8 | Floor plan upload method | **Manual FTP copy + register path via UI** |
| 9 | Quick Add scope | **Camera only ใน MVP, NVR/Switch ใน Phase 7.5** |
| 10 | **Floor plan admin model** | **Single IT admin (Round 3)** |
| 11 | **Path validation** | **6-layer validation + TOCTOU re-check (Round 3)** |

### Documentation ที่ต้องเขียน

| # | Document | Reason |
|---|---|---|
| 1 | `docs/architecture/DECISIONS.md` | บันทึก architectural decisions + rationale |
| 2 | `docs/workflow/VALIDATION_RULES.md` | Capture business rules ที่ Python เคยมี |
| 3 | `database/PORTABILITY_NOTES.md` | SQL Server-specific features |
| 4 | `api/AUTH.md` | Auth flow + token format |
| 5 | `database/FLOOR_PLAN_SPEC.md` | Camera position + floor_plans table spec |
| 6 | **`docs/workflow/FLOOR_PLAN_UPLOAD.md`** | Manual file copy procedure for IT admin (Round 3) |
| 7 | **`docs/security/PATH_VALIDATION.md`** | 6-layer validation reference (Round 3) |

---

## Final Reviewer Notes

### สิ่งที่ Ran ทำได้ดีกว่าคนทั่วไปที่ฝึกงาน

1. **Documentation discipline** — `MEGA_CONTEXT.md`, `PHASE_LOG.md`, `RACK_POSITION.md`, `FRONTEND_PLAN.md`, `WIREFRAME_STATUS.md` — คุณภาพระดับ professional
2. **Engineering thinking** — แก้ schema, retire script, ทำ Bruno collection — ทุกอย่างมีเหตุผล
3. **Security awareness** — sanitizer + กังวลเรื่อง intranet + เห็นด้วยกับ path validation ทันที — ระดับ senior แล้ว
4. **Product thinking** — push back ต่อ V1 feedback ด้วยเหตุผลที่ดี (isometric, My Devices) — ระดับ product engineer
5. **เรียนรู้เร็ว** — จาก Python → SQL → C# → React = stack กว้าง
6. **ถามคำถามที่ถูก** — "pixel vs percentage", "who copies the file" คือคำถามที่ senior engineer ถาม

### สิ่งที่อยากให้ Ran เก็บไว้คิด

1. **MVP คือ "เล็กแต่ครบ" ไม่ใช่ "ลดคุณภาพ"** — demo 1 หน้าที่ทำงานได้สมบูรณ์ ดีกว่า 10 หน้าที่พัง
2. **Scope creep คือศัตรู** — ทุก feature ที่เพิ่ม = เวลาที่หายไปจาก core features
3. **Polish 80% เก็บ 20%** — Pareto principle ใช้ได้กับโปรเจกต์ฝึกงาน
4. **Document decisions เพิ่ม** — ทุก "ทำไมเลือกอันนี้" เขียนไว้ — ตัวคุณเองตอน 3 เดือนข้างหน้าจะขอบคุณตัวเองตอนนี้
5. **Renderer Pattern คือ insurance policy** — ใช้กับ Building/Site Overview ก่อน Phase 8 ยังไม่ต้อง refactor
6. **Security validation = defense in depth** — แม้ใน intranet กับ single admin ก็ยังต้องมีทุก layer

### Realistic Assessment สำหรับ Demo กรกฎาคม

**สิ่งที่ทำได้ทันด้วย MVP scope (revised):**
- ✅ Login + Auth
- ✅ Topology (React Flow) + Sites list
- ✅ Site → Building → Floor navigation (card list, defer isometric)
- ✅ Floor Plan **with drag-drop edit** (Konva.js + percentage coordinates)
- ✅ Floor Plan Management (admin can register/version plans)
- ✅ Quick Add Camera (เริ่มจาก camera type)
- ✅ Device detail page + ping graph (refresh-on-load)
- ✅ Status polling 30 วินาที
- ✅ Basic RBAC (admin vs viewer)

**Demo message:** "ระบบ end-to-end ครบ loop จาก DB → API → UI พร้อม auth + RBAC, device monitoring realtime, drag-drop floor plan management with security validation, และ Quick Add workflow สำหรับ technician"

**ห้ามพูด:** "MVP เท่านั้น เดี๋ยวจะทำอีกเยอะ" — ให้พูดว่า "Phase 7 เสร็จเรียบร้อย Phase 8 จะเพิ่ม isometric visualization + full CRUD admin panel"

### คำเตือนสำคัญ — Realistic Timeline

**Week 0 ใน V2 round 3 = 8-10 วันแทน 5-7 วัน** เพราะเพิ่ม:
- Schema change (camera position + floor_plans table)
- Floor plan endpoints **with 6-layer validation + TOCTOU**
- Camera position PATCH endpoint
- Floor plan upload procedure documentation

แปลว่า:
- ถ้า Ran มีเวลาทำงาน 8 ชั่วโมง/วัน เต็ม → ทันได้ (~10 วัน = 2 สัปดาห์)
- ถ้ามีอย่างอื่นแทรก (เรียน, ฝึกงานอื่น) → อาจกินเวลา 2.5-3 สัปดาห์
- จาก 6 สัปดาห์ deadline → เหลือ React 3-3.5 สัปดาห์เท่านั้น

**คำแนะนำ:** ถ้า Week 0 ลากเกิน 2.5 สัปดาห์ → ต้องตัด scope MVP เพิ่ม:
- Priority cut #1: Quick Add → Phase 7.5 (Excel ยังใช้งานได้)
- Priority cut #2: Floor Plan Edit mode → View only ใน MVP, edit ใน Phase 7.5
- ห้ามตัด: Auth, Polling, Floor Plan view, Device detail

---

## Sign-off

| Section | Status |
|---|---|
| Phase 1-6 Retrospective | ✅ Reviewed |
| Phase 7 Plan (Revised) | ✅ Reviewed |
| Wireframes | ✅ Reviewed |
| RACK_POSITION.md | ✅ Reviewed |
| Camera Position Spec | ✅ Specified |
| **Floor Plan Upload Security Spec** | ✅ Specified (Round 3) |
| Backend Changes | ✅ Reviewed (expanded twice) |
| Open Decisions | ✅ Answered |
| MVP Roadmap | ✅ Revised |
| Ran's Round 1 feedback | ✅ Incorporated |
| Ran's Round 2 feedback | ✅ Incorporated |
| Ran's Round 3 feedback | ✅ Incorporated |

**Total findings:**
- P0: 12 (V1 = 8, V2 round 2 = 11, V2 round 3 = 12)
- P1: 14
- P2: 11
- P3: 2

**Next steps:**
1. Ran รัน schema change scripts (camera position + floor_plans table)
2. Ran setup `/uploads/floor_plans/` directory + permissions on server
3. ผมพร้อมช่วยลงรายละเอียดเฉพาะส่วนที่ Ran เลือก:
   - Backend code skeleton (JWT auth, aggregate endpoints, floor plan controller with full validation)
   - React folder structure + initial setup
   - Konva.js floor plan implementation pattern
   - Quick Add modal design
   - Polling architecture with React Query
   - Floor Plan Management page UI spec

---

*End of Review V2 — 2026-05-22*
*Previous version: FRONTEND_PLAN_REVIEW.md (V1)*
*Rounds incorporated: 1, 2, 3*
