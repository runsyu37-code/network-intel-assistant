# SSM Import — คู่มือ Copy-Paste

---

## ขั้นตอนที่ 0 — ติดตั้ง (ครั้งแรกครั้งเดียว)

```powershell
pip install openpyxl pyodbc bcrypt
```

---

## ขั้นตอนที่ 1 — เช็ค ODBC Driver

```powershell
Get-OdbcDriver | Where-Object {$_.Name -like "*SQL*"}
```

ต้องเห็น `ODBC Driver 17 for SQL Server` หรือ `18`
ถ้าไม่เห็น → ไปดาวน์โหลดจาก Microsoft ก่อน

---

## ขั้นตอนที่ 2 — ทดสอบ (ไม่แตะ DB เลย)

```powershell
python scripts/ssm_import.py templates/Fakeinfo_test.xlsx --parse-only
```

---

## ขั้นตอนที่ 3 — Dry Run (เชื่อม DB แต่ไม่ save จริง)

**Windows Auth (บ้าน — ไม่ต้องมี username/password)**
```powershell
python scripts/ssm_import.py templates/Fakeinfo_test.xlsx --server localhost\SQLEXPRESS --db SSM_DB --auth windows --dry-run
```

**SQL Auth (ที่ทำงาน — ต้องใส่ username/password)**
```powershell
python scripts/ssm_import.py templates/Fakeinfo_test.xlsx --server SERVER_NAME\SQLEXPRESS --db SSM_DB --auth sql --user sa --password ใส่รหัสตรงนี้ --dry-run
```

---

## ขั้นตอนที่ 4 — รันจริง (insert เข้า DB)

**Windows Auth (บ้าน)**
```powershell
python scripts/ssm_import.py templates/template_v4_empty.xlsx --server localhost\SQLEXPRESS --db SSM_DB --auth windows
```

**SQL Auth (ที่ทำงาน)**
```powershell
python scripts/ssm_import.py templates/template_v4_empty.xlsx --server SERVER_NAME\SQLEXPRESS --db SSM_DB --auth sql --user sa --password ใส่รหัสตรงนี้
```

---

## เช็คผลใน SSMS (หลัง import)

```sql
SELECT * FROM vw_dashboard_summary
SELECT * FROM vw_camera_full_path
SELECT * FROM sites
SELECT * FROM cameras
```

---

## สรุปความต่างของแต่ละ option

| Option | ความหมาย |
|---|---|
| `--parse-only` | อ่าน Excel อย่างเดียว ไม่แตะ DB |
| `--dry-run` | เชื่อม DB แต่ rollback ทิ้ง ไม่ save |
| ไม่ใส่อะไร | รันจริง insert เข้า DB |
| `--auth windows` | login ด้วย Windows account |
| `--auth sql` | login ด้วย username + password |
