# NEXT — สิ่งที่จะทำต่อ (เขียนก่อน /clear)

> เขียน: 2026-06-01 (session 6) | branch: frontend

---

## สิ่งที่ทำเสร็จวันนี้ (session 6)

| งาน | รายละเอียด |
|---|---|
| Merge Sites pages | TopologyPage + SitesCrudPage → SitesOverviewPage (3-mode: Topology/List/Grid) |
| Sites navigation | คลิก site → Building Map ซูม site นั้น |
| Sidebar restructure | Building Map ย้ายเป็น sub-item ใต้ Sites (chevron พับ/กาง) |
| Building Map upgrade | Coordinate input, Save View, Reset, Create mode (click-to-add), List view |
| Auto Building ID | generate `B` + base36 timestamp ไม่ต้องกรอกเอง |
| Topology Save View | บันทึก ReactFlow viewport ลง localStorage |
| Add Site ตลอด | ปุ่ม Add Site อยู่ header ทุก viewMode ไม่ต้องกด Edit |

รายละเอียด → `docs/sessions/SESSION_2026-06-01_FE.md`

---

## งานที่ต้องทำต่อ

### ทำจากเครื่องนี้ได้ (FE)

| งาน | รายละเอียด |
|---|---|
| Racks CRUD | wire mutation — pattern เหมือน Cameras/NVRs |
| Fix Rack Detail | "Loading rack data…" เมื่อ navigate โดยตรง |
| Fix Racks sidebar badge | แสดง 6 แต่ list โชว์ 4 |

### ต้องรอ BE หรืออยู่หน้าเครื่อง

| งาน | ต้องการ |
|---|---|
| `last_seen` ใน `GET /api/cameras` | BE → gate AuditPage |
| `lat/lng` writable ผ่าน PATCH | BE → gate Building Map markers |
| Import ข้อมูลจริง | Work NB + VLAN |
| PingService + Hardware test | กล้อง + PoE switch + VM always-on |

---

## Context สำคัญ

### Backend (home PC)
- Project: `C:\1_Work_Local\backend-latest\BNO_Survei_MonitorAPI\BNO_Survei_MonitorAPI.slnx`
- Port: **50680** | DB: `DESKTOP-OAVDR88\SQLEXPRESS` → `SSM_DB`
- Login: `admin` / `Admin@SSM1` | `ssm_user` / `User@SSM1`

### Frontend
- Project: `C:\1_Work_Local\AI_Agent\network-intel-assistant`
- Branch: `frontend` | Port: 3000

---

## ไฟล์ที่ต้องโหลดหลัง /clear

```
NEXT.md                                     ← ไฟล์นี้
DEV.md                                      ← phase gates
docs/sessions/SESSION_2026-06-01_FE.md     ← session log วันนี้
```

---

*ก่อน /clear: บอก Claude ให้โหลด NEXT.md + DEV.md ก่อนเสมอ*
