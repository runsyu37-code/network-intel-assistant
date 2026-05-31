# NEXT — สิ่งที่จะทำต่อ (เขียนก่อน /clear)

> เขียน: 2026-05-31 (session 3) | ต่อจาก session นี้

---

## สิ่งที่ทำเสร็จใน session นี้

| งาน | สถานะ |
|---|---|
| AuditPage.tsx — flat table ทุกกล้อง + counts + filter + export CSV | ✅ |
| Wire SitesCrudPage GET ไป real API (getSites + getDashboardSummary) | ✅ |
| Sidebar + Route `/dashboard/audit` | ✅ |
| P1 — fix FOV cone ไม่ align กับ cam-icon (ย้าย .fov เข้าใน .cam-icon) | ✅ |
| DEV.md Active This Week — จด backend tasks ครบ | ✅ |
| ติดตั้ง skills: debug-mantra, post-mortem, scrutinize, management-talk, run-ssm | ✅ |

---

## งานที่เหลือ

### Backend (ทำต่อ — เปลี่ยน branch)

> branch: `backend` | project: `C:\ai-playground\API\BNO_Survei_MonitorAPI\`

| # | งาน | endpoint | Priority |
|---|---|---|---|
| 1 | **`last_seen`** → เพิ่มใน SELECT ของ `GET /api/cameras` | CamerasController | 🔴 CRITICAL |
| 2 | **`lat`/`lng`** → ยืนยัน `GET /api/buildings` return ครบ | BuildingsController | 🔴 CRITICAL |
| 3 | **`PATCH /api/buildings/{id}`** — รับ lat/lng | BuildingsController | 🔴 CRITICAL |
| 4 | **Rack schema** — `u_height`/`u_size` per device, ยืนยัน `max_u`, overlap rejection (409), lock U numbering | multiple | 🟠 gate rack UI |
| 5 | **EF Core migrations** — หยุด ALTER TABLE มือ | project setup | 🟠 |
| 6 | **Server-side RBAC** ทุก mutating endpoint | all controllers | 🟠 |
| 7 | **PingService** — concurrent, heartbeat, supervised service, ping by IP | PingService | 🟡 |

### Frontend (รอ BE ก่อน)

| รอ | งาน |
|---|---|
| BE ส่ง `last_seen` | แสดง "checked X min ago" + stale flag (amber) ใน AuditPage + CamerasPage |
| BE ส่ง `lat`/`lng` ครบ | Building Map markers แสดงได้ |
| BE มี PATCH /buildings/{id} | Coordinate-entry UI ใน BuildingDetailPage |
| BE มี CRUD endpoints | Wire Add/Edit/Delete buttons ใน Sites, Buildings, Cameras ฯลฯ |
| Rack schema ครบ | Rack U-position UI |

---

## ไฟล์สำคัญที่ต้องโหลดหลัง /clear

```
DEV.md                          ← status + Phase Gates + Active This Week
docs/FIXES_AND_ADDITIONS.md     ← รายละเอียดทุก fix + rationale
F9/AUDIT_CHECKLIST.md           ← audit readiness checklist
F9/BE_SPEC_api-reference.md     ← backend API spec ทุก endpoint
```

---

## Context ที่ต้องรู้ก่อนเริ่ม backend

- Backend project: `C:\ai-playground\API\BNO_Survei_MonitorAPI\BNO_Survei_MonitorAPI.slnx`
- Port: **50680** (IIS Express)
- DB: SQL Server — `SSM_DB`
- branch git: `backend`
- Models namespace: `BNO_Survei_Monitor.Models`
- Test accounts: `admin` / `Admin@SSM1` | `ssm_user` / `User@SSM1`
- Frontend proxy: `localhost:3000` → `/api/*` → `localhost:50680`

---

*ก่อน /clear: บอก Claude ให้โหลด NEXT.md + DEV.md ก่อนเสมอ*
