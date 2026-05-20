# START HERE — Work Notebook Session

> **สำหรับ AI ในแชทนี้:** อ่านไฟล์นี้จบแล้วเริ่มได้เลย ไม่ต้องถามบริบทเพิ่ม
> **สำหรับ Ran:** ทำตาม "ขั้นตอนครั้งแรก" ด้านล่างก่อนเลย

---

## บริบทโครงการ (สำหรับ AI)

**ชื่อโครงการ:** SSM v1.0 — Surveillance Smart-Monitor  
**เจ้าของ:** Ran (Susan) — Networking & AI Intern, Thailand  
**Deadline:** ปลาย July 2026  
**GitHub:** https://github.com/runsyu37-code/network-intel-assistant (public)

### สิ่งที่สร้างเสร็จแล้ว

| Tool | ไฟล์ | สถานะ |
|------|------|-------|
| Data Sanitizer | `sanitize.py` + `patterns.py` | DONE — 28/28 tests pass |
| SSM Importer | `ssm_import.py` | DONE — parse-only tested, DB pending |
| Excel Template | `template_v3.xlsx` | DONE — 10 sheets, dummy data, clean |
| SQL Schema | `SSM_schema_v2.sql` | DONE — 13 tables, 5 views, indexes |

### งานที่ค้างอยู่ (Priority)

1. **รัน `SSM_schema_v2.sql` บน MS SQL Server** → สร้าง SSM_DB
2. **รัน `ssm_import.py --dry-run`** → ทดสอบกับ DB จริง
3. **รัน `ssm_import.py` จริง** → insert dummy data เข้า DB
4. **เช็ค views** ใน SSMS: `vw_camera_full_path`, `vw_dashboard_summary`
5. **กรอกข้อมูลจริง** ใส่ `template_v3_filled.xlsx` (ห้าม commit)
6. **รัน importer** กับข้อมูลจริง

### กฎสำคัญ (AI ต้องทำตาม)

- ตอบเป็น **ภาษาไทยเสมอ** แม้ Ran พิมพ์ภาษาอังกฤษ
- Technical terms คงเป็น English (PK, FK, schema, importer ฯลฯ)
- อธิบาย **WHY ก่อน HOW** เสมอ
- **ห้าม redesign** schema — decisions D1–D14 ใน MEGA_CONTEXT.md ล็อคแล้ว
- **ห้าม** ส่งข้อมูลออก network — เครื่องนี้อาจ air-gapped
- ถามก่อน **ก่อนลบไฟล์หรือ drop table** ใดๆ

### Machine Info

| | |
|--|--|
| เครื่องนี้ | Work Notebook |
| Path โปรเจกต์ | `C:\ai-playground\network-intel-assistant` |
| SQL Auth | username + password (ถาม Ran) |
| ข้อมูลจริง | ยังไม่ถึงมือ — รอ permission จากพี่ |

---

## ขั้นตอนครั้งแรก (สำหรับ Ran)

### 1. ติดตั้ง Python packages

```powershell
pip install openpyxl pyodbc bcrypt
```

> ถ้ายังไม่มี **Microsoft ODBC Driver 17 for SQL Server**  
> ค้นหา "ODBC Driver 17 for SQL Server download" แล้ว install ก่อน

### 2. ทดสอบ parse-only (ไม่ต้องมี DB)

```powershell
python ssm_import.py "template_v3.xlsx" --parse-only
```

ต้องเห็น `Done. 52 rows parsed (no DB touched).`

### 3. รัน schema บน SSMS

เปิด SSMS → เปิดไฟล์ `SSM_schema_v2.sql` → รัน  
ต้องไม่มี error

### 4. ทดสอบ dry-run

```powershell
python ssm_import.py "template_v3.xlsx" `
    --server <SERVER_NAME>\SQLEXPRESS `
    --db SSM_DB `
    --auth sql --user <username> --password <password> `
    --dry-run
```

แทน `<SERVER_NAME>`, `<username>`, `<password>` ด้วยค่าจริง

### 5. รันจริง (หลัง dry-run ผ่าน)

```powershell
python ssm_import.py "template_v3.xlsx" `
    --server <SERVER_NAME>\SQLEXPRESS `
    --db SSM_DB `
    --auth sql --user <username> --password <password>
```

### 6. เช็คผลใน SSMS

```sql
SELECT * FROM vw_camera_full_path
SELECT * FROM vw_dashboard_summary
```

---

## ไฟล์ในโฟลเดอร์นี้

| ไฟล์ | ใช้ทำอะไร |
|------|----------|
| `START_HERE.md` | ไฟล์นี้ — บริบทและขั้นตอน |
| `ssm_import.py` | importer หลัก |
| `SSM_IMPORT_GUIDE.md` | วิธีใช้ importer ฉบับเต็ม |
| `SSM_schema_v2.sql` | รันใน SSMS เพื่อสร้าง DB |
| `template_v3.xlsx` | Excel template (dummy data) |
| `sanitize.py` + `patterns.py` | sanitizer — แทน IP/MAC/hostname |
| `SANITIZER_GUIDE.md` | วิธีใช้ sanitizer |
| `MEGA_CONTEXT.md` | บริบทโปรเจกต์ฉบับเต็ม (สำหรับ AI) |

---

## กฎความปลอดภัยข้อมูล

```
template_v3.xlsx          ← dummy data ✅ แชร์ได้
template_v3_filled.xlsx   ← ข้อมูลจริง ❌ ห้าม commit / ห้ามส่ง AI
```

เมื่อกรอกข้อมูลจริง → บันทึกเป็น `template_v3_filled.xlsx`  
ถ้าจะส่งให้ AI → รัน sanitizer ก่อนเสมอ
