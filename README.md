# SSM — Surveillance Smart-Monitor

ระบบติดตามกล้องวงจรปิดและอุปกรณ์เครือข่ายแบบ Real-time  
Full-stack: React SPA (Frontend) + ASP.NET Core API (Backend)

---

## อ่านก่อนเริ่มทำงาน

| ต้องการอะไร | ไปที่ |
|---|---|
| บริบทโปรเจกต์ + rules ทั้งหมด | [`CLAUDE.md`](CLAUDE.md) |
| งานที่ค้างอยู่ + API notes | [`BACKLOG.md`](BACKLOG.md) |
| Presentation slides | [`presentation_F/SLIDES_FINAL.md`](presentation_F/SLIDES_FINAL.md) |

---

## สถานะโปรเจกต์

> อัปเดต: **2026-05-27** · Deadline: **2026-05-29 (พฤหัส)**  
> Branch หลัก: `frontend`

| ส่วน | สถานะ |
|---|---|
| Backend API (ASP.NET Core) | ✅ เสร็จ — JWT, RBAC, 17+ endpoints |
| Dashboard overview | ✅ stat cards + alerts + offline devices + per-site table |
| CRUD Sites / Cameras / NVRs / Switches / Users | ✅ Add / Edit / Delete modal ครบทุกหน้า |
| Frontend pages ทั้งหมด | ✅ 15 หน้า — ดูตารางด้านล่าง |
| Open design mockups | ✅ ทุก HTML mockup implement เสร็จแล้ว |
| UX — Back navigation | ✅ Camera/Rack/NVR/Switch detail ทุกหน้ามีปุ่ม ← back |
| UX — Floor plan side panel | ✅ คลิกกล้อง → แสดง IP/model/status + Open Detail |
| UX — Topology legend panel | ✅ left panel + hide offline toggle |
| เชื่อม API จริงทุกหน้า | 🟡 Camera Detail ใช้ API — หน้าอื่นใช้ mock data |

---

## Quick Start

### Frontend

```powershell
cd C:\ai-playground\Frontend
npm install
npm run dev
# → http://localhost:3001
```

### Backend (ต้องเปิดถ้าจะดูข้อมูลจริงใน Camera Detail)

```powershell
cd C:\ai-playground\Frontend\BNO_Survei_Monitor\BNO_Survei_Monitor
dotnet run
# → http://localhost:44342
```

> **ทุกหน้าใช้ mock data** ยกเว้น Camera Detail — ดูได้ครบโดยไม่ต้องเปิด backend

### Login ทดสอบ

| Username | Password | Role |
|---|---|---|
| `admin_test` | `Test@1234` | Admin |
| `user_test` | `Test@1234` | User |
| ใส่อะไรก็ได้ | ใส่อะไรก็ได้ | Admin (mock fallback) |

---

## Pages ทั้งหมด

| Route | ไฟล์ | Data | สถานะ |
|---|---|---|---|
| `/dashboard` | `OverviewPage.tsx` | Mock | ✅ stat cards + alerts |
| `/dashboard/topology` | `TopologyPage.tsx` | Mock | ✅ legend panel + hide offline |
| `/dashboard/sites` | `SitesCrudPage.tsx` | Mock | ✅ CRUD |
| `/dashboard/sites/:siteId` | `SitesPage.tsx` | Mock | ✅ building cards |
| `/dashboard/buildings/:id` | `BuildingDetailPage.tsx` | Mock | ✅ isometric view |
| `/dashboard/floors/:id` | `FloorPlanPage.tsx` | Mock | ✅ View/Edit mode + side panel |
| `/dashboard/cameras` | `CamerasPage.tsx` | Mock | ✅ CRUD |
| `/dashboard/cameras/:id` | `CameraDetailPage.tsx` | API | ✅ ping chart + uptime |
| `/dashboard/nvrs` | `NVRsPage.tsx` | Mock | ✅ CRUD + HDD progress |
| `/dashboard/nvrs/:id` | `NVRDetailPage.tsx` | Mock | ✅ HDD per-drive + channels table |
| `/dashboard/switches` | `SwitchesPage.tsx` | Mock | ✅ CRUD |
| `/dashboard/switches/:id` | `SwitchDetailPage.tsx` | Mock | ✅ port map + port status table |
| `/dashboard/racks` | `RacksListPage.tsx` | Mock | ✅ per-site grouping |
| `/dashboard/racks/:id` | `RackDetailPage.tsx` | Mock | ✅ rack frame visualization |
| `/dashboard/users` | `UsersPage.tsx` | Mock | ✅ CRUD + Admin only |

---

## Back Navigation

ทุก detail page ส่ง context กลับถูกหน้า:

| เส้นทาง | กดกลับไปที่ |
|---|---|
| Floor Plan → Camera Detail | กลับ Floor Plan เดิม |
| Floor Plan → Rack Detail | กลับ Floor Plan เดิม |
| NVRs List → NVR Detail | กลับ NVRs List |
| Switches List → Switch Detail | กลับ Switches List |

Pattern: `navigate(path, { state: { from: location.pathname } })` → detail page อ่าน `location.state?.from`

---

## โครงสร้างสำคัญ

```
Frontend/
├── src/
│   ├── pages/          ← React page components (1 ไฟล์ต่อ 1 route)
│   ├── components/
│   │   ├── layout/     ← AppLayout, Sidebar, Topbar
│   │   └── topology/   ← HQNode, SiteNode, mockData
│   ├── api/            ← axios client + typed API functions
│   ├── stores/         ← Zustand (authStore, themeStore)
│   └── styles/         ← CSS token files (ห้ามใช้ Tailwind)
│
├── open design/
│   ├── input/          ← TASK_*.md — design briefs
│   ├── output/         ← HTML mockups (implement แล้วทั้งหมด)
│   └── done/           ← archive
│
├── BNO_Survei_Monitor/ ← ASP.NET Core backend
├── CLAUDE.md           ← context สำหรับ AI + project rules
└── BACKLOG.md          ← รายละเอียดงานที่ค้าง
```

---

## Stack

| | |
|---|---|
| Frontend | React 18 + Vite 6 + TypeScript (port 3001) |
| UI Library | Ant Design 5 (Form / Modal / Table เท่านั้น) |
| State | Zustand (`authStore`, `themeStore`) |
| Data fetching | TanStack React Query + Axios |
| Icons | lucide-react |
| Topology | React Flow v11 |
| Backend | ASP.NET Core .NET 10 |
| Auth | JWT (8h) + BCrypt |

---

## Rules สั้นๆ

- Layout ใช้ CSS custom เท่านั้น — ห้าม Tailwind, ห้าม Ant Design layout
- CSS tokens ทุกตัวอยู่ใน `src/styles/tokens.css`
- ห้ามใส่ comment ในโค้ดยกเว้น WHY ที่ไม่ชัดเจน
- Icons: lucide-react เท่านั้น — ห้ามใช้ emoji ใน UI
- Mock data ก่อน — API wire ทีหลัง

ดูรายละเอียดครบใน [`CLAUDE.md`](CLAUDE.md)
