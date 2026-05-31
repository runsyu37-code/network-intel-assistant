# NEXT — สิ่งที่จะทำต่อ (เขียนก่อน /clear)

> เขียน: 2026-05-31 (session 4) | branch: frontend (FE) + backend (BE)

---

## สิ่งที่ทำเสร็จใน session นี้

| งาน | สถานะ |
|---|---|
| Commit frontend session 3 (AuditPage, SitesCrudPage, P1 fix) | ✅ `52fb05d` |
| PATCH /api/buildings/{id}/coordinates — BE endpoint ใหม่ | ✅ `106580a` |
| mock_data.sql — rewrite 4 buildings + 12 cameras + position_x/y | ✅ seed สำเร็จ |
| MOCK_DATA_GUIDE.md — คู่มือ clean + seed | ✅ |
| migration_add_camera_position.sql | ✅ รันบน SSMS แล้ว |
| Web.config fixes (home PC) | ✅ ดูรายละเอียดใน SESSION_2026-05-31.md |
| Reset admin / ssm_user password ด้วย bcrypt hash ใหม่ | ✅ |
| Login เข้าได้แล้ว | ✅ |

---

## งานที่ต้องทำต่อ (ทำได้เลย)

### 1. ทดสอบทุก page (ทำก่อนอื่น)

รัน frontend: `npm run dev` → `http://localhost:3000`
รัน backend: เปิด `C:\1_Work_Local\backend-latest\BNO_Survei_MonitorAPI\BNO_Survei_MonitorAPI.slnx` → Ctrl+F5

| หน้า | สิ่งที่ต้องเห็น |
|---|---|
| Dashboard | device counts ครบ |
| Topology | S001 node แสดง |
| Building Map | markers 4 จุดบน map |
| Sites → B001 | 4 floors |
| Floor a-f1 | กล้อง 2 ตัวบน floor plan |
| Audit | กล้อง 12 ตัว online 9 / warning 1 / offline 2 |

### 2. Fix — error message หายเร็วใน LoginPage

ข้อความแจ้งเตือนแดงหายเร็วเกินไป — ดูใน `src/pages/LoginPage.tsx`
น่าจะเป็น notification duration หรือ setTimeout สั้นเกิน

### 3. Backend ที่ยังค้าง (รอทีม BE)

| งาน | Priority |
|---|---|
| `last_seen` ใน GET /api/cameras | ✅ มีแล้ว |
| `lat/lng` ใน GET /api/buildings | ✅ มีแล้ว |
| `PATCH /api/buildings/{id}/coordinates` | ✅ เพิ่งทำ |
| `position_x/y` ใน GET /api/cameras | ✅ มีแล้ว |
| CRUD mutations ทุกหน้า | 🟠 รอ API contract ก่อน |
| EF Core migrations | ❌ ไม่ทำ — .NET Framework 4.8 ไม่รองรับ |
| PingService | 🟡 |

---

## Context สำคัญ

### Backend (home PC)
- Project: `C:\1_Work_Local\backend-latest\BNO_Survei_MonitorAPI\BNO_Survei_MonitorAPI.slnx`
- Port: **50680**
- DB: `DESKTOP-OAVDR88\SQLEXPRESS` → `SSM_DB`
- Login: `admin` / `Admin@SSM1` | `ssm_user` / `User@SSM1`
- Web.config: gitignored — อยู่แค่ใน home PC นี้

### Frontend
- Project: `C:\1_Work_Local\AI_Agent\network-intel-assistant`
- Branch: `frontend`
- Port: 3000

### DB mock data
- ล้างด้วย: `db/MOCK_DATA_GUIDE.md` (TRUNCATE script)
- Seed ด้วย: `db/mock_data.sql`

---

## ไฟล์สำคัญที่ต้องโหลดหลัง /clear

```
DEV.md                                               ← status + Phase Gates
NEXT.md                                              ← ไฟล์นี้
C:\1_Work_Local\backend-latest\docs\sessions\SESSION_2026-05-31.md  ← backend session log
db/MOCK_DATA_GUIDE.md                                ← วิธี clean + seed DB
docs/sessions/CROSSMACHINE_FIX_2026-05-28.md         ← แก้ Web.config ถ้าเกิดปัญหา
```

---

*ก่อน /clear: บอก Claude ให้โหลด NEXT.md + DEV.md ก่อนเสมอ*
