# SSM — Surveillance Smart-Monitor

React SPA สำหรับจัดการและติดตามระบบกล้องวงจรปิด (CCTV) แบบ real-time
เชื่อมต่อกับ backend ASP.NET Core ผ่าน REST API

---

## Stack

| ส่วน | Technology |
|---|---|
| Frontend | React 18 + Vite 6 + TypeScript |
| UI Components | Ant Design 5 (Form / Modal / Table เท่านั้น) |
| State | Zustand (`authStore`, `themeStore`) |
| Data fetching | TanStack React Query + Axios |
| Topology | React Flow v11 |
| Map | Leaflet + react-leaflet (satellite: Esri World Imagery) |
| Icons | lucide-react |
| CSS | Custom tokens — `src/styles/tokens.css` |
| Backend | ASP.NET Core .NET 10 → `http://localhost:50680` |

---

## เริ่มใช้งาน

```bash
# 1. Backend — เปิดใน Visual Studio
#    C:\1_Work_Local\backend-latest\BNO_Survei_MonitorAPI\BNO_Survei_MonitorAPI.slnx
#    Ctrl+F5 → http://localhost:50680

# 2. Frontend
npm install
npm run dev        # → http://localhost:3000
```

**Login:**
| Username | Password | Role |
|---|---|---|
| `admin` | `Admin@SSM1` | Admin (ทุกหน้า + CRUD) |
| `ssm_user` | `User@SSM1` | User (ดูได้, แก้ไขจำกัด) |

---

## โครงสร้างหน้า

| Route | Component | หมายเหตุ |
|---|---|---|
| `/` | `LoginPage` | JWT → `authStore` |
| `/dashboard` | `OverviewPage` | Summary + alerts |
| `/dashboard/sites` | `SitesOverviewPage` | Topology / List / Grid |
| `/dashboard/sites/:siteId` | `SitesPage` | อาคารใน site (Map / Grid) |
| `/dashboard/map` | `BuildingMapPage` | Satellite map + Create mode |
| `/dashboard/buildings/:id` | `BuildingDetailPage` | Cross-section + floors |
| `/dashboard/floors/:id` | `FloorPlanPage` | Camera overlay + drag |
| `/dashboard/cameras` | `CamerasPage` | รายการกล้องทั้งหมด |
| `/dashboard/cameras/:id` | `CameraDetailPage` | Ping history chart |
| `/dashboard/nvrs` | `NVRsPage` | — |
| `/dashboard/nvrs/:id` | `NVRDetailPage` | — |
| `/dashboard/switches` | `SwitchesPage` | — |
| `/dashboard/switches/:id` | `SwitchDetailPage` | — |
| `/dashboard/racks` | `RacksListPage` | จัดกลุ่มตาม site |
| `/dashboard/racks/:id` | `RackDetailPage` | U-position layout |
| `/dashboard/audit` | `AuditPage` | Flat camera audit + CSV export |
| `/dashboard/users` | `UsersPage` | Admin only |

---

## ฟีเจอร์หลัก

### Sites Overview (`/dashboard/sites`)
- **Topology** — React Flow mindmap, HQ node เชื่อมทุก site, drag-to-reposition พร้อม persist ไป API
- **List** — ตารางค้นหา + filter status + CRUD
- **Grid** — cards พร้อม status dot
- คลิก site → ไปยัง Building Map ซูมตรง site นั้น
- **Save View** — บันทึก ReactFlow viewport ลง localStorage, restore อัตโนมัติครั้งถัดไป

### Building Map (`/dashboard/map`)
- Satellite / Street Map toggle
- **Map / List** toggle
- Coordinate input — paste lat,lng → flyTo
- **Save View** per site (admin) — บันทึก center + zoom
- **Reset** — กลับมุมมองที่บันทึกไว้
- **Create mode** (admin) — คลิกแผนที่ → กรอกชื่อตึก + Site → บันทึก (auto-generate Building ID)
- Pin mode — วางพิกัดอาคารที่ยังไม่มีพิกัด

### Floor Plan (`/dashboard/floors/:id`)
- รองรับรูปพื้นที่จริง (`public/floorplans/<floorId>.<ext>`)
- Overlay กล้องบนแผน, drag-to-reposition (admin)

### Audit View (`/dashboard/audit`)
- Flat table กล้องทุกตัว + นับ online/offline/warning
- Export CSV

---

## โครงสร้าง CSS

```
src/styles/
├── tokens.css      ← CSS custom properties (light/dark via data-theme)
├── global.css      ← reset + base
├── layout.css      ← sidebar, topbar, page-content, nav-sub
├── topology.css    ← HQ/site nodes, React Flow overrides
├── sites.css       ← building cards, floor cards, view toggles
├── floor.css       ← floor plan, camera overlays
├── rack.css        ← rack, device, U-position
└── devicelist.css  ← dl-table, dl-toolbar, dl-badge (shared)
```

กฎ: **ห้ามใช้ Tailwind** — CSS ทั้งหมดอยู่ใน `src/styles/` เท่านั้น

---

## localStorage Keys

| Key | Value | ใช้สำหรับ |
|---|---|---|
| `ssm.theme` | `'light'｜'dark'` | Zustand persist |
| `ssm.topo.hq` | `{x, y}` | ตำแหน่ง HQ node |
| `ssm.topo.viewport` | `{x, y, zoom}` | มุมมอง topology ที่บันทึก |
| `ssm.map.viewports` | `Record<siteId, {lat, lng, zoom}>` | มุมมอง map ต่อ site |

---

## API Endpoints หลัก

| หน้า | Endpoint |
|---|---|
| Dashboard | `GET /api/dashboard/summary`, `GET /api/status/devices` |
| Sites | `GET /api/sites`, `POST`, `PATCH`, `DELETE /api/sites/{id}` |
| Topology position | `PATCH /api/sites/{id}/position` |
| Buildings | `GET /api/buildings`, `POST`, `PATCH`, `DELETE /api/buildings/{id}` |
| Building coordinates | `PATCH /api/buildings/{id}/coordinates` |
| Floors | `GET /api/floors?Building_ID=` |
| Cameras | `GET /api/cameras?Floor_ID=`, `GET /api/cameras/{id}` |
| NVRs | `GET /api/nvrs`, `GET /api/nvrs/{id}` |
| Switches | `GET /api/switches`, `GET /api/switches/{id}` |
| Racks | `GET /api/racks`, `GET /api/racks/{id}` |
| Auth | `POST /api/auth/login` → JWT |
| Users | `GET /api/users` (admin only) |

Vite proxy: `/api/*` → `http://localhost:50680`

---

## Phase Gates (ก่อนเริ่ม feature ใหม่)

| Phase | Gate | สถานะ |
|---|---|---|
| 1 — Audit | BE: `last_seen` ใน `GET /api/cameras` | ❌ รอ BE |
| 2.1 — Device CRUD | API contract signed ก่อนเขียน code | ❌ |
| 2.2 — Rack U-Position | BE: `u_height/u_size`, `max_u`, overlap 409, U convention | ❌ ทั้ง 4 gate |
| 2.3 — Building Coordinates | BE: `lat/lng` writable ผ่าน PATCH | ❌ รอ BE |
| 3 — Alert Hardware | Baseline test + controlled fail test | ❌ ต้องอยู่หน้าเครื่อง |

---

## Session Logs

| วันที่ | ไฟล์ | สรุป |
|---|---|---|
| 2026-05-29 | `docs/sessions/SESSION_2026-05-29.md` | Setup, Login, OverviewPage |
| 2026-05-30 | `docs/sessions/SESSION_2026-05-30.md` | Topology, Sites, Buildings |
| 2026-05-31 | `docs/sessions/SESSION_2026-05-31_FE.md` | CRUD wired real API ครบ, Building pins |
| 2026-06-01 | `docs/sessions/SESSION_2026-06-01_FE.md` | Sites merge, Building Map upgrade |

---

## ทีม

- **Frontend:** Claude Sonnet 4.6 + Ran
- **Backend:** ทีม BE (ASP.NET Core, SQL Server Express)
- **Deadline:** 1 กรกฎาคม 2026
