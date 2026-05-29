# SSM Frontend — Surveillance Smart-Monitor

React SPA สำหรับจัดการระบบกล้อง CCTV, NVR, PoE Switch และ Rack ภายในองค์กร

---

## Stack

| Layer | Technology | Notes |
|---|---|---|
| Framework | React 18 + Vite 6 + TypeScript | Dev port 3000 |
| UI Components | Ant Design 5 | Form / Modal / Tooltip / Notification only |
| State | Zustand | `authStore` (JWT + role), `themeStore` (persisted) |
| Data Fetching | TanStack React Query v5 + Axios | `/api` proxied to backend |
| Routing | React Router v6 | Role-guarded via `RouteGuard` HOC |
| Topology | React Flow v11 | Drag-to-reposition nodes |
| Map | react-leaflet + Leaflet | OpenStreetMap + ESRI satellite |
| Charts | Recharts | Ping history, HDD usage |
| Icons | lucide-react | |

---

## Getting Started

### Prerequisites

- Node.js 18+
- Backend API running at `http://localhost:50680` (BNO_Survei_MonitorAPI — ASP.NET 4.8, IIS Express)

### Run

```bash
npm install
npm run dev
```

App starts at **http://localhost:3000** — API calls proxy to `localhost:50680` automatically via `vite.config.ts`.

### Build

```bash
npm run build
```

---

## Login

Real login via `POST /api/auth/login` — backend returns JWT (8-hour expiry).  
**SessionWatcher** shows an Ant Design notification 5 minutes before the token expires.

Fallback (offline demo): type any username/password when backend is down → logs in as `admin` with `demo-token`.

---

## Role Access Matrix

| Route | admin | user | viewer |
|---|---|---|---|
| Dashboard, Topology, Building Map | ✅ | ✅ | ✅ |
| Sites (browse), Buildings, Floors | ✅ | ✅ | ✅ |
| Racks (browse + detail) | ✅ | ✅ | ❌ |
| Sites (CRUD) | ✅ | ❌ | ❌ |
| Cameras, NVRs, Switches (CRUD) | ✅ | ❌ | ❌ |
| Users (CRUD) | ✅ | ❌ | ❌ |
| Floor plan Edit mode (drag pins) | ✅ | ❌ | ❌ |

Unauthorized access → redirects to `/403` page.  
Backend enforces the same matrix independently via `[RequireRole]`.

---

## Pages

| Route | Page | Access |
|---|---|---|
| `/` | Login | Public |
| `/403` | Not Authorized | Public |
| `/dashboard` | Overview / Dashboard | All |
| `/dashboard/topology` | Network Topology | All |
| `/dashboard/map` | Building Map (Leaflet GPS) | All |
| `/dashboard/sites` | Sites CRUD | Admin |
| `/dashboard/sites/:siteId` | Site Detail | All |
| `/dashboard/buildings/:buildingId` | Building Detail | All |
| `/dashboard/floors/:floorId` | Floor Plan + Camera Drag | All (edit: Admin) |
| `/dashboard/racks` | Racks List (grouped by site) | Admin, User |
| `/dashboard/racks/:rackId` | Rack Detail + Inventory | Admin, User |
| `/dashboard/cameras` | Cameras CRUD | Admin |
| `/dashboard/cameras/:id` | Camera Detail + Ping Chart | Admin |
| `/dashboard/nvrs` | NVRs CRUD | Admin |
| `/dashboard/nvrs/:id` | NVR Detail | Admin |
| `/dashboard/switches` | PoE Switches CRUD | Admin |
| `/dashboard/switches/:id` | Switch Detail | Admin |
| `/dashboard/users` | Users CRUD | Admin |

---

## Key Features

### Device Status
Three states returned by API: `"online"` (green) · `"warning"` (yellow) · `"offline"` (red)  
Warning = 1–2 consecutive ping failures. Offline = 3+ failures + Discord alert sent.

### Hover Tooltips
Ant Design `<Tooltip>` (400ms delay) on:
- Floor plan camera pins → name, IP, status, brand, last seen
- Camera / NVR list rows → serial no, MAC, install location, NVR channel / IPs, brand
- Rack inventory rows → IP, brand, PoE port number

### Optimistic CRUD
Create / Edit / Delete updates local state immediately, fires API in background.  
On failure: reverts state + shows warning toast. No full-page reload.

### Floor Plan
Drop real floor plan images at `public/floorplans/<floorId>.<ext>` (jpg/png/svg/webp).  
Auto-detected and used as background. Falls back to inline SVG vector plan.  
Camera pin positions saved as percentages via `PATCH /api/cameras/{id}/position`.

---

## API

Base URL: `http://localhost:50680/api`  
Configured in `vite.config.ts` (proxy `/api` → backend) and `src/api/client.ts`.

**Auth:** Bearer JWT in `Authorization` header, injected by Axios request interceptor.  
**401** → clears token, redirects to `/login`.  
**403** → sets `error.isForbidden = true` — pages show "ไม่มีสิทธิ์เข้าถึงข้อมูลนี้".

API functions grouped by resource in `src/api/`:

```
client.ts       ← Axios instance + interceptors
cameras.ts      ← GET / POST / PATCH / DELETE cameras
nvrs.ts         ← GET / POST / PATCH / DELETE NVRs
switches.ts     ← GET / POST / PATCH / DELETE switches
racks.ts        ← GET racks / GET rack detail
hierarchy.ts    ← tree, dashboard summary, device status, alert logs, buildings
sites.ts        ← GET / POST / PATCH / DELETE sites
users.ts        ← GET / POST / PATCH / DELETE users
types.ts        ← all TypeScript interfaces matching backend response shapes
```

---

## Theme

Light / Dark toggle in the Sidebar footer.  
Accent: Buono purple `#8B44AF` (light) / `#b06fd4` (dark).  
Tokens in `src/styles/tokens.css` — never override with inline styles.

---

## Project Structure

```
src/
├── api/              ← Axios functions + TypeScript types
├── components/
│   ├── layout/       ← AppLayout, Topbar, Sidebar
│   ├── RouteGuard.tsx ← role-based route protection
│   └── SessionWatcher.tsx ← JWT expiry warning timer
├── pages/            ← one file per route
├── stores/
│   ├── authStore.ts  ← user, token, role (Zustand)
│   └── themeStore.ts ← light/dark (persisted to localStorage)
└── styles/
    ├── tokens.css    ← CSS custom properties (light/dark via data-theme)
    ├── global.css    ← reset + base
    ├── layout.css    ← sidebar, topbar, page-content
    ├── topology.css  ← React Flow overrides
    ├── sites.css     ← building/floor cards
    ├── floor.css     ← floor plan SVG + camera overlays
    ├── rack.css      ← rack diagram + inventory table
    ├── devicelist.css ← shared list page styles (tables, toolbar, badges)
    └── dashboard.css ← overview page widgets
```

---

## Review History

A formal code review was conducted on 2026-05-29. All 6 critical blockers resolved.  
See `review/` directory:
- `FINDINGS (1).md` — original review report (No-Go → Go)
- `FIX_PLAN.md` — fix plan with backend Q&A
- `SESSION_LOG_2026-05-29.md` — full session log with commit references
