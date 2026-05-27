# SSM Network Monitor — Weekly Progress
### สัปดาห์ 2026-05-27 | ทีม: Ran (Backend) + Claude (Frontend)

---

## Slide 1 — ระบบที่สร้างคืออะไร

**SSM — Surveillance Smart-Monitor**  
ระบบติดตามกล้องวงจรปิดและอุปกรณ์เครือข่ายแบบ Real-time สำหรับองค์กร

**ครอบคลุม:**
- ติดตามสถานะกล้อง / NVR / PoE Switch แบบ real-time
- ดูผังพื้น + ตำแหน่งกล้องแต่ละตัวบน floor plan
- บริหาร user ตาม role (Admin / User / Viewer)
- รองรับหลาย site / building / floor

**สถานะสัปดาห์นี้:** Backend ✅ 100% · Frontend ✅ เชื่อมต่อแล้ว · Demo พร้อม

---

## Slide 2 — ภาพรวมระบบ

```
┌─────────────────────┐      ┌──────────────────────┐      ┌──────────────┐
│   Frontend (React)  │      │  Backend (ASP.NET API)│      │  SQL Server  │
│   localhost:3000    │ ───► │   localhost:50680     │ ───► │   SSM_DB     │
│                     │      │                       │      │              │
│  Login Page         │      │  /api/auth/login      │      │  users       │
│  Topology Dashboard │      │  /api/dashboard/      │      │  cameras     │
│  Floor Plan         │      │  /api/cameras         │      │  nvrs        │
│  Camera / NVR /     │      │  /api/floor-plans     │      │  ping_logs   │
│  Switch Detail      │      │  /api/ping-logs       │      │  alert_logs  │
└─────────────────────┘      └──────────────────────┘      └──────────────┘
         │
         │ Vite Proxy (dev)
         └── /api/* → forward → :50680 อัตโนมัติ (ไม่ติด CORS)
```

---

## Slide 3 — Backend: สิ่งที่ทำสำเร็จอาทิตย์นี้

| Phase | งานที่ทำ | ผลลัพธ์ |
|---|---|---|
| 7–8 | JWT Auth + BCrypt + CORS | Login ปลอดภัย พร้อมใช้งาน |
| 9 | Rate Limiting (10 ครั้ง/5 นาที → ล็อค 15 นาที) | ป้องกัน Brute Force |
| 10 | RBAC ครบทุก Endpoint | **17/17 Tests PASS** |
| 11 | Dashboard API + Frontend Connect | ระบบ live แล้ว |

---

## Slide 4 — Backend: ความปลอดภัย

✅ **JWT Authentication** — token หมดอายุ 8 ชั่วโมง  
✅ **BCrypt Password Hashing** — รหัสผ่านไม่เก็บ plain text  
✅ **Rate Limiting** — ป้องกัน brute force login  
✅ **RBAC ทุก Endpoint** — ทั้ง GET และ POST/DELETE  
✅ **Error Sanitization** — ไม่ leak stack trace หรือ SQL error  
✅ **JWT Secret Rotation** — เปลี่ยน secret แล้ว token เก่าใช้ไม่ได้  
✅ **Secrets ไม่อยู่ใน Git** — Web.config อยู่แค่ local  

---

## Slide 5 — Backend: ระบบสิทธิ์ (RBAC)

| Role | คือใคร | เข้าถึงได้ |
|---|---|---|
| **Admin** | IT Support | ทุกอย่าง + แก้ไข/ลบได้ |
| **User** | เจ้าหน้าที่ | Site / Building / Floor / Room / Rack |
| **Viewer** | ผู้บริหาร | Site / Building / Floor / ผังพื้น |

**บังคับ server-side ทุก endpoint — ไม่สามารถ bypass ได้จาก frontend**

---

## Slide 6 — Backend: API พร้อมใช้งานทั้งหมด

**ทุก Role:**
`/api/sites` · `/api/buildings` · `/api/floors` · `/api/floor-plans` · `/api/hierarchy/tree`

**Admin + User:**
`/api/rooms` · `/api/racks`

**Admin เท่านั้น:**
`/api/cameras` · `/api/nvrs` · `/api/poe-switches`  
`/api/alert-logs` · `/api/ping-logs` · `/api/users`  
`/api/dashboard/summary` ← **ใหม่สัปดาห์นี้**

---

## Slide 7 — Frontend: 14 หน้าที่สร้างเสร็จ

| หน้า | คุณสมบัติเด่น | API |
|---|---|---|
| Login | JWT auth, error handling, Demo mode | ✅ Live |
| Topology | Network graph, live stats, alert events | ✅ Live |
| Sites | Building cards + SVG site map | mock |
| Building | Isometric 3D cross-section | mock |
| Floor Plan | SVG overlay + drag camera + zoom | ✅ Partial |
| Racks List | จัดกลุ่มตาม site | mock |
| Rack Detail | แผนผัง 42U rack | mock |
| Cameras | Table + status badge | ✅ Live |
| Camera Detail | Ping chart + uptime calendar | ✅ Live |
| NVRs | Channel usage | ✅ Live |
| NVR Detail | Per-channel bar chart | mock |
| PoE Switches | PoE budget display | ✅ Live |
| Switch Detail | Port map grid | mock |
| Users | Role-based view (admin only) | ✅ Live |

---

## Slide 8 — Frontend: หน้า Login + Topology

**Login Page**
- Two-panel: brand left · form right
- Logo Buono Thailand + feature overview
- Error: 401 wrong password / 429 rate limited / network offline
- ถ้า backend offline → Demo Mode (เข้าได้อัตโนมัติ)

**Topology Dashboard**
- React Flow graph: HQ → Sites → Buildings
- Stat cards live: กล้องออนไลน์, NVR, Switch, อุปกรณ์รวม
- Recent Events table จาก alert logs จริง
- Auto-refresh ทุก 30 วินาที

---

## Slide 9 — Frontend: Floor Plan

```
Admin เปิด Edit Mode
        │
        ├── ลาก camera icon ไปตำแหน่งใหม่
        │
        ▼
PATCH /api/cameras/{id}/position
{ position_x: 0.42, position_y: 0.67 }  ← relative 0.0-1.0
        │
        ▼
บันทึกใน DB → ทุกคนเห็นตำแหน่งเดียวกัน
```

**Features:**
- Zoom: scroll wheel / ปุ่ม / keyboard `+` `-` `0`
- คลิกกล้อง → Camera Detail page
- ผัง SVG หรือรูปภาพจริงจาก backend (base64)

---

## Slide 10 — Frontend: Camera Detail

**ข้อมูลที่แสดง:**
- IP address, MAC, NVR channel, firmware version, install location
- Ping history chart — 48 จุดล่าสุด (line area chart)
- Uptime calendar — 30 วัน (สีตาม % uptime)
- Jitter (ความไม่เสถียรของ ping)

**Role guard:** ping logs เป็น admin only  
→ ถ้า Viewer/User เข้าดู → แสดง estimated data แทน (fallback)

---

## Slide 11 — Integration: เชื่อมต่อแล้ว

**Frontend เรียก API จริงแล้ว 9 endpoints:**

```
Login          POST /api/auth/login         → JWT token
Dashboard      GET  /api/dashboard/summary  → live stats
Alert events   GET  /api/alert-logs         → recent events
Cameras list   GET  /api/cameras            → 30s polling
Camera pings   GET  /api/ping-logs          → admin only
NVRs list      GET  /api/nvrs               → 30s polling
Switches list  GET  /api/poe-switches       → 30s polling
Users list     GET  /api/users              → admin only
Save position  PATCH /api/cameras/{id}/position
```

---

## Slide 12 — Timeline สัปดาห์นี้

```
จันทร์ 26/05   ── สร้าง 14 หน้า Frontend ครบ (mock data)
               ── เริ่ม API integration

อังคาร 27/05   ── Backend Phase 10-11 เสร็จ (RBAC + Dashboard API)
               ── Frontend เชื่อม API จริง 9 endpoints
               ── แก้ CORS ด้วย Vite proxy
               ── Login live: admin_test / Test@1234

วันนี้         ── Demo พร้อม ✅
```

---

## Slide 13 — Demo

**เปิดที่:** http://localhost:3000

| Login | เห็นอะไร |
|---|---|
| `admin_test / Test@1234` | ทุกหน้า + กล้อง + ping logs |
| `user_test / ...` | Site / Building / Floor / Room / Rack |
| `viewer_test / ...` | Site / Building / Floor / ผังพื้น |

**Demo flow:**
1. Login → เห็น Topology dashboard (live camera count)
2. Cameras → ดูสถานะ real-time
3. กล้องตัวใดตัวหนึ่ง → Camera Detail (ping chart)
4. Floor Plan → เห็นกล้องบนผัง / ลองลาก (Edit mode)
5. Login ใหม่เป็น viewer → ดูว่าเห็นน้อยลง

---

## Slide 14 — งานที่เหลือ (สัปดาห์หน้า)

**Frontend:**

| งาน | รายละเอียด |
|---|---|
| Open Design | 6 หน้า redesign จาก Gemini (Topology, Sites, NVR, Switch, Floor, Users) |
| API Pages | Sites, Buildings, Floors, Racks — ดึงข้อมูลจริง |
| Alert count live | Topbar badge จาก `/api/alert-logs` จริง |

**Backend:**

| งาน | Priority |
|---|---|
| RequireRole refactor | Medium |
| Per-username rate limiting | Medium |
| Webhook delivery for alerts | Low |
| Pagination (500+ rows) | Low |

---

*SSM Network Monitor · 2026-05-27 · Backend: Ran · Frontend: Claude*
