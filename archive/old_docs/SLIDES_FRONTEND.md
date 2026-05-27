# SSM Frontend — Weekly Progress Slides
> สัปดาห์: 2026-05-26 → 2026-05-27 | Presenter: Ran

---

## SLIDE 1 — Overview: SSM คืออะไร

**Surveillance Smart-Monitor (SSM)**
ระบบจัดการและติดตามอุปกรณ์กล้องวงจรปิดแบบรวมศูนย์

- ดูสถานะกล้อง, NVR, PoE Switch แบบ real-time
- ดู floor plan + ตำแหน่งติดตั้งกล้องแต่ละตัว
- บริหาร user, ดู alert, ดู ping history
- รองรับหลาย site / building / floor

**Stack:** React 18 + TypeScript + Ant Design 5 + TanStack Query

---

## SLIDE 2 — สิ่งที่สร้างเสร็จอาทิตย์นี้: 14 หน้า

| หน้า | Route | คุณสมบัติเด่น |
|---|---|---|
| Login | `/login` | JWT auth, Demo mode fallback |
| Topology | `/dashboard/topology` | Network graph, live stats |
| Sites | `/dashboard/sites/:id` | Building cards + SVG site map |
| Building | `/dashboard/buildings/:id` | Isometric cross-section 3D |
| Floor Plan | `/dashboard/floors/:id` | SVG overlay, drag camera, zoom |
| Racks List | `/dashboard/racks` | จัดกลุ่มตาม site |
| Rack Detail | `/dashboard/racks/:id` | แผนผัง 42U rack |
| Cameras | `/dashboard/cameras` | Table + status, 30s polling |
| Camera Detail | `/dashboard/cameras/:id` | Ping chart + uptime calendar |
| NVRs | `/dashboard/nvrs` | Table + channel usage |
| NVR Detail | `/dashboard/nvrs/:id` | Per-channel bar chart |
| PoE Switches | `/dashboard/switches` | Table + PoE budget |
| Switch Detail | `/dashboard/switches/:id` | Port map grid |
| Users | `/dashboard/users` | Role-based (admin only) |

---

## SLIDE 3 — UI: Login Page

**สิ่งที่เห็นในหน้า Login:**
- Two-panel layout — ซ้าย: brand + feature overview, ขวา: login form
- Logo Buono Thailand พร้อม feature cards 4 ใบ
- JWT authentication — เชื่อม backend จริง
- Error handling: 401 (wrong password), 429 (rate limit), network error
- Demo Mode: ถ้า backend offline → เข้าได้อัตโนมัติ (สำหรับ demo)

---

## SLIDE 4 — UI: Topology & Dashboard

**Network Topology Page:**
- React Flow — แสดง node HQ → Sites → Buildings แบบ graph
- Stat cards แบบ live: กล้องออนไลน์, NVR, Switch, อุปกรณ์รวม
- Recent Events table — ดึง alert logs จริงจาก backend
- 30-second auto-refresh

**ข้อมูลจริงจาก API:**
```
GET /api/dashboard/summary  →  ยอดรวมแต่ละ site
GET /api/alert-logs         →  เหตุการณ์ล่าสุด
```

---

## SLIDE 5 — UI: Floor Plan

**Floor Plan Page:**
- SVG 2D floor plan พร้อม camera overlay แต่ละจุด
- **Edit Mode:** ลาก-วางกล้องตำแหน่งใหม่ได้จริง (drag & drop)
- **Zoom:** scroll wheel / ปุ่ม / keyboard `+` `-` `0`
- คลิกกล้อง → ไป Camera Detail page
- บันทึกตำแหน่งผ่าน `PATCH /api/cameras/{id}/position`

---

## SLIDE 6 — UI: Device Pages

**Cameras / NVRs / PoE Switches (List):**
- ดึงข้อมูลจาก backend จริง, polling ทุก 30 วินาที
- Status badge: 🟢 Online / 🟡 Warning / 🔴 Offline
- กรอง, ค้นหา, เรียงลำดับได้

**Camera Detail:**
- Line chart ping history (48 จุดล่าสุด)
- Uptime calendar รายเดือน (30 วัน)
- ข้อมูล: IP, MAC, NVR channel, firmware, location

---

## SLIDE 7 — API Integration

**6 หน้าเชื่อม backend จริงแล้ว:**

| หน้า | Endpoint |
|---|---|
| Login | `POST /api/auth/login` |
| Topology | `GET /api/dashboard/summary` + `/alert-logs` |
| Cameras | `GET /api/cameras` + `/ping-logs` |
| NVRs | `GET /api/nvrs` |
| PoE Switches | `GET /api/poe-switches` |
| Users | `GET /api/users` |

**Authentication:**
- JWT token เก็บใน localStorage
- ทุก request แนบ `Authorization: Bearer <token>` อัตโนมัติ
- Role-based: admin เห็น Users, ping logs, alert logs

---

## SLIDE 8 — Technical: Architecture

```
Browser (React)
    │
    │  /api/*  (same origin — no CORS issue)
    ▼
Vite Dev Server :3000
    │
    │  proxy forward
    ▼
Backend API :50680
(ASP.NET Web API)
    │
    ▼
SQL Server (SSM_DB)
```

**ทำไมใช้ Vite Proxy:**
- Browser ส่ง request ไป same origin (port 3000) → ไม่ติด CORS
- Vite forward ต่อไปหา backend port 50680 อัตโนมัติ
- ไม่ต้องแก้ backend CORS config ในช่วง dev

---

## SLIDE 9 — Dark Mode + Responsive

- รองรับ Light / Dark mode ทุกหน้า
- Theme persist ใน localStorage — เปิดใหม่ยังจำ
- Keyboard shortcuts: `Esc` back, `+/-/0` zoom (Floor Plan)
- Breadcrumb navigation ครบทุกหน้า

---

## SLIDE 10 — สัปดาห์หน้า: งานที่เหลือ

**Open Design (รอ Gemini):**
- 6 หน้า redesign — Topology, Sites, NVR Detail, Switch Detail, Floor Plan, Users

**API Connection (พร้อมทำทันทีที่ต้องการ):**
- Sites, Buildings, Floors → ดึงโครงสร้าง hierarchy จริง
- Floor Plan → โหลด floor plan image จาก backend (base64)
- NVR Detail, Switch Detail → ดึงข้อมูลรายอุปกรณ์

**Polish:**
- Alert count จริงจาก API (ปัจจุบัน mock)
- User management: Edit / Deactivate จริง

---

## SLIDE 11 — Demo

**เข้าใช้งาน:** http://localhost:3000  
**Login:** `admin_test` / `Test@1234`  
*(หรือใส่อะไรก็ได้ถ้า backend offline → Demo Mode)*
