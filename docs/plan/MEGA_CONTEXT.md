# MEGA CONTEXT — SSM Project (AI Briefing File)

> **สำหรับ AI:** อ่านไฟล์นี้จบแล้วรู้ทุกอย่าง ไม่ต้องถามบริบทเพิ่ม
> **อัปเดตล่าสุด:** 2026-05-20

---

## 1. ใครคือ Ran?

- ชื่อ **Ran** (Susan) — นักศึกษาปี 4 ฝึกงาน Network Engineer
- ฝึกงานถึง **ตุลาคม 2026** — deadline โปรเจกต์นี้ **ปลาย July 2026**
- ภาษา: พิมพ์ภาษาอังกฤษ แต่ **ต้องตอบเป็นภาษาไทยเสมอ**
- เขียนโค้ดเองไม่ได้ — ใช้ AI generate + พยายามทำความเข้าใจ
- อยู่ที่ทำงาน: ใช้ `work-safe` branch, SQL Auth, path `C:\ai-playground\...`
- อยู่ที่บ้าน: ใช้ `master` branch, Windows Auth, path `C:\1_Work_Local\AI_Agent\...`

---

## 2. โปรเจกต์คืออะไร

**SSM v1.0 — Surveillance Smart-Monitor**
ระบบ web app สำหรับ monitor CCTV, NVR, PoE Switch ในองค์กร
ข้อมูลลำดับชั้น: **Site → Building → Floor → Room → Rack → Device**

### pipeline ข้อมูล

```
template_v4.xlsx        Python importer        MS SQL Server
(survey staff กรอก) ──► ssm_import.py    ──►  SSM_DB
                                               ▲
                                          SSM web app อ่านจากนี้
```

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
│   ├── SSM_schema_v2.sql        ← schema จริง → SSM_DB
│   └── SSM_test_schema.sql      ← schema ทดสอบ → SSM_TEST_DB
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
│   ├── workflow/ → START_HERE.md, HANDOVER.md, SESSION_PROTOCOL.md ฯลฯ
│   └── log/      → LEARNING_LOG.md
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
| SSM Importer | ✅ Done | 111 rows parse-only ผ่าน, bug 5 จุดแก้แล้ว |
| SQL Schema v2 | ✅ Done | 13 tables, 5 views, filtered indexes |
| Excel Template v4 | ✅ Done | 10 sheets, dummy data ครบ |
| Backend API (C#) | ✅ Done | 13 controllers, Bruno collection (branch: feature/backend-api) |
| Folder structure | ✅ Done | จัดระเบียบใหม่ทั้งหมด 2026-05-20 |

---

## 5. งานที่ยังค้างอยู่

| ลำดับ | งาน | สถานะ |
|---|---|---|
| 1 | Paste ข้อมูลจริงจาก survey staff เข้า SSM_DB | ⏳ รอทำ |
| 2 | ตรวจ views ใน SSMS หลัง paste ครบ | ⏳ รอทำ |
| 3 | SSM web app (React/FastAPI) | 📋 planned |

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

| Branch | ใช้ทำอะไร |
|---|---|
| `master` | home laptop — พัฒนา/จัดระเบียบ |
| `work-safe` | work notebook — ทำงานจริง |
| `feature/backend-api` | C# backend API (เสร็จแล้ว) |

**กฎ GitHub:**
- push จากที่บ้าน: `git push origin master`
- sync ไปที่ทำงาน: `git push origin master:work-safe --force`

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
