# SSM Frontend — Surveillance Smart-Monitor

React SPA สำหรับจัดการระบบกล้อง CCTV, NVR, PoE Switch และ Rack ภายในองค์กร

---

## Stack

| Layer | Technology |
|---|---|
| Framework | React 18 + Vite 6 + TypeScript |
| UI Components | Ant Design 5 (Form / Modal / Table only) |
| State | Zustand (auth, theme) |
| Data Fetching | TanStack React Query + Axios |
| Routing | React Router v6 |
| Topology | React Flow v11 |
| Icons | lucide-react |
| Charts | Recharts |

---

## Getting Started

### Prerequisites

- Node.js 18+
- Backend API running at `http://localhost:50680` (BNO_Survei_MonitorAPI)

### Run

```bash
npm install
npm run dev
```

App starts at **http://localhost:3001** — API calls are proxied to `localhost:50680` automatically.

### Build

```bash
npm run build
```

---

## Login

ใส่ username/password อะไรก็ได้ (mock auth) — ระบบจะ login เป็น `admin` เสมอ

---

## Pages

| Route | Page | Description |
|---|---|---|
| `/` | Login | Mock login |
| `/dashboard/topology` | Network Topology | React Flow diagram, drag-to-reposition |
| `/dashboard/sites/:siteId` | Site Detail | Buildings map + grid view |
| `/dashboard/buildings/:buildingId` | Building Detail | Floor list + cross-section view |
| `/dashboard/floors/:floorId` | Floor Plan | Camera overlay, drag-to-place, edit mode |
| `/dashboard/racks` | Racks List | Grouped by site, capacity + power bars |
| `/dashboard/racks/:rackId` | Rack Detail | Visual rack diagram + inventory |
| `/dashboard/cameras` | Cameras | CRUD table |
| `/dashboard/cameras/:id` | Camera Detail | Status, ping history chart, 30-day uptime |
| `/dashboard/nvrs` | NVRs | CRUD table |
| `/dashboard/nvrs/:id` | NVR Detail | HDD usage, channel info |
| `/dashboard/switches` | PoE Switches | CRUD table |
| `/dashboard/switches/:id` | Switch Detail | Port usage, PoE power |
| `/dashboard/users` | Users | CRUD — admin only |

---

## API

Base URL: `http://localhost:50680/api`  
Configured in `vite.config.ts` (proxy) and `src/api/client.ts`.

ทุก page ใช้ **fallback mock data** — ถ้า backend ไม่ตอบ จะแสดง mock data แทน ไม่ crash

---

## Theme

Light / Dark toggle อยู่ที่ Topbar ขวาบน  
Accent color: สีม่วง Buono (`#8B44AF`)  
CSS tokens อยู่ใน `src/styles/tokens.css`

---

## Floor Plan Images

วาง real floor plan images ที่ `public/floorplans/<floorId>.<ext>` (jpg/png/svg/webp)  
ระบบ auto-detect และใช้เป็น background อัตโนมัติ  
Floor ID format: `a-f1` ถึง `a-f6`

---

## Project Structure

```
src/
├── api/          # Axios functions + TypeScript types
├── components/   # Layout (Topbar, Sidebar) + Topology nodes
├── pages/        # One file per route
├── stores/       # Zustand (authStore, themeStore)
└── styles/       # CSS files (tokens, global, layout, per-page)
```
