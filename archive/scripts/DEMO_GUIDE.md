# SSM Importer — คู่มือใช้งาน (ไฟล์อยู่ folder เดียวกัน)

> วางไฟล์ทั้งหมดไว้ใน folder เดียวกันก่อน แล้วเปิด Terminal ใน folder นั้น

---

## ไฟล์ที่ต้องมีใน folder

```
your-folder/
├── ssm_import.py         ← ตัว importer
└── Fakeinfo_test.xlsx    ← ไฟล์ Excel ทดสอบ (หรือไฟล์จริง)
```

---

## ขั้นตอนที่ 1 — เปิด Terminal ใน folder นั้น

เปิด folder ใน File Explorer → คลิกช่อง path บนสุด → พิมพ์ `cmd` → Enter

หรือใน VS Code: เปิด folder → กด **Ctrl+`**

---

## ขั้นตอนที่ 2 — ติดตั้ง (ครั้งแรกครั้งเดียว)

```powershell
pip install openpyxl pyodbc bcrypt
```

---

## ขั้นตอนที่ 3 — ทดสอบอ่าน Excel (ไม่แตะ DB เลย)

```powershell
python ssm_import.py Fakeinfo_test.xlsx --parse-only
```

**ผลที่ต้องเห็น:**
```
Done. 111 rows parsed (no DB touched).
```
ไม่มี [FAIL] = Excel พร้อม ✅

---

## ขั้นตอนที่ 4 — Dry Run (เชื่อม DB แต่ไม่ save จริง)

**Windows Auth** (ไม่ต้องใส่ password)
```powershell
python ssm_import.py Fakeinfo_test.xlsx --server localhost\SQLEXPRESS --db SSM_TEST_DB --auth windows --dry-run
```

**SQL Auth** (ใส่ username + password)
```powershell
python ssm_import.py Fakeinfo_test.xlsx --server localhost\SQLEXPRESS --db SSM_TEST_DB --auth sql --user sa --password ใส่รหัสตรงนี้ --dry-run
```

**ผลที่ต้องเห็น:**
```
[DRY-RUN] rolled back — no data written.
```

---

## ขั้นตอนที่ 5 — Import จริง (เขียนลง DB)

**Windows Auth**
```powershell
python ssm_import.py Fakeinfo_test.xlsx --server localhost\SQLEXPRESS --db SSM_TEST_DB --auth windows
```

**SQL Auth**
```powershell
python ssm_import.py Fakeinfo_test.xlsx --server localhost\SQLEXPRESS --db SSM_TEST_DB --auth sql --user sa --password ใส่รหัสตรงนี้
```

**ผลที่ต้องเห็น:**
```
sites        inserted: 1
buildings    inserted: 7
floors       inserted: 13
rooms        inserted: 14
racks        inserted: 14
poe_switches inserted: 5
nvrs         inserted: 17
cameras      inserted: 40
Done. 111 rows imported.
```

---

## ขั้นตอนที่ 6 — ตรวจผลใน SSMS

```sql
USE SSM_TEST_DB;

SELECT * FROM vw_dashboard_summary
SELECT * FROM vw_camera_full_path
```

---

## ถ้าต้องการรันซ้ำ — ล้าง DB ก่อน

```sql
USE SSM_TEST_DB;

DELETE FROM cameras
DELETE FROM poe_switches
DELETE FROM nvrs
DELETE FROM racks
DELETE FROM rooms
DELETE FROM floors
DELETE FROM buildings
DELETE FROM sites
```

ต้องลบตามลำดับนี้เท่านั้น (ลบ child ก่อน parent เสมอ)

---

## สรุป options ทั้งหมด

| Option | ความหมาย |
|---|---|
| `--parse-only` | อ่าน Excel อย่างเดียว ไม่แตะ DB |
| `--dry-run` | เชื่อม DB แต่ rollback ไม่ save |
| `--auth windows` | login ด้วย Windows account |
| `--auth sql` | login ด้วย username + password |
| `--db SSM_TEST_DB` | เลือก database ที่จะ import เข้า |
| `--server` | ชื่อ SQL Server instance |
