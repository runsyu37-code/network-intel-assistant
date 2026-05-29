# SSM Frontend — Backlog

> อัปเดต: **2026-05-27** | Branch: `frontend` | Commit: `53c2670`  
> Dev server: `npm run dev` → http://localhost:3001  
> Backend API: http://localhost:44342 (ต้อง `dotnet run` ก่อน)

---

## Resume ที่บ้าน

```powershell
git pull origin frontend
npm install
npm run dev   # → http://localhost:3001
```

หน้าทั้งหมดดูได้ด้วย mock data — ไม่ต้องเปิด backend ก็ได้  
ยกเว้น **Camera Detail** (`/dashboard/cameras/:id`) ที่ยังเรียก API จริง

---

## สถานะ ณ ตอนนี้ — UI เสร็จทั้งหมด, API wiring 7/12 หน้า

| งาน | สถานะ |
|---|---|
| ทุก HTML mockup จาก open design/output/ | ✅ |
| Users CRUD (Edit / Deactivate / Delete) | ✅ |
| NVR Detail — HDD per-drive + channels table | ✅ |
| Switch Detail — port map + port status table | ✅ |
| Floor Plan — hover tooltip + warning pulse + drag save | ✅ |
| Topology — legend panel + hide offline toggle | ✅ |
| RouteGuard — `/dashboard/*` ต้อง login | ✅ |
| **API: CamerasPage / NVRsPage / SwitchesPage** | ✅ `2026-05-29` |
| **API: SitesPage (hierarchy tree)** | ✅ `2026-05-29` |
| **API: NVRDetailPage / SwitchDetailPage / UsersPage** | ✅ `2026-05-29` |

---

## งานที่ยังเหลือ

### 🟡 Connect Real API (งานหลักที่เหลือ)

Pages เหล่านี้ยังใช้ mock data — backend endpoint พร้อมแล้วทุกตัว

| Page | File | API ที่ต้อง wire |
|---|---|---|
| SitesPage | `SitesPage.tsx` | `GET /api/sites` + `GET /api/buildings?Site_ID=` |
| BuildingDetailPage | `BuildingDetailPage.tsx` | `GET /api/buildings/{id}` + `GET /api/floors?Building_ID=` |
| FloorPlanPage | `FloorPlanPage.tsx` | `GET /api/floors/{id}` + `GET /api/floor-plans?Floor_ID=` + `PATCH /api/cameras/{id}/position` |
| RacksListPage | `RacksListPage.tsx` | `GET /api/racks` + `GET /api/sites` |
| RackDetailPage | `RackDetailPage.tsx` | `GET /api/racks/{id}` |
| NVRDetailPage | `NVRDetailPage.tsx` | `GET /api/nvrs?NVR_ID=xxx` |
| SwitchDetailPage | `SwitchDetailPage.tsx` | `GET /api/poe-switches?SW_ID=xxx` |
| UsersPage | `UsersPage.tsx` | `GET/POST/PATCH /api/users` |
| NVRsPage | `NVRsPage.tsx` | `GET /api/nvrs` |
| SwitchesPage | `SwitchesPage.tsx` | `GET /api/poe-switches` |
| CamerasPage | `CamerasPage.tsx` | `GET /api/cameras` |
| SitesCrudPage | `SitesCrudPage.tsx` | `GET /api/sites` |

### 🟢 Polish เล็กน้อย

| งาน | รายละเอียด |
|---|---|
| Topbar alerts | wire กับ `GET /api/alert-logs` แทน mock 2 ตัว |
| Sidebar counts | ตัวเลข (142 cameras ฯลฯ) ดึงจาก `GET /api/dashboard/summary` |
| Floor plan image | wire กับ `GET /api/floor-plans?Floor_ID=` (base64 response) |

---

## API Notes สำคัญ

- **NVR / Switch single-item:** ใช้ query param `?NVR_ID=` / `?SW_ID=` — ไม่มี `/{id}`
- **Floor plan image:**
  ```tsx
  // GET /api/floor-plans?Floor_ID=xxx → { image_data: string, image_type: string }
  const src = `data:${plan.image_type};base64,${plan.image_data}`
  ```
- **Status values:** API ส่ง `"online"/"offline"/"warning"` → map เป็น `"ok"/"alert"/"warn"`
- **last_seen UTC:** append `Z` ก่อน parse → `new Date(ts + 'Z')`
- **Admin-only endpoints:** `ping-logs`, `alert-logs`, `dashboard/summary` → 403 ถ้าไม่ใช่ admin
- **React Query:** ต้อง wrap เสมอ → `queryFn: () => getXxx()` ไม่ใช่ `queryFn: getXxx`
- **Vite proxy:** `/api/*` → `localhost:44342` — config อยู่ใน `vite.config.ts` แล้ว

---

## API Endpoints ที่มี

| Endpoint | สถานะ |
|---|---|
| `POST /api/auth/login` | ✅ |
| `GET /api/cameras` | ✅ |
| `GET /api/cameras/{id}` | ✅ |
| `GET /api/nvrs` | ✅ |
| `GET /api/poe-switches` | ✅ |
| `GET /api/users` | ✅ admin only |
| `GET /api/ping-logs` | ✅ admin only |
| `GET /api/alert-logs` | ✅ admin only |
| `GET /api/dashboard/summary` | ✅ admin only |
| `GET /api/sites` | ✅ |
| `GET /api/buildings` | ✅ |
| `GET /api/floors` | ✅ |
| `GET /api/floor-plans?Floor_ID=` | ✅ base64 image |
| `GET /api/rooms` | ✅ |
| `GET /api/racks` | ✅ |
| `GET /api/hierarchy/tree` | ✅ |
| `PATCH /api/cameras/{id}/position` | ✅ |

---

## ไฟล์สำคัญ

```
src/api/types.ts          → TypeScript interfaces ทุก API type
src/api/client.ts         → axios instance, JWT interceptor
src/api/auth.ts           → login(), extractJwtUser()
src/api/cameras.ts        → getCameras(), getCameraById(), getPingLogs()
src/api/nvrs.ts           → getNvrs()
src/api/switches.ts       → getSwitches()
src/api/users.ts          → getUsers()
src/api/hierarchy.ts      → getDashboardSummary(), getAlertLogs()
src/stores/authStore.ts   → { id, username, displayName, role }
vite.config.ts            → proxy /api → localhost:44342
```

---

## CSS Tokens

```css
var(--bg)        var(--surface)    var(--surface-2)   var(--surface-3)
var(--border)    var(--ink)        var(--ink-2)        var(--ink-3)
var(--accent)    var(--accent-soft)
var(--ok)        var(--ok-soft)
var(--warn)      var(--warn-soft)
var(--alert)     var(--alert-soft)
```

## CSS Files

```
src/styles/tokens.css       src/styles/global.css
src/styles/layout.css       src/styles/topology.css
src/styles/sites.css        src/styles/floor.css
src/styles/rack.css         src/styles/devicelist.css
src/styles/camera.css       src/styles/login.css
src/styles/dashboard.css
```
