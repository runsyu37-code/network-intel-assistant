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

> อัปเดต: **2026-05-29** · Presentation: ✅ ผ่านแล้ว · Next: **2026-06-04**
> Branch หลัก frontend: `frontend` | Branch backend: `backend`

| ส่วน | สถานะ |
|---|---|
| Backend API (ASP.NET Core) | ✅ เสร็จ — JWT, RBAC, 17+ endpoints (branch: `backend`) |
| Frontend UI — ทุกหน้า | ✅ 15 หน้า + BuildingMapPage (branch: `frontend`) |
| Open design mockups | ✅ ทุก HTML mockup implement เสร็จแล้ว |
| RouteGuard — Login required | ✅ `RequireAuth` redirect ถ้าไม่ login |
| Theme — Buono brand purple | ✅ `--accent #8B44AA` |
| Floor plan — hover tooltip + warning pulse | ✅ |
| Building Map — Leaflet + real lat/lng | ✅ (ต้อง run DB migration ก่อน) |
| **เชื่อม API จริง — 7/12 หน้า** | 🟡 ดูตารางด้านล่าง |

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

### Frontend (branch: `frontend`)

```powershell
git checkout frontend
npm install
npm run dev   # → http://localhost:3000
```

### Backend (branch: `backend`)

```powershell
git checkout backend
# เปิด BNO_Survei_MonitorAPI.sln ใน Visual Studio → F5
# → http://localhost:50680
```

> **7/12 หน้าใช้ API จริง** — หน้าที่ยัง Mock ดูได้โดยไม่ต้องเปิด backend
> ดู branch `backend` → `docs/sessions/` สำหรับ backend session logs

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
| `/dashboard/topology` | `TopologyPage.tsx` | Mock | ✅ legend + hide offline |
| `/dashboard/map` | `BuildingMapPage.tsx` | **API** | ✅ Leaflet map + site filter |
| `/dashboard/sites` | `SitesCrudPage.tsx` | Mock | ✅ |
| `/dashboard/sites/:siteId` | `SitesPage.tsx` | **API** | ✅ hierarchy tree |
| `/dashboard/buildings/:id` | `BuildingDetailPage.tsx` | Mock | 🟡 wiring next |
| `/dashboard/floors/:id` | `FloorPlanPage.tsx` | Mock | 🟡 wiring next |
| `/dashboard/cameras` | `CamerasPage.tsx` | **API** | ✅ real list + site filter |
| `/dashboard/cameras/:id` | `CameraDetailPage.tsx` | **API** | ✅ ping chart + uptime |
| `/dashboard/nvrs` | `NVRsPage.tsx` | **API** | ✅ real list + HDD progress |
| `/dashboard/nvrs/:id` | `NVRDetailPage.tsx` | **API** | ✅ channels + storage |
| `/dashboard/switches` | `SwitchesPage.tsx` | **API** | ✅ real list |
| `/dashboard/switches/:id` | `SwitchDetailPage.tsx` | **API** | ✅ port map + power |
| `/dashboard/racks` | `RacksListPage.tsx` | Mock | 🟡 wiring next |
| `/dashboard/racks/:id` | `RackDetailPage.tsx` | Mock | 🟡 wiring next |
| `/dashboard/users` | `UsersPage.tsx` | **API** (read) | ✅ real users; CRUD local |

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
