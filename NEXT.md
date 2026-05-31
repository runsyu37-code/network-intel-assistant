# NEXT — สิ่งที่จะทำต่อ (เขียนก่อน /clear)

> เขียน: 2026-05-31 (session 2) | ต่อจาก session นี้

---

## สถานะตอนนี้

| งาน | สถานะ |
|---|---|
| ROADMAP_V2 + FIXES_AND_ADDITIONS + Audit Checklist | ✅ เขียนแล้ว (Opus review) |
| F9 naming convention (FE_/BE_) + PROTOCOL.md | ✅ ทั้ง 2 branches |
| Phase Gates + Active This Week ใน DEV.md | ✅ |
| P5 (position_x/y) — localStorage crutch ลบแล้ว | ✅ |
| P6 (topology migration) — รันบน SSMS แล้ว | ✅ |

---

## งานที่ยังค้าง

### BE (รอ backend ทำ)
- **R17** — กรอก `lat/lng` ใน DB ให้แต่ละ building (ต้องมีพิกัดจริง)
- **last_seen** — เพิ่ม field ใน `GET /api/cameras` response + contract ก่อน

### FE (ทำได้เลย ไม่รอใคร)
- **Audit View** — flat table ทุกกล้อง + online/offline count + offline filter + export CSV
- **P1** — fix camera icon กับ status light ไม่ align (`FloorPlanPage.tsx` + `floor.css`)
- **P2** — wire CRUD จริง (เริ่มจาก shared mutation layer ก่อน — อย่าเขียนซ้ำ)

---

## ไฟล์สำคัญที่ต้องโหลดหลัง /clear

```
DEV.md                          ← status + Phase Gates
docs/plan/ROADMAP_V2.md         ← แผน 3 phases + build order
docs/FIXES_AND_ADDITIONS.md     ← master list ทุก fix
F9/AUDIT_CHECKLIST.md           ← งานสัปดาห์นี้
```

---

*ก่อน /clear: บอก Claude ให้โหลด NEXT.md + DEV.md ก่อนเสมอ*
