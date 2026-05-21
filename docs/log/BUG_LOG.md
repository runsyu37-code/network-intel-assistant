# SSM Import Tool — Full Bug Analysis
**Analysed:** 2026-05-21 (ระหว่างที่ไปอัปเดตงาน)  
**ไฟล์ที่ตรวจ:** `SSM_test_schema.sql`, `SSM_schema_v2.sql`, `ssm_import.py`

---

## สรุปภาพรวม

| # | ไฟล์ | ประเภท | สถานะ |
|---|------|--------|-------|
| 1 | test_schema | Room_ID NVARCHAR(10) → 20 | ✅ แก้แล้ว |
| 2 | test_schema | FK_sw_rack SET NULL บน NOT NULL col | ✅ แก้แล้ว |
| 3 | test_schema | FK_nvr_rack SET NULL บน NOT NULL col | ✅ แก้แล้ว |
| 4 | test_schema | FK_cam_poe_switch/nvr cascade cycle | ✅ แก้แล้ว |
| 5 | test_schema | UQ_sw_serial/mac ต้องเป็น filtered index | ✅ แก้แล้ว |
| 6 | test_schema | UQ_nvr_serial/mac ต้องเป็น filtered index | ✅ แก้แล้ว |
| 7 | test_schema | UQ_cam_nvr_ch/serial/mac ต้องเป็น filtered index | ✅ แก้แล้ว |
| 8 | ssm_import.py | hdd_used_pct ไม่มีใน ALIAS | ✅ แก้แล้ว |
| 9 | ssm_import.py | cameras firmware_version map ผิด column | ✅ แก้แล้ว |
| 10 | ssm_import.py | MAC validation รับแค่ colon format | ⚠️ ค้างอยู่ |

---

# SSM_TEST_DB — Bug Log
**Date:** 2026-05-21  
**Status:** Schema file fixed, DB recreation pending

---

## สรุปปัญหา

Schema ไฟล์ `SSM_test_schema.sql` ไม่ sync กับ production (`SSM_schema_v2.sql`) ทำให้ CREATE TABLE ล้มเหลวหลายจุดต่อเนื่องกัน

---

## Bug ที่พบและแก้แล้ว (ใน SSM_test_schema.sql)

| # | ตาราง | ปัญหา | Fix |
|---|-------|-------|-----|
| 1 | `rooms`, `racks`, `poe_switches`, `nvrs` | `Room_ID NVARCHAR(10)` — สั้นเกิน ค่าจริงเช่น `BLD_1_F1_SR1` (12 ตัว) truncated | เปลี่ยนเป็น `NVARCHAR(20)` ทุก column (4 จุด) |
| 2 | `poe_switches` | `FK_sw_rack`: `ON DELETE SET NULL` แต่ `Rack_ID NOT NULL` — ขัดกัน | เปลี่ยนเป็น `ON DELETE NO ACTION` |
| 3 | `nvrs` | `FK_nvr_rack`: ปัญหาเดียวกับ Bug 2 | เปลี่ยนเป็น `ON DELETE NO ACTION` |
| 4 | `cameras` | `FK_cam_poe_switch` / `FK_cam_nvr`: `ON UPDATE CASCADE` ทำให้ SQL Server ตรวจพบ multiple cascade paths | เปลี่ยนเป็น `ON UPDATE NO ACTION` ทั้งคู่ |

**ไฟล์ที่แก้แล้ว:** `database/SSM_test_schema.sql`  
**ไฟล์ production ไม่ต้องแก้:** `database/SSM_schema_v2.sql` — Bug 1, 2, 3 แก้ไปแล้วก่อนหน้า, Bug 4 ต้องตรวจสอบด้วย

---

---

## รายละเอียด Bug ทีละจุด

### Bug 5–7: UNIQUE constraint บน nullable column (test schema)
**ปัญหา:** SQL Server ไม่ยอมให้มีค่า NULL ซ้ำกันใน UNIQUE constraint ธรรมดา  
ถ้า switch 2 ตัวไม่มี serial_no → row ที่ 2 จะ fail `UQ_sw_serial` ทันที  
**Fix:** เปลี่ยนเป็น filtered unique index (`WHERE col IS NOT NULL`) เหมือน production

### Bug 8: hdd_used_pct ไม่ถูก import
**ปัญหา:** ALIAS ใน ssm_import.py ไม่มี mapping สำหรับ "HDD Used (%)"  
Excel sheet 7_NVR มีคอลัมน์นี้ แต่ Python ข้ามไปเงียบๆ → ค่าใน DB จะเป็น NULL เสมอ  
**Fix:** เพิ่ม `"hdd used (%)": "hdd_used_pct"` ใน ALIAS

### Bug 9: cameras firmware map ผิด column
**ปัญหา:** ALIAS map "os/firmware" → `os_version` ทุกตาราง  
แต่ `cameras` table ไม่มี column `os_version` มีแค่ `firmware_version`  
→ Python พยายาม INSERT `os_version` เข้า cameras → SQL error "Invalid column name"  
**Fix:** ใน `_import_sheet` ถ้า table=cameras ให้ rename `os_version` → `firmware_version`

### Bug 10: MAC validation รับแค่ colon format (ค้างอยู่)
**ปัญหา:** regex ใน ssm_import.py: `^([0-9A-Fa-f]{2}:){5}[0-9A-Fa-f]{2}$`  
รับเฉพาะ `aa:bb:cc:dd:ee:ff` เท่านั้น  
ถ้า Excel ใส่ `aa-bb-cc-dd-ee-ff` หรือ `aabb.ccdd.eeff` → nullify แบบ silent  
**วิธีแก้เมื่อกลับมา:** เพิ่ม normalize function แปลง `-` และ `.` format เป็น `:` ก่อน validate

---

## ข้อจำกัดในการกรอก Excel (test data)

ค่าต้องตรงกับ CHECK constraint ใน schema — ถ้าผิดจะ error ตอน insert:

| Sheet | Column | ค่าที่รับได้ |
|-------|--------|------------|
| 4_Room | Room Type | `server` / `network` / `office` / `power` / `other` |
| 8_Switch | Switch Type | `PoE` / `Non-PoE` / `Core` / `Aggregation` (case-sensitive) |
| 7_NVR | Record Status | `normal` / `warning` / `error` / `stopped` |
| ทุกอุปกรณ์ | Status | `online` / `offline` / `warning` / `unknown` |
| 7_NVR | HDD Used (%) | 0–100 เท่านั้น |
| 8_Switch / 7_NVR | U Sub-pos | 1, 2, หรือ 3 เท่านั้น |
| ทุกอุปกรณ์ | MAC Address | `XX:XX:XX:XX:XX:XX` (colon เท่านั้น จนกว่าจะแก้ Bug 10) |
| 1_Site | Site_ID | ≤10 ตัวอักษร |
| 4_Room | Room_ID | ≤20 ตัวอักษร (แก้แล้ว) |

---

## สิ่งที่ยังค้างอยู่

- [ ] Drop + Recreate SSM_TEST_DB ด้วย schema ที่แก้แล้ว
- [ ] Insert ข้อมูล test (SQL script พร้อมแล้ว — ดู session chat)
- [ ] แก้ Bug 10: MAC format normalize ใน ssm_import.py
- [ ] เทส API + Bruno

---

## วิธีแก้ตอนกลับมา

**Step 1 — Recreate DB:**
```sql
USE master;
GO
ALTER DATABASE SSM_TEST_DB SET SINGLE_USER WITH ROLLBACK IMMEDIATE;
GO
DROP DATABASE SSM_TEST_DB;
GO
CREATE DATABASE SSM_TEST_DB;
GO
```

**Step 2 — รัน schema ใหม่:**  
เปิด `database/SSM_test_schema.sql` ใน SSMS แล้วกด F5 — ควรผ่านทุก error แล้ว

**Step 3 — Insert test data:**  
รัน INSERT script จาก session chat (sites → buildings → floors → rooms → racks → poe_switches → nvrs → cameras)
