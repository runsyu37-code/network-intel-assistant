# SSM — Surveillance Smart-Monitor

ระบบติดตามกล้องวงจรปิดและอุปกรณ์เครือข่ายแบบ Real-time
Full-stack: React SPA (Frontend) + ASP.NET Core API (Backend)

---

## อ่านก่อนเริ่มทำงาน

| ต้องการอะไร | ไปที่ |
|---|---|
| แค่รัน dev / แก้โค้ด | [`DEV.md`](DEV.md) ← เล็ก โหลดเร็ว |
| บริบทโปรเจกต์ + rules ทั้งหมด | [`CLAUDE.md`](CLAUDE.md) |
| งานที่ค้างอยู่ + API notes | [`BACKLOG.md`](BACKLOG.md) |
| Presentation slides | [`presentation_F/SLIDES_FINAL.md`](presentation_F/SLIDES_FINAL.md) |

---

## สถานะโปรเจกต์

> อัปเดต: **2026-05-28** · Deadline: **2026-05-29 (พฤหัส)**
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
| Theme — Buono brand purple | ✅ `--accent #8B44AA` ทุกหน้า (login + sidebar + topology) |
| Floor plan — camera icons | ✅ จุดวงกลมสี + FOV cone โปรเจคเตอร์ (ไม่มีรูป video) |
| Floor plan — camera positions | ✅ ติดผนังทุก floor (a-f1 → a-f6) FOV ชี้เข้าห้อง |
| Login — mock fallback | ✅ เข้าได้แม้ backend error / DB ไม่ตอบ |
| เชื่อม API จริงทุกหน้า | 🟡 Camera Detail ใช้ API — หน้าอื่นใช้ mock data |

---

## File Map — Where Everything Lives

```
network-intel-assistant/         ← git clone จาก branch: frontend
│
├── README.md                    ← ไฟล์นี้
├── DEV.md                       ← ⚡ Quick start สำหรับ session โค้ด (เล็ก)
├── CLAUDE.md                    ← Full context + rules สำหรับ AI
├── BACKLOG.md                   ← งานค้าง + API notes
│
├── [Vite project — root level]
│   ├── index.html               ← Vite entry point
│   ├── vite.config.ts           ← proxy /api → localhost:44342
│   ├── tsconfig*.json
│   └── package.json / package-lock.json
│
├── src/                         ← React source code
│   ├── pages/                   ← 15 page components (1 route = 1 file)
│   ├── components/
│   │   ├── layout/              ← AppLayout, Sidebar, Topbar
│   │   ├── topology/            ← HQNode, SiteNode, mockData
│   │   ├── sites/               ← BuildingMapNode, HQSiteNode ฯลฯ
│   │   └── BuildingRenderer/    ← isometric view
│   ├── api/                     ← axios client + typed API functions
│   │   ├── types.ts             ← TypeScript interfaces ทุก type
│   │   ├── client.ts            ← axios instance + JWT interceptor
│   │   └── auth/cameras/nvrs/switches/users/hierarchy.ts
│   ├── stores/                  ← Zustand (authStore, themeStore)
│   └── styles/                  ← CSS ห้ามใช้ Tailwind
│       ├── tokens.css           ← CSS variables ทั้งหมด (light/dark)
│       ├── global.css / layout.css / topology.css
│       └── camera/dashboard/devicelist/floor/rack/sites.css
│
├── public/                      ← static assets
│   ├── buono_icon.png / buono_logo.jpg
│   └── floorplans/              ← วาง floor plan images ที่นี่ (<floorId>.jpg)
│
├── BNO_Survei_Monitor/          ← ASP.NET Core .NET 10 backend
│   └── BNO_Survei_Monitor/
│       └── (dotnet run → localhost:44342)
│
├── work_pack/                   ← [Work Notebook] import tools
│   ├── START_HERE.md            ← อ่านก่อนใช้งาน
│   ├── ssm_import.py            ← import Excel → DB
│   ├── template_v4_empty.xlsx   ← template กรอกข้อมูลจริง
│   └── SSM_IMPORT_GUIDE.md
│
├── open design/                 ← HTML mockups (reference)
│   ├── done/                    ← implement แล้วทั้งหมด
│   ├── output/                  ← mockups รอ implement
│   └── input/                   ← TASK_*.md design briefs
│
├── docs/                        ← Reference docs
│   ├── FRONTEND_TO_BACKEND.md   ← API contract summary
│   ├── BACKEND_API_BRIEF.md     ← DB schema + code patterns
│   ├── BACKEND_READY_NOTES.md   ← notes backend พร้อมแล้ว
│   ├── WIREFRAME_BRIEF.md       ← wireframe design brief
│   ├── WIREFRAME_STATUS.md      ← สถานะ wireframe แต่ละหน้า
│   ├── AI_DELEGATION.md         ← การแบ่งงาน AI
│   ├── RACK_POSITION.md         ← rack position spec
│   ├── screenshots/             ← UI screenshots (bldg, floor, nvr ฯลฯ)
│   ├── branches/                ← branch notes
│   ├── plan/                    ← ROADMAP, MEGA_CONTEXT
│   ├── workflow/                ← MACHINE_RULES, START_HERE, SESSION_PROTOCOL
│   ├── log/                     ← LEARNING_LOG
│   └── me/                      ← ABOUT_ME
│
├── presentation_F/              ← Weekly presentation slides
│   └── SLIDES_FINAL.md
│
├── logo/                        ← Project logos
│
└── archive/                     ← เก็บไว้ ไม่ใช้แล้ว
    ├── project/                 ← old bolt.new prototype (superseded)
    ├── frontend_design/         ← old wireframes (superseded by open design/)
    ├── sanitizer/               ← Phase A sanitizer (superseded by work_pack)
    ├── samples/ + tests/        ← Phase A test data
    ├── scripts/                 ← superseded by work_pack/
    ├── templates/               ← superseded by work_pack/
    ├── review/                  ← duplicate docs
    ├── database/                ← backend SQL (ดูที่ branch: backend แทน)
    └── old_docs/                ← root .md เก่า
```

---

## Quick Start

### Frontend

```powershell
cd C:\ai-playground\Frontend
npm install
npm run dev   # → http://localhost:3000
```

### Backend (เปิดเฉพาะตอน wire API จริง)

```powershell
cd C:\ai-playground\Frontend\BNO_Survei_Monitor\BNO_Survei_Monitor
IIS Express (Ctrl+F5 ใน VS)   # → http://localhost:50680
```

> **ทุกหน้าใช้ mock data** ยกเว้น Camera Detail — ดูได้ครบโดยไม่ต้องเปิด backend

### Login ทดสอบ

| Username | Password | Role |
|---|---|---|
| ใส่อะไรก็ได้ | ใส่อะไรก็ได้ | Admin (mock fallback) |
| `admin_test` | `Test@1234` | Admin (real API) |
| `user_test` | `Test@1234` | User (real API) |

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
| `/dashboard/cameras/:id` | `CameraDetailPage.tsx` | **API** | ✅ ping chart + uptime |
| `/dashboard/nvrs` | `NVRsPage.tsx` | Mock | ✅ CRUD + HDD progress |
| `/dashboard/nvrs/:id` | `NVRDetailPage.tsx` | Mock | ✅ HDD per-drive + channels table |
| `/dashboard/switches` | `SwitchesPage.tsx` | Mock | ✅ CRUD |
| `/dashboard/switches/:id` | `SwitchDetailPage.tsx` | Mock | ✅ port map + port status table |
| `/dashboard/racks` | `RacksListPage.tsx` | Mock | ✅ per-site grouping |
| `/dashboard/racks/:id` | `RackDetailPage.tsx` | Mock | ✅ rack frame visualization |
| `/dashboard/users` | `UsersPage.tsx` | Mock | ✅ CRUD + Admin only |

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
| Backend | ASP.NET Core .NET 10 (port 44342) |
| Auth | JWT (8h) + BCrypt |

---

## Rules สั้นๆ

- Layout ใช้ CSS custom เท่านั้น — ห้าม Tailwind, ห้าม Ant Design layout
- CSS tokens ทุกตัวอยู่ใน `src/styles/tokens.css`
- ห้ามใส่ comment ในโค้ดยกเว้น WHY ที่ไม่ชัดเจน
- Icons: lucide-react เท่านั้น — ห้ามใช้ emoji ใน UI

ดูรายละเอียดครบใน [`CLAUDE.md`](CLAUDE.md)
