# SSM IMPORT — Quick Reference

**Tool:** `MEGA/ssm_import.py`  
**Purpose:** อ่าน `template_v3.xlsx` (10 sheets) แล้ว insert เข้า MS SQL Server (SSM_DB)

---

## Install

```bash
pip install openpyxl pyodbc bcrypt
# + ติดตั้ง Microsoft ODBC Driver 17+ for SQL Server
```

---

## วิธีใช้ — 3 mode

### Mode 1: Parse Only (ไม่ต้องมี DB — ทดสอบได้เลย)
```bash
python MEGA/ssm_import.py "MEGA/template_v3.xlsx" --parse-only
```
อ่าน Excel + validate IP/MAC แล้วแสดงผล — **ไม่แตะ DB เลย**

---

### Mode 2: Dry Run (ทดสอบกับ DB จริง แต่ไม่ save)
```bash
# Home laptop — Windows Auth
python MEGA/ssm_import.py "MEGA/template_v3.xlsx" \
    --server localhost\SQLEXPRESS \
    --db SSM_DB \
    --auth windows \
    --dry-run

# Work notebook — SQL Auth
python MEGA/ssm_import.py "MEGA/template_v3.xlsx" \
    --server <SERVER_NAME>\SQLEXPRESS \
    --db SSM_DB \
    --auth sql --user <username> --password <password> \
    --dry-run
```
Insert ทุก row ใน transaction แล้ว **roll back** — ถ้าไม่ error = พร้อมรันจริง

---

### Mode 3: รันจริง
```bash
# Home laptop
python MEGA/ssm_import.py "MEGA/template_v3.xlsx" \
    --server localhost\SQLEXPRESS \
    --db SSM_DB \
    --auth windows

# Work notebook
python MEGA/ssm_import.py "MEGA/template_v3.xlsx" \
    --server <SERVER_NAME>\SQLEXPRESS \
    --db SSM_DB \
    --auth sql --user <username> --password <password>
```

---

## ลำดับการ insert (FK order)

```
sites -> buildings -> floors -> rooms -> racks
      -> poe_switches -> nvrs -> cameras -> users
```

---

## Options ทั้งหมด

| Flag | Default | ความหมาย |
|------|---------|----------|
| `--server` | `localhost\SQLEXPRESS` | ชื่อ SQL Server instance |
| `--db` | `SSM_DB` | ชื่อ database |
| `--auth` | `windows` | `windows` หรือ `sql` |
| `--user` | — | SQL Auth username |
| `--password` | — | SQL Auth password |
| `--dry-run` | off | validate + insert แล้ว roll back |
| `--parse-only` | off | อ่าน Excel อย่างเดียว ไม่ต่อ DB |
| `--report` | `import_report.csv` | path ของ CSV report |

---

## ขั้นตอนใช้งานครั้งแรก

```
1. รัน SSM_schema_v2.sql ใน SSMS (สร้าง 13 tables + views)
2. python ssm_import.py ... --parse-only      (เช็ค Excel)
3. python ssm_import.py ... --dry-run         (เช็คกับ DB)
4. python ssm_import.py ... (รันจริง)
5. เช็คผลใน SSMS:
       SELECT * FROM vw_camera_full_path
       SELECT * FROM vw_dashboard_summary
```

---

## Validate ที่ทำอัตโนมัติ

| ข้อมูล | กฎ |
|--------|-----|
| IP address | format `x.x.x.x` |
| MAC address | format `XX:XX:XX:XX:XX:XX` |
| `u_subposition` | ต้องเป็น 1, 2, หรือ 3 |
| `hdd_used_pct` | ต้องอยู่ระหว่าง 0–100 |
| Image Path | ไฟล์ต้องมีอยู่จริง + ขนาด <= 5 MB |
| Password | bcrypt hash อัตโนมัติ (cost 12) |

---

## หมายเหตุ

- `created_at` / `updated_at` — ถ้าว่างในExcel DB จะ fill อัตโนมัติ
- `User_ID` ใน 9_Users — ไม่ต้องกรอก SQL Server assign เอง
- Switch/NVR ว่าง — import ได้ปกติ จะข้ามไป
