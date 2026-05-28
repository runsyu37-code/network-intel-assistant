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

## สถานะ ณ ตอนนี้ — ทำเสร็จแล้วทั้งหมด ✅

| งาน | สถานะ |
|---|---|
| ทุก HTML mockup จาก open design/output/ | ✅ implement หมดแล้ว |
| Users CRUD (Edit / Deactivate / Delete) + mock data | ✅ |
| NVR Detail — HDD per-drive + channels table + event log | ✅ |
| Switch Detail — info-grid + port status table | ✅ |
| Floor Plan — side panel + mode toggle ใน header | ✅ |
| Topology — left legend panel + hide offline toggle | ✅ |
| Back navigation ทุก detail page | ✅ |

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

---

## Future Features (ยังไม่ implement — จดไว้ก่อน)

### 🗺️ Site Map — Interactive Edit Mode

**หน้า:** `SitesPage.tsx` (map view)

| Feature | รายละเอียด |
|---|---|
| Edit mode toggle | เพิ่มปุ่ม View/Edit เหมือน FloorPlanPage — ใน edit mode ลากตึกบน SVG ได้ |
| Drag building footprint | ขยับตึกบน site map ให้ตรงตำแหน่งจริง — save ลง localStorage หรือ API |
| Draw new building block | ตอน Add Building ให้วาด rectangle บน canvas ได้เลย (กด drag เพื่อกำหนด x,y,w,h) |
| Resize handle | ปรับขนาด footprint ได้ (8 handle รอบ rectangle) |
| Persist positions | `ssm.site.positions.<siteId>` ใน localStorage → อนาคต sync กับ `PATCH /api/buildings/{id}/position` |

**Scope เมื่อทำจริง:**
- เพิ่ม `editMode` state + toggle pill ใน header
- ใช้ SVG `onMouseDown/Move/Up` สำหรับ drag และ draw
- Store position ใน `Record<buildingId, {x,y,w,h}>`
- New building → user วาด rect ก่อน → modal กรอก metadata ทีหลัง

---

### 📐 Pages อื่นๆ ที่จะ enhance ต่อ

| หน้า | สิ่งที่จะเพิ่ม |
|---|---|
| `FloorPlanPage` | Save camera positions ลง API (`PATCH /api/cameras/{id}/position`) แทน local state |
| `RacksListPage` | Add/Edit/Delete rack + wire API |
| `CamerasPage` | Add camera + assign to floor |
| `NVRsPage` / `SwitchesPage` | Add/Edit/Delete device |
| `TopologyPage` | Save site positions ลง API แทน localStorage |
| `BuildingDetailPage` | Floor reorder (drag-to-sort) |

---

## CSS Files

```
src/styles/tokens.css       src/styles/global.css
src/styles/layout.css       src/styles/topology.css
src/styles/sites.css        src/styles/floor.css
src/styles/rack.css         src/styles/devicelist.css
src/styles/camera.css       src/styles/login.css
src/styles/dashboard.css
```
