# PHASE LOG — SSM v1.0 Surveillance Smart-Monitor

> **วัตถุประสงค์:** สรุปแต่ละ phase ว่าทำอะไร ได้อะไร เพื่อให้ผู้ดูแลโปรเจกต์ review และให้ความเห็นกลับมา
> **อัปเดตล่าสุด:** 2026-05-22

---

## สรุปภาพรวม

| Phase | ชื่อ | สถานะ | วันที่เสร็จ |
|---|---|---|---|
| 1 | Data Sanitizer | ✅ Done | 2026-05 |
| 2 | SQL Schema v2 | ✅ Done | 2026-05 |
| 3 | Excel Template v4 | ✅ Done | 2026-05 |
| 4 | SSM Importer (Python) | ✅ Retired (เก็บไว้ใน portfolio) | 2026-05-20 |
| 5 | Mock Data SQL | ✅ Done | 2026-05-21 |
| 6 | Backend API (C#) | ✅ Done | 2026-05-21 |
| 7 | SSM Web App (Frontend) | 🔥 งานต่อไป | — |

---

## Phase 1 — Data Sanitizer

**ทำอะไร:**
- เขียน Python script (`sanitize.py`) สำหรับแทนที่ข้อมูลจริง (IP, MAC, hostname) ด้วยค่าปลอม
- ใช้ regex + mapping table เพื่อให้ค่าเดิมถูกแทนด้วยค่าเดิมสม่ำเสมอ (เช่น IP เดิม → IP ปลอมเดิมเสมอ)
- เขียน unit tests ครบ 28 test cases

**สิ่งที่ได้:**
- ป้องกันข้อมูลจริงรั่วไหลออก network ได้ 100%
- สามารถนำ output ที่ sanitize แล้วส่งให้ AI cloud หรือ push GitHub ได้อย่างปลอดภัย
- test pass 28/28 — มั่นใจได้ว่า script ทำงานถูกต้อง
- เป็น reusable tool ใช้ได้กับโปรเจกต์อื่นในอนาคต

**ปัญหาที่เจอ:**
- ไม่มีปัญหาหลัก — script ทำงานได้ตามแผน

---

## Phase 2 — SQL Schema v2

**ทำอะไร:**
- ออกแบบ database schema สำหรับ SSM_DB บน MS SQL Server
- สร้าง 13 tables ตามลำดับชั้น: Site → Building → Floor → Room → Rack → Device (NVR, Switch, Camera)
- สร้าง 5 views สำหรับ query ข้อมูลรวม
- แก้ UNIQUE constraint เป็น filtered index (`WHERE col IS NOT NULL`) สำหรับ column ที่ optional

**สิ่งที่ได้:**
- Database structure พร้อมใช้งานจริง
- รองรับ hierarchy ครบทุกระดับ (Site ถึง Device)
- Column order ตรงกับ Excel template — copy-paste ได้โดยตรงโดยไม่ต้องจัดเรียงใหม่
- Schema รองรับ NULL ใน optional fields ได้ถูกต้อง ไม่ error

**ปัญหาที่เจอ:**
- UNIQUE constraint เดิมทำให้ import ล้มเหลวเมื่อ field optional เป็น NULL → แก้เป็น filtered index

---

## Phase 3 — Excel Template v4

**ทำอะไร:**
- สร้าง Excel workbook (`template_v4_empty.xlsx`) สำหรับให้ staff กรอกข้อมูลสำรวจ
- แบ่งเป็น 10 sheets ตาม FK order: 1_Site → 2_Building → 3_Floor → 4_Room → 5_Rack → 6_CCTV → 7_NVR → 8_Switch ฯลฯ
- Column order ตรงกับ SQL Schema v2

**สิ่งที่ได้:**
- Staff สามารถกรอกข้อมูลได้ถูก format โดยไม่ต้องรู้เรื่อง database
- Copy-paste เข้า SSMS (Edit Top 200 Rows) ได้เลยทีละ sheet ตาม FK order
- ลด error จากการกรอกผิด column ลงมาก

**ปัญหาที่เจอ:**
- ไม่มีปัญหาหลัก

---

## Phase 4 — SSM Importer (Python) — Retired

**ทำอะไร:**
- เขียน Python script (`ssm_import.py`) อ่าน Excel → validate → import เข้า SQL Server อัตโนมัติ
- รองรับ flags: `--parse-only`, `--dry-run`, `--auth sql/windows`
- แก้ bug 5 จุด (example row หลุด DB, ALIAS ผิด, IP invalid crash, encoding error, device_name NULL)

**สิ่งที่ได้:**
- เรียนรู้ Python file I/O, pyodbc, data validation
- เป็น portfolio piece ที่แสดงทักษะ automation + error handling
- bug fixes ทั้ง 5 จุดนำมาสู่ความเข้าใจ schema ลึกขึ้น

**เหตุผลที่ retire:**
- copy-paste ผ่าน SSMS ทำงานได้เร็วกว่า ไม่มี dependency Python บนเครื่องทำงาน
- script เก็บไว้ใน `scripts/` สำหรับ portfolio

---

## Phase 5 — Mock Data SQL

**ทำอะไร:**
- เขียน SQL script (`database/mock_data.sql`) สร้างข้อมูลตัวอย่างสำหรับทดสอบ API
- ครอบคลุมทุก table: 2 sites, 2 buildings, 2 floors, 2 rooms, 2 racks, 2 switches, 2 NVRs, 3 cameras
- รันใน SSM_DB ที่ทำงานแล้ว

**สิ่งที่ได้:**
- มีข้อมูลครบทุก table พร้อม test API ได้ทันที
- ไม่ต้องรอ staff กรอกข้อมูลจริงก่อนถึงจะทดสอบได้
- ยืนยัน FK relationships ใน schema ว่าถูกต้อง

**ปัญหาที่เจอ:**
- ต้องใส่ข้อมูลตาม FK order ให้ถูก ไม่งั้น constraint error

---

## Phase 6 — Backend API (C#)

**ทำอะไร:**
- สร้าง ASP.NET Web API project บน branch `feature/backend-api`
- 13 Controllers ครอบคลุมทุก table (CRUD: GET/SAVE/UPDATE/DELETE)
- 13 Models ตรง schema
- Bruno collection สำหรับ test API ทุก endpoint
- ทดสอบผ่าน Bruno กับ mock data ครบทุก endpoint

**สิ่งที่ได้:**
- REST API พร้อมใช้งาน — Frontend เชื่อมได้เลย
- HTTP methods ถูกต้องทุก endpoint (GET/POST/PUT/DELETE)
- Bruno collection เป็น documentation + test tool ในตัวเดียว
- Backup ไว้ใน `api/` folder บน work-safe branch

**ปัญหาที่เจอ:**
- HTTP methods บาง endpoint ใช้ผิด (เช่น ใช้ GET แทน POST) → แก้ไขแล้วทั้งหมด

---

## Phase 7 — SSM Web App (Frontend) 🔥

**ทำอะไรไปแล้ว (2026-05-22):**
- กำหนด MVP scope: Login + Dashboard + Device detail + polling 30s
- กำหนด role matrix: Admin / User / Guest พร้อม access level แต่ละชั้น
- กำหนด sitemap: 12 pages พร้อม route
- ตัดสินใจ stack: React Flow, Konva.js, Recharts, Axios
- สร้าง FRONTEND_PLAN.md, WIREFRAME_BRIEF.md, RACK_POSITION.md
- ส่ง FRONTEND_PLAN + RACK_POSITION ให้ Engineering Reviewer
- สร้าง wireframes ผ่าน Claude Design: 5/12 หน้า

**สิ่งที่ได้:**
- Frontend spec ชัดเจน พร้อม implement
- Wireframes draft 5 หน้า (Home Topology approved, Floor Plan + Rack Detail draft)
- Reviewer feedback กำลังรอ

**สถานะ:** 🔥 In Progress — รอ reviewer feedback + wireframes ครบ → เริ่ม React

---

## ความเห็น / Feedback จาก Reviewer

> *กรุณาเพิ่มความเห็นที่นี่*

| Phase | ความเห็น | วันที่ |
|---|---|---|
| | | |
