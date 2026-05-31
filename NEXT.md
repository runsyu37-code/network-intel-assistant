# NEXT — สิ่งที่จะทำต่อ (เขียนก่อน /clear)

> เขียน: 2026-05-31 (session 5) | branch: frontend (FE) + backend (BE)

---

## สิ่งที่ทำเสร็จใน session นี้

| งาน | สถานะ |
|---|---|
| ทดสอบทุก page (10 routes + 4 detail pages) — ไม่มี JS error | ✅ |
| ตรวจ `last_seen` ใน `GET /api/cameras` BE | ✅ มีอยู่แล้วตั้งแต่ F9 |
| ตรวจ PingService — code ครบ, Start() ถูก call ใน Global.asax | ✅ |
| Discord webhook URL → ใส่ใน Web.config + ทดสอบยิงได้ | ✅ `791c908` (BE gitignored) |
| Fix LoginPage: error message หายเร็ว | ✅ `791c908` |
| &emsp;root cause: 401 interceptor redirect แม้แต่ login endpoint เอง | fixed `client.ts` |
| &emsp;root cause: dev fallback auto-login เมื่อ backend ไม่ตอบ | removed `LoginPage.tsx` |

---

## งานที่ต้องทำต่อ (ทำได้แค่หน้าเครื่อง/VLAN — ก่อน 7 มิ.ย.)

> ตาม `JAPAN_TRIP_PLAN_2026-06.md` — deadline demo 1 ก.ค. 2026

### 1. Import ข้อมูลจริงเข้า DB (work NB)

```
C:\ai-playground\network-intel-assistant\FOR_WORK_NB\
- template_v4.xlsx  ← กรอกข้อมูลจริง
- ssm_import.py     ← รัน import
- START_HERE.md     ← คู่มือ
```

### 2. Hardware test Phase 3 (ต้องมีฮาร์ดแวร์ + VLAN)

- baseline: เสียบกล้อง → FE แสดงเขียว, Discord เงียบ
- failure: ถอดสาย → FE แดง → Discord ยิง 1 ครั้ง ไม่ซ้ำ

### 3. PingService บน VM/เครื่อง always-on

- ต้องรันบนเครื่องที่อยู่ใน VLAN ตลอด (ไม่ใช่ laptop)
- ดู `C:\1_Work_Local\backend-latest\docs\PING_SERVICE_NOTES.md`

---

## ที่พบระหว่างทดสอบ (ไม่ใช่ bug critical)

| หน้า | สิ่งที่พบ |
|---|---|
| Racks sidebar badge = 6 | แต่ list แสดง 4 rack ใน site — มี rack ที่ไม่มี site ใน DB |
| Building Map | ไม่มี markers — expected เพราะ lat/lng = null ใน DB |
| กล้องทุกตัว Offline | expected — PingService ยัง ping ไม่ถึง VLAN กล้อง |
| Rack Detail loading | ID format อาจไม่ตรง — ลอง click จาก Racks list แทน |

---

## Context สำคัญ

### Backend (home PC)
- Project: `C:\1_Work_Local\backend-latest\BNO_Survei_MonitorAPI\BNO_Survei_MonitorAPI.slnx`
- Port: **50680** | DB: `DESKTOP-OAVDR88\SQLEXPRESS` → `SSM_DB`
- Login: `admin` / `Admin@SSM1` | `ssm_user` / `User@SSM1`
- Web.config: gitignored — Discord webhook URL ใส่แล้วในเครื่องนี้

### Frontend
- Project: `C:\1_Work_Local\AI_Agent\network-intel-assistant`
- Branch: `frontend` | Port: 3000

---

## ไฟล์สำคัญที่ต้องโหลดหลัง /clear

```
DEV.md                                    ← status + Phase Gates
NEXT.md                                   ← ไฟล์นี้
JAPAN_TRIP_PLAN_2026-06.md               ← แผนก่อน/ระหว่าง/หลังทริปญี่ปุ่น
C:\1_Work_Local\backend-latest\docs\sessions\F9_SESSION_2026-05-30.md
```

---

*ก่อน /clear: บอก Claude ให้โหลด NEXT.md + DEV.md ก่อนเสมอ*
