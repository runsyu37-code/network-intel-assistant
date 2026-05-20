# SSM — Surveillance Smart-Monitor Toolchain

เครื่องมือ Python สำหรับโปรเจกต์ระบบ monitor CCTV ในองค์กร  
ทำงานแบบ local-only — ข้อมูลจริงไม่ออกนอกเครื่อง

---

## โครงสร้าง Folder

```
network-intel-assistant/
│
├── sanitizer/                   ← Data Sanitizer tool
│   ├── sanitize.py              ← ตัวหลัก — รันตรงนี้
│   ├── patterns.py              ← regex patterns ทั้งหมด
│   ├── mappings.json            ← persistent mapping (--persist-mapping)
│   ├── SANITIZER_GUIDE.md       ← คู่มือใช้งาน sanitizer
│   └── SANITIZER_PROMPT.md
│
├── scripts/                     ← SSM Importer tool
│   ├── ssm_import.py            ← import Excel → SQL Server
│   ├── SSM_IMPORT_GUIDE.md      ← คู่มือใช้งาน importer (ฉบับเต็ม)
│   └── SSM_IMPORT_CHEATSHEET.md ← copy-paste commands
│
├── database/                    ← SQL Server schema
│   ├── SSM_schema_v2.sql        ← schema จริง → สร้าง SSM_DB
│   └── SSM_test_schema.sql      ← schema ทดสอบ → สร้าง SSM_TEST_DB
│
├── templates/                   ← Excel workbook templates
│   ├── template_v3.xlsx         ← survey template (ข้อมูลปลอม)
│   └── Fakeinfo_test.xlsx       ← template กรอกข้อมูลไว้แล้ว สำหรับทดสอบ
│
├── samples/                     ← ไฟล์ตัวอย่าง fake สำหรับทดสอบ sanitizer
├── tests/                       ← unit tests (28 tests, all pass)
├── output/                      ← ผลลัพธ์จาก sanitizer (git-ignored)
│
├── docs/                        ← เอกสารโปรเจกต์
│   ├── me/                      ← ABOUT_ME.md (บริบทผู้ใช้)
│   ├── plan/                    ← ROADMAP.md, MEGA_CONTEXT.md
│   ├── workflow/                ← START_HERE, HANDOVER, SESSION_PROTOCOL ฯลฯ
│   └── log/                     ← LEARNING_LOG.md
│
└── work_pack/                   ← ไฟล์ชุด backup ไปที่ทำงาน (7 ไฟล์)
    ├── ssm_import.py
    ├── SSM_schema_v2.sql
    ├── template_v3.xlsx
    ├── SSM_IMPORT_GUIDE.md
    ├── SSM_IMPORT_CHEATSHEET.md
    ├── MEGA_CONTEXT.md
    └── START_HERE.md
```

---

## Quick Start

### 1. ติดตั้ง dependencies

```powershell
pip install openpyxl pyodbc bcrypt
```

### 2. ทดสอบ sanitizer

```powershell
python sanitizer/sanitize.py samples/fake_input_01.txt output/clean_01.txt
```

### 3. ทดสอบ importer (ไม่แตะ DB)

```powershell
python scripts/ssm_import.py templates/Fakeinfo_test.xlsx --parse-only
```

### 4. รัน unit tests

```powershell
python -m unittest discover tests -v
```

---

## สิ่งที่ทำเสร็จแล้ว

| Tool | ไฟล์ | สถานะ |
|---|---|---|
| Data Sanitizer | `sanitizer/sanitize.py` | Done — 28/28 tests pass |
| SSM Importer | `scripts/ssm_import.py` | Done — parse-only tested |
| SQL Schema | `database/SSM_schema_v2.sql` | Done — 13 tables, 5 views |
| SQL Test Schema | `database/SSM_test_schema.sql` | Done — SSM_TEST_DB สำหรับทดสอบ |
| Excel Template | `templates/template_v3.xlsx` | Done — 10 sheets |
| Excel Test Data | `templates/Fakeinfo_test.xlsx` | Done — กรอกข้อมูลพร้อม import |
| Backend API (C#) | branch `feature/backend-api` | Done — 13 controllers, Bruno collection |

---

## ทดสอบ pipeline เต็ม (ไม่แตะ production)

```powershell
# 1. สร้าง test DB ใน SSMS ก่อน
#    CREATE DATABASE SSM_TEST_DB;
#    แล้วรัน database/SSM_test_schema.sql

# 2. parse-only (ไม่แตะ DB เลย)
python scripts/ssm_import.py templates/Fakeinfo_test.xlsx --parse-only

# 3. dry-run (เชื่อม DB แต่ไม่ save)
python scripts/ssm_import.py templates/Fakeinfo_test.xlsx --server localhost\SQLEXPRESS --db SSM_TEST_DB --auth windows --dry-run

# 4. รันจริงเข้า test DB
python scripts/ssm_import.py templates/Fakeinfo_test.xlsx --server localhost\SQLEXPRESS --db SSM_TEST_DB --auth windows
```

---

## เตรียม backup ไปที่ทำงาน

อัปเดต `work_pack/` ก่อน push ทุกครั้ง

```powershell
# copy ไฟล์ล่าสุดเข้า work_pack/
Copy-Item scripts\ssm_import.py              work_pack\ -Force
Copy-Item scripts\SSM_IMPORT_GUIDE.md        work_pack\ -Force
Copy-Item scripts\SSM_IMPORT_CHEATSHEET.md   work_pack\ -Force
Copy-Item database\SSM_schema_v2.sql         work_pack\ -Force
Copy-Item templates\template_v3.xlsx         work_pack\ -Force
Copy-Item docs\plan\MEGA_CONTEXT.md          work_pack\ -Force
Copy-Item docs\workflow\START_HERE.md        work_pack\ -Force
```

---

## คู่มือ

| ต้องการอะไร | ดูที่ไหน |
|---|---|
| วิธี sanitize ข้อมูล | `sanitizer/SANITIZER_GUIDE.md` |
| วิธี import Excel → SQL | `scripts/SSM_IMPORT_GUIDE.md` |
| copy-paste commands | `scripts/SSM_IMPORT_CHEATSHEET.md` |
| บริบทโปรเจกต์เต็ม | `docs/plan/MEGA_CONTEXT.md` |
| แผนงาน | `docs/plan/ROADMAP.md` |
| บันทึกการเรียนรู้ | `docs/log/LEARNING_LOG.md` |

---

*Python 3.11+ · Local-only · ข้อมูลจริงไม่ออกนอกเครื่อง*
