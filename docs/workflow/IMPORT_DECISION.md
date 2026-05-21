# SSM Import — Decision Log (2026-05-21)

> **สำหรับ AI ที่อ่านไฟล์นี้:** อ่านแล้วจะเข้าใจว่า workflow การ import ข้อมูลเปลี่ยนไปยังไง
> และสิ่งไหนที่ไม่จำเป็นแล้ว ไม่ต้อง suggest ให้ใช้ Python importer อีก

---

## สรุปในหนึ่งประโยค

ยกเลิก `ssm_import.py` สำหรับ import ข้อมูล survey — เปลี่ยนมา **copy-paste จาก Excel โดยตรงเข้า SSMS** แทน

---

## WHY — ทำไมถึงเปลี่ยน

- ข้อมูล survey เป็น **one-time import** ไม่ได้รันซ้ำหลายรอบ
- staff กรอก Excel ครั้งเดียว แล้วไม่มีรอบต่อไป
- SSMS รองรับ copy-paste จาก Excel ได้โดยตรง (Edit Top 200 Rows)
- Updates หลังจากนี้ทำผ่าน **web app** แทน ไม่ต้องผ่าน importer
- Python automation overhead ไม่คุ้มกับ use case ที่ใช้ครั้งเดียว

---

## สิ่งที่เปลี่ยน

### ssm_import.py — สถานะ: เก็บไว้ ไม่ได้ใช้งาน

- **ไม่ใช้อีกแล้ว** สำหรับ production import
- **ไม่ลบทิ้ง** — มีคุณค่าเป็น portfolio (code ดี, 28/28 tests pass, แก้ bug 9 จุด)
- Features ต่อไปนี้ไม่จำเป็นแล้ว ไม่ต้องแก้หรือ maintain:
  - MAC validation / IP validation
  - example row detection (`e.g.` filter)
  - upsert mode (`--upsert`)
  - image base64 encoding
  - Bug 10 (MAC format normalize) — ค้างไว้ได้เลย ไม่ต้องแก้

### database/SSM_schema_v2.sql — redesigned

- **Column order** ของ 8 survey tables เรียงตาม `template_v4_empty.xlsx` แต่ละ sheet
- เพิ่ม **DROP survey tables + CREATE ใหม่** ที่ต้นไฟล์
- ไม่ DROP ทั้ง DB — ตาราง auth/log (users, sync_logs, audit_logs, ping_logs, alert_logs) ไม่ถูกแตะ
- รัน F5 ใน SSMS ทีเดียว = reset survey tables เปล่า + indexes + views ครบ

### database/SSM_test_schema.sql — redesigned เช่นเดียวกัน

- เพิ่ม DROP DATABASE SSM_TEST_DB + CREATE ใหม่ที่ต้นไฟล์
- Column order ตรงกับ Excel เช่นกัน

---

## Workflow ใหม่ — วิธี Import ข้อมูลจริง

### ขั้นตอน

1. รัน `database/SSM_schema_v2.sql` ใน SSMS (F5) → reset survey tables ให้เปล่า
2. เปิด `templates/template_v4_empty.xlsx` → กรอกข้อมูล survey
3. Paste ทีละ sheet ตามลำดับ FK เท่านั้น:

```
1_Site → 2_Building → 3_Floor → 4_Room → 5_Rack → 8_Switch → 7_NVR → 6_CCTV
```

### วิธี paste แต่ละ sheet

| Sheet | ตาราง | เลือก Excel cols | หมายเหตุ |
|---|---|---|---|
| 1_Site | sites | B–F | ตรงหมด 5 cols |
| 2_Building | buildings | B–I | H = Image Path ปล่อยว่างได้ |
| 3_Floor | floors | B–J | I = Image Path ปล่อยว่างได้ |
| 4_Room | rooms | B–K | J = Image Path ปล่อยว่างได้ |
| 5_Rack | racks | B–J | ตรงหมด 9 cols |
| 8_Switch | poe_switches | B–Z | ตรงหมด 25 cols |
| 7_NVR | nvrs | B–AB | ตรงหมด 27 cols |
| 6_CCTV | cameras | B–R แล้ว U–W | ข้าม S-T ที่ซ้ำ (2 paste) |

### ขั้นตอน paste ใน SSMS

1. คลิกขวาที่ตาราง → **Edit Top 200 Rows**
2. ใน Excel เลือก data rows (ไม่รวม header row และ column `#`)
3. คลิก row ว่างแรกใน SSMS → **Paste**
4. Ctrl+S เพื่อ save

---

## ปัญหาที่เจอและวิธีแก้

### 1. Column order ไม่ตรงกับ Excel
- **ปัญหา:** schema เดิมออกแบบตาม logic ไม่ใช่ตาม Excel — paste แล้วคอลัมน์เพี้ยน
- **แก้:** scan headers จาก Excel ด้วย Python (`openpyxl`) แล้ว reorder `CREATE TABLE`

### 2. Image Path = 1 col แต่ DB มี image_data + image_type = 2 cols
- **ปัญหา:** paste ตรงๆ ไม่ได้ จะชนกัน
- **แก้:** วาง `image_data` ตรงตำแหน่ง Image Path ใน CREATE TABLE, `image_type` ไปอยู่ท้าย — ผู้ใช้ paste cell ว่าง → DB รับเป็น NULL โดยอัตโนมัติ

### 3. 6_CCTV มีคอลัมน์ซ้ำ (col S = NVR Device Name, col T = NVR Channel)
- **ปัญหา:** template_v4 มี 2 cols ที่ map ไปยัง DB column เดิม → paste พร้อมกันไม่ได้
- **แก้:** paste B–R ก่อน (17 cols) แล้ว paste U–W แยก (3 cols) — ข้าม S-T

### 4. DROP DATABASE ทำให้ users และ log tables หาย
- **ปัญหา:** version แรกของ schema ใช้ DROP DATABASE ทำให้ seed users หาย
- **แก้:** เปลี่ยนเป็น DROP เฉพาะ 8 survey tables (reverse FK order) แล้ว CREATE ใหม่

---

## สิ่งที่ยังค้างอยู่ (ณ 2026-05-21)

- [ ] Paste ข้อมูลจริงจาก survey staff เข้า SSM_DB
- [ ] ตรวจ views ใน SSMS หลัง paste ครบ (`SELECT * FROM vw_camera_full_path`)
- [ ] SSM Web App (React/FastAPI) — งานต่อไปหลัง import เสร็จ

---

## ไฟล์ที่เกี่ยวข้อง

| ไฟล์ | สถานะ | หมายเหตุ |
|---|---|---|
| `scripts/ssm_import.py` | เก็บไว้ ไม่ใช้ | portfolio only |
| `database/SSM_schema_v2.sql` | ✅ ใช้งาน | reset + recreate survey tables |
| `database/SSM_test_schema.sql` | ✅ ใช้งาน | reset SSM_TEST_DB ทั้งหมด |
| `templates/template_v4_empty.xlsx` | ✅ ใช้งาน | กรอกแล้ว paste |
