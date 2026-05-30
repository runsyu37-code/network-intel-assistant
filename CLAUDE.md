# SSM Frontend — Claude Context

> **Quick session?** Load [`DEV.md`](DEV.md) instead — it's smaller and faster.
> Load this file when you need full context or are designing a new feature.

## Project
Surveillance Smart-Monitor (SSM) — React SPA for CCTV device management.
Presentation deadline: **2026-05-29 (Thursday)** — passed. System is demo-ready as of 2026-05-30.

## Stack
- React 18 + Vite 6 + TypeScript (port 3000)
- Ant Design 5 — **Form / Modal / Table only** (not for layout)
- Zustand: `authStore` + `themeStore` (persisted, key `ssm.theme`)
- TanStack React Query + Axios → `localhost:50680` (via Vite proxy `/api/*`)
- React Flow v11 (topology page)
- lucide-react (icons only — never use emoji)
- CSS: custom tokens in `src/styles/tokens.css` — never override with inline styles unless necessary

## Key Rules
- **Language:** Reply in Thai in chat. `.md` files for tools must be in English.
- **No comments in code** unless the WHY is non-obvious.
- **No emoji** unless user explicitly asks.
- **Real API** — all pages wired to `localhost:50680` via React Query. No mock data.
- CSS lives in `src/styles/` — one file per concern. Never use Tailwind.
- Ant Design theme synced via `ConfigProvider` in `App.tsx` — don't touch `data-theme` directly.

## Pages & Routes

| Route | File | Done |
|---|---|---|
| `/` | `LoginPage.tsx` | ✅ |
| `/dashboard/topology` | `TopologyPage.tsx` | ✅ |
| `/dashboard/sites/:siteId` | `SitesPage.tsx` | ✅ |
| `/dashboard/buildings/:buildingId` | `BuildingDetailPage.tsx` | ✅ |
| `/dashboard/floors/:floorId` | `FloorPlanPage.tsx` | ✅ |
| `/dashboard/racks` | `RacksListPage.tsx` | ✅ |
| `/dashboard/racks/:rackId` | `RackDetailPage.tsx` | ✅ |
| `/dashboard/cameras` | `CamerasPage.tsx` | ✅ |
| `/dashboard/nvrs` | `NVRsPage.tsx` | ✅ |
| `/dashboard/switches` | `SwitchesPage.tsx` | ✅ |
| `/dashboard/users` | `UsersPage.tsx` | ✅ (admin only) |

## CSS Files (import order in `index.css`)
```
tokens.css      → CSS custom properties (light/dark via data-theme)
global.css      → reset + base
layout.css      → .app grid, .sidebar, .topbar, .page-content, .canvas-wrap
topology.css    → .topo-hq, .topo-site, React Flow overrides
sites.css       → .bldg-card, .floor-card, .floor-stack
floor.css       → .plan (SVG), .cam overlays, .mode-toggle
rack.css        → .rack, .device, .sub-device, .rack-info, .inv-table
devicelist.css  → .dl-table, .dl-toolbar, .dl-search (shared for list pages)
```

## Login
Real credentials via `POST /api/auth/login` → JWT stored in `authStore`.
Default accounts: `admin` / `Admin@SSM1` (admin), `ssm_user` / `User@SSM1` (user).

## Floor Plan Images
Drop real floor plan images at `public/floorplans/<floorId>.<ext>` (jpg/png/svg/webp).
Code auto-detects and uses the image as background; falls back to SVG vector plan.
Floor ID format: `a-f1` through `a-f6` (Building A, Floor 1–6).

## Polish Backlog (เก็บตก — after all pages done)
- [x] Topbar breadcrumb: show full path (Home / Site / Building / Floor)
- [x] Sidebar active state: highlight when inside nested routes (sites/*/buildings/*)
- [x] Isometric building cross-section (Building Detail) — wireframe has SVG script
- [x] Floor Plan Edit mode: real drag-and-drop camera repositioning
- [x] Connect all pages to real C# API (replace mock arrays with React Query hooks)
- [x] Rack Detail: navigate from Racks List per-site grouping
- [x] Camera detail page (individual camera info + ping history chart)

## Backend (Not Claude's task)
`C:\ai-playground\Frontend\BNO_Survei_Monitor\` — ASP.NET Core .NET 10.
Backend team adds API controllers. Models namespace must be `BNO_Survei_Monitor.Models`.
API base URL: `http://localhost:50680` (Vite proxies `/api/*` → this port)
