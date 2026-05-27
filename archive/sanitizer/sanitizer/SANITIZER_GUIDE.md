# SANITIZER — Quick Reference

**Tool:** `sanitizer/sanitize.py`  
**Purpose:** แทนค่า IP, MAC, Hostname, Location ด้วยค่า fake ก่อนส่งให้ AI หรืออัปโหลด

---

## วิธีใช้

```bash
# พื้นฐาน
python sanitizer/sanitize.py <input> <output>

# ตัวอย่าง
python sanitizer/sanitize.py mydata.txt       output/clean.txt
python sanitizer/sanitize.py dump.sql         output/clean.sql
python sanitizer/sanitize.py inventory.csv    output/clean.csv
python sanitizer/sanitize.py network.xlsx     output/clean.xlsx
```

## Options

| Flag | ความหมาย | ตัวอย่าง |
|------|----------|---------|
| `--report FILE` | บันทึก mapping จริง→fake เป็น JSON | `--report output/map.json` |
| `--persist-mapping` | ถ้ารันหลายไฟล์ ให้ IP เดิมได้ fake เดิมทุกครั้ง | `--persist-mapping` |

## รองรับไฟล์

| ประเภท | รองรับ | หมายเหตุ |
|--------|--------|---------|
| `.txt` | YES | |
| `.sql` | YES | SQL dump = plain text |
| `.csv` | YES | plain text |
| `.xlsx` | YES | ต้องมี `openpyxl` |
| `.pdf` | NO | — |

## สิ่งที่แทน

| ข้อมูล | ตัวอย่าง real | ตัวอย่าง fake |
|--------|-------------|--------------|
| IPv4 | `203.0.113.5` | `10.0.0.1` |
| MAC (colon) | `aa:bb:cc:dd:ee:ff` | `fa:fe:00:00:00:01` |
| MAC (Cisco dot) | `aabb.ccdd.eeff` | `fafe.0000.0001` |
| Hostname SW | `EXAMPLE-SW-FLOOR3-01` | `SW-001` |
| Hostname NVR | `EXAMPLE-NVR-B1-01` | `NVR-001` |
| Hostname Camera | `EXAMPLE-CAM-R301-01` | `CAM-001` |
| Building | `Building EX-A` | `Building-A` |
| Floor | `Floor 3` | `Floor-1` |
| Room | `Room R-301` | `Room-001` |

## กฎความปลอดภัย

```
ไฟล์จริง (มีข้อมูล network จริง)
    ↓ รัน sanitize.py บน work machine เท่านั้น
ไฟล์ clean (fake data)
    ↓ โยนให้ AI / อัปโหลด Google Drive / ส่งเพื่อนได้
```

- **ห้าม** upload ไฟล์ real ขึ้น cloud หรือ GitHub
- **ห้าม** รัน sanitizer บน path ที่อยู่นอก `C:\1_Work_Local\`

## รัน tests

```bash
python -m unittest discover tests -v
# ต้องผ่าน 28/28
```

## Install

```bash
pip install openpyxl   # สำหรับ .xlsx เท่านั้น
```
