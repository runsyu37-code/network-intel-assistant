# NEXT — สิ่งที่จะทำต่อ (เขียนก่อน /clear)

> เขียน: 2026-05-31 (session 5 — ปิดวัน) | branch: frontend

---

## สิ่งที่ทำเสร็จวันนี้ (session 5)

| งาน | Commit |
|---|---|
| ทดสอบทุก page — ผ่านหมด ไม่มี JS error | — |
| Fix LoginPage: error หาย + ลบ dev fallback | `791c908` / `be1114e` |
| Satellite default + per-site map + ปุ่ม Satellite ใน Site detail | `63f835b` |
| Building pin coordinates บน satellite map | `efbfd53` |
| CRUD ทุก layer wired → real API (server-driven) | `ad03a51` |

รายละเอียดทั้งหมด + ปัญหาที่เจอ → `docs/sessions/SESSION_2026-05-31_FE.md`

---

## งานที่ต้องทำต่อ

### ทำจากเครื่องนี้ได้ (FE)

| งาน | รายละเอียด |
|---|---|
| Racks CRUD | ยังไม่ได้ wire — pattern เหมือน Cameras/NVRs |
| Fix Rack Detail | "Loading rack data..." เมื่อ navigate โดยตรง — ลอง click จาก Racks list ก่อน |
| Fix Racks sidebar badge | แสดง 6 แต่ list โชว์ 4 — มี rack ในDB ที่ไม่มี site ตรงกัน |

### ต้องอยู่หน้าเครื่อง/VLAN (ก่อน 7 มิ.ย. ตาม JAPAN_TRIP_PLAN)

| งาน | ต้องการ |
|---|---|
| Import ข้อมูลจริงเข้า DB | Work NB + ข้อมูลจริง |
| PingService บน VM always-on | เครื่องที่อยู่ VLAN ตลอด |
| Hardware test Phase 3 | กล้อง + PoE switch + VLAN |

---

## Context สำคัญ

### Backend (home PC)
- Project: `C:\1_Work_Local\backend-latest\BNO_Survei_MonitorAPI\BNO_Survei_MonitorAPI.slnx`
- Port: **50680** | DB: `DESKTOP-OAVDR88\SQLEXPRESS` → `SSM_DB`
- Login: `admin` / `Admin@SSM1` | `ssm_user` / `User@SSM1`
- `Web.config`: Discord webhook URL ใส่แล้ว (gitignored)

### Frontend
- Project: `C:\1_Work_Local\AI_Agent\network-intel-assistant`
- Branch: `frontend` | Port: 3000

---

## ไฟล์ที่ต้องโหลดหลัง /clear

```
NEXT.md                                          ← ไฟล์นี้
DEV.md                                           ← phase gates
JAPAN_TRIP_PLAN_2026-06.md                      ← deadline 1 ก.ค. + แผนทริป
docs/sessions/SESSION_2026-05-31_FE.md          ← session log วันนี้
```

---

*ก่อน /clear: บอก Claude ให้โหลด NEXT.md + DEV.md ก่อนเสมอ*
