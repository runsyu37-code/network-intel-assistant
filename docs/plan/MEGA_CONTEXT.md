# MEGA CONTEXT — SSM Project (AI Briefing File)

> **สำหรับ AI:** อ่านไฟล์นี้จบแล้วรู้ทุกอย่าง ไม่ต้องถามบริบทเพิ่ม
> **อัปเดตล่าสุด:** 2026-05-22
> **Session วันนี้:** 2026-05-22 เวลา 08:00–17:00 (Work Notebook)

---

## 1. ใครคือ Ran?

- ชื่อ **Ran** (Susan) — นักศึกษาปี 4 ฝึกงาน Network Engineer
- ฝึกงานถึง **ตุลาคม 2026** — deadline โปรเจกต์ SSM นี้ **ต้นเดือน July 2026** (หลังจากนั้นจะได้รับโปรเจกต์ใหม่จากที่ทำงาน)
- ภาษา: พิมพ์ภาษาอังกฤษ แต่ **ต้องตอบเป็นภาษาไทยเสมอ**
- แนวทาง: ใช้ AI เป็น tool หลักในการสร้างและแก้ปัญหา — focus ที่ logic และผลลัพธ์มากกว่า syntax
- อยู่ที่ทำงาน: ใช้ `work-safe` branch, SQL Auth, path `C:\ai-playground\...`
- อยู่ที่บ้าน: ใช้ `master` branch, Windows Auth, path `C:\1_Work_Local\AI_Agent\...`

---

## 2. โปรเจกต์คืออะไร

**SSM v1.0 — Surveillance Smart-Monitor**
ระบบ web app สำหรับ monitor CCTV, NVR, PoE Switch ในองค์กร
ข้อมูลลำดับชั้น: **Site → Building → Floor → Room → Rack → Device**

### pipeline ข้อมูล (updated 2026-05-21)

```
template_v4.xlsx     copy-paste ใน SSMS     MS SQL Server
(survey staff กรอก) ──► Edit Top 200 Rows ──►  SSM_DB
                                                ▲
                                           C# REST API (ASP.NET)
                                                ▲
                                           SSM web app (planned)
```

> ssm_import.py ยกเลิกแล้ว — ดู `docs/workflow/IMPORT_DECISION.md`

---

## 3. โครงสร้าง Folder (Home Laptop — master branch)

```
network-intel-assistant/
├── sanitizer/                   ← Data Sanitizer (แทน IP/MAC ด้วยค่าปลอม)
│   ├── sanitize.py
│   ├── patterns.py
│   ├── SANITIZER_GUIDE.md
│   └── SANITIZER_PROMPT.md
│
├── scripts/                     ← SSM Importer
│   ├── ssm_import.py            ← ตัวหลัก
│   ├── DEMO_GUIDE.md            ← คู่มือ demo (ไฟล์อยู่ folder เดียวกัน)
│   ├── SSM_IMPORT_GUIDE.md
│   └── SSM_IMPORT_CHEATSHEET.md
│
├── database/
│   ├── SSM_schema_v2.sql        ← schema จริง → SSM_DB (column order ตรง Excel)
│   ├── SSM_test_schema.sql      ← schema ทดสอบ → SSM_TEST_DB
│   └── mock_data.sql            ← mock data 2 sites/buildings/floors/rooms/racks, 2 switches/NVRs, 3 cameras
│
├── templates/
│   ├── template_v4_empty.xlsx   ← template เปล่า (กรอกเอง)
│   └── Fakeinfo_test.xlsx       ← ข้อมูลปลอมพร้อม import (111 rows)
│
├── tests/ / samples/ / output/
│
├── docs/
│   ├── me/       → ABOUT_ME.md
│   ├── plan/     → ROADMAP.md, MEGA_CONTEXT.md (ไฟล์นี้)
│   ├── workflow/ → START_HERE.md, HANDOVER.md, IMPORT_DECISION.md ฯลฯ
│   └── log/      → LEARNING_LOG.md, BUG_LOG.md
│
├── api/                         ← backup C# API (mirror จาก feature/backend-api)
│   ├── Controllers/             ← 13 controllers (CRUD)
│   ├── Models/                  ← 13 models
│   ├── ConnectionDB/            ← DB connection helper
│   ├── bruno/                   ← Bruno collection (GET/SAVE/UPDATE/DELETE ครบ)
│   ├── BACKEND.md               ← API documentation
│   └── Web.config               ← connection string template
│
└── work_pack/                   ← ชุดไฟล์พร้อม copy ไปที่ทำงาน
    ├── ssm_import.py
    ├── SSM_schema_v2.sql
    ├── template_v4_empty.xlsx
    ├── Fakeinfo_test.xlsx
    ├── DEMO_GUIDE.md
    ├── SSM_IMPORT_GUIDE.md
    ├── SSM_IMPORT_CHEATSHEET.md
    ├── MEGA_CONTEXT.md
    └── START_HERE.md
```

---

## 4. สิ่งที่ทำเสร็จแล้ว

| Tool | สถานะ | หมายเหตุ |
|---|---|---|
| Data Sanitizer | ✅ Done | 28/28 tests pass |
| SSM Importer | ✅ Retired | เก็บไว้เป็น portfolio — ไม่ใช้แล้ว |
| SQL Schema v2 | ✅ Done | column order redesign ตรง Excel, DROP+CREATE survey tables |
| Excel Template v4 | ✅ Done | 10 sheets, copy-paste เข้า SSMS ได้เลย |
| Mock Data SQL | ✅ Done | `database/mock_data.sql` — รันแล้วใน SSM_DB ที่ทำงาน |
| Backend API (C#) | ✅ Done | 13 controllers, Bruno bodies ครบ, HTTP methods ถูกต้องแล้ว |
| Bruno Collection | ✅ Done | SAVE/UPDATE/DELETE มี body + method ถูก (branch: feature/backend-api) |
| API Testing | ✅ Passed | ทดสอบผ่าน Bruno แล้ว (mock data) |

---

## 5. งานที่ยังค้างอยู่

| ลำดับ | งาน | สถานะ |
|---|---|---|
| 1 | SSM Web App — Frontend (React) + connect API | 🔥 งานต่อไป |
| 2 | Paste ข้อมูลจริงจาก survey staff เข้า SSM_DB | ⏳ รอข้อมูลจาก staff |
| 3 | ตรวจ views ใน SSMS หลัง paste ครบ | ⏳ รอทำหลัง paste |

> **หมายเหตุ:** ยกเลิก Python importer แล้ว — ดู `docs/workflow/IMPORT_DECISION.md`

---

## 6. การแก้ Bug ssm_import.py (สำคัญ — บันทึกไว้)

แก้แล้ว 5 จุดใน session 2026-05-20:

| Bug | ปัญหา | แก้แล้ว |
|---|---|---|
| 1 | Example row (`e.g.`) หลุดเข้า DB | ✅ |
| 2 | ALIAS ไม่รองรับ header template_v4 | ✅ |
| 3 | IP invalid → FAIL ทั้ง row | ✅ เปลี่ยนเป็น WARN + NULL |
| 4 | `→` crash บน Windows cp874 | ✅ เปลี่ยนเป็น `->` |
| 5 | device_name NOT NULL แต่ไม่มีค่า | ✅ auto-fill จาก PK |

Schema แก้: เปลี่ยน UNIQUE constraint → filtered index (`WHERE col IS NOT NULL`)
ตาราง: `nvrs`, `poe_switches`, `cameras` — columns: `serial_no`, `mac_address`, `NVR_CH`

---

## 7. วิธี Import ข้อมูลจริง (updated 2026-05-21)

> **ssm_import.py ยกเลิกแล้ว** — ใช้ copy-paste จาก Excel เข้า SSMS โดยตรงแทน

```
1. รัน database/SSM_schema_v2.sql ใน SSMS (F5) → reset survey tables
2. เปิด templates/template_v4_empty.xlsx → กรอกข้อมูล
3. Paste ทีละ sheet ตาม FK order:
   1_Site → 2_Building → 3_Floor → 4_Room → 5_Rack → 8_Switch → 7_NVR → 6_CCTV
```

ดูรายละเอียดครบที่ `docs/workflow/IMPORT_DECISION.md`

---

## 8. GitHub Branches

| Branch | ใช้ทำอะไร | Path ที่ทำงาน |
|---|---|---|
| `master` | home laptop — พัฒนา/จัดระเบียบ | `C:\1_Work_Local\AI_Agent\...` |
| `work-safe` | work notebook — schema, docs, mock data | `C:\ai-playground\Notebook_Work\FOR_WORK_NB` |
| `feature/backend-api` | C# backend API + Bruno | `C:\ai-playground\API` |

**กฎ GitHub:**
- push docs/schema จากที่ทำงาน: `git push origin work-safe`
- push API จากที่ทำงาน: `git push origin feature/backend-api` (จาก `C:\ai-playground\API`)
- sync ไปที่บ้าน: pull จาก branch ที่ต้องการ

---

## 9. กฎสำหรับ AI

- ตอบ **ภาษาไทยเสมอ** แม้ Ran พิมพ์ภาษาอังกฤษ
- Technical terms คง English (PK, FK, schema, importer ฯลฯ)
- อธิบาย **WHY ก่อน HOW** เสมอ
- **ห้าม redesign** schema หรือ structure — ตัดสินใจแล้วทุกอย่าง
- **ห้าม** ส่งข้อมูลจริงออก network
- ถามก่อน **ก่อนลบไฟล์หรือ drop table** ใดๆ
- อ่าน `docs/log/LEARNING_LOG.md` ถ้าอยากรู้ว่าเรียนรู้อะไรไปแล้ว
- อ่าน `docs/me/ABOUT_ME.md` ถ้าอยากรู้จัก Ran เพิ่มเติม

---

## 10. Machine Info

| | Home Laptop | Work Notebook |
|---|---|---|
| Branch | `master` | `work-safe` |
| Auth | Windows Auth | SQL Auth |
| Server | `localhost\SQLEXPRESS` | ถาม Ran |
| DB test | `SSM_TEST_DB` | `SSM_TEST_DB` |
| DB prod | `SSM_DB` | `SSM_DB` |
| Path | `C:\1_Work_Local\AI_Agent\network-intel-assistant` | `C:\ai-playground\network-intel-assistant` |
