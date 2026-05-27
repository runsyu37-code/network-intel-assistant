# SSM Frontend — Backlog

> อัปเดต: 2026-05-27 | Branch: `frontend` | Commit: `99965a7`  
> Dev server: `npm run dev` → http://localhost:3000  
> Backend API: http://localhost:50680 (ต้องเปิด IIS Express ก่อน)

---

## สถานะ API

| Endpoint | สถานะ |
|---|---|
| `POST /api/auth/login` | ✅ Live |
| `GET /api/cameras` | ✅ Live |
| `GET /api/nvrs` | ✅ Live |
| `GET /api/poe-switches` | ✅ Live |
| `GET /api/users` | ✅ Live (admin only) |
| `GET /api/ping-logs` | ✅ Live (admin only) |
| `GET /api/alert-logs` | ✅ Live (admin only) |
| `GET /api/dashboard/summary` | ✅ Live (admin only) |
| `GET /api/sites` | ✅ Live |
| `GET /api/buildings` | ✅ Live |
| `GET /api/floors` | ✅ Live |
| `GET /api/floor-plans?Floor_ID=` | ✅ Live (inline base64) |
| `GET /api/rooms` | ✅ Live |
| `GET /api/racks` | ✅ Live |
| `GET /api/hierarchy/tree` | ✅ Live |
| `PATCH /api/cameras/{id}/position` | ✅ Live |

---

## Backlog งาน

### 🔴 Priority 1 — Open Design (รอ Gemini ส่งกลับ)

Gemini กำลัง refine HTML อยู่ — พอไฟล์มาถึงให้ drop ใน `open design/output/` แล้ว implement ทีละไฟล์

| Input file | หน้า React | Route | สถานะ |
|---|---|---|---|
| `screens_topology.html` | `TopologyPage.tsx` | `/dashboard/topology` | ⏳ รอ Gemini |
| `screens_sites.html` | `SitesPage.tsx` | `/dashboard/sites/:siteId` | ⏳ รอ Gemini |
| `screens_nvr-detail.html` | `NVRDetailPage.tsx` | `/dashboard/nvrs/:nvrId` | ⏳ รอ Gemini |
| `screens_switch-detail.html` | `SwitchDetailPage.tsx` | `/dashboard/switches/:swId` | ⏳ รอ Gemini |
| `screens_floor.html` | `FloorPlanPage.tsx` | `/dashboard/floors/:floorId` | ⏳ รอ Gemini |
| `screens_users.html` | `UsersPage.tsx` | `/dashboard/users` | ⏳ รอ Gemini |

**วิธีทำ:**
1. Gemini ส่ง HTML กลับ → drop ใน `open design/output/`
2. บอก Claude ว่า "implement ไฟล์ใน output/"
3. Claude อ่าน HTML → เขียน React + CSS
4. ย้ายไฟล์ที่ implement แล้ว → `open design/done/`

---

### 🟡 Priority 2 — Connect API (pages ที่ยัง mock)

Pages เหล่านี้ยังใช้ mock data — backend endpoint พร้อมแล้วทุกอัน

| Page | File | API ที่ต้อง wire |
|---|---|---|
| SitesPage | `SitesPage.tsx` | `GET /api/sites` + `GET /api/buildings?Site_ID=` |
| BuildingDetailPage | `BuildingDetailPage.tsx` | `GET /api/buildings/{id}` + `GET /api/floors?Building_ID=` |
| FloorPlanPage | `FloorPlanPage.tsx` | `GET /api/floors/{id}` + `GET /api/floor-plans?Floor_ID=` (base64 image) + `PATCH /api/cameras/{id}/position` |
| RacksListPage | `RacksListPage.tsx` | `GET /api/racks` + `GET /api/sites` |
| RackDetailPage | `RackDetailPage.tsx` | `GET /api/racks/{id}` + `GET /api/rooms` |
| NVRDetailPage | `NVRDetailPage.tsx` | `GET /api/nvrs?NVR_ID=xxx` (ไม่มี `/nvrs/{id}`) |
| SwitchDetailPage | `SwitchDetailPage.tsx` | `GET /api/poe-switches?SW_ID=xxx` (ไม่มี `/switches/{id}`) |

> **หมายเหตุ:** NVR/Switch ใช้ query param ไม่ใช่ path param เช่น `/api/nvrs?NVR_ID=NVR-001`

---

### 🟢 Priority 3 — Polish

| งาน | รายละเอียด |
|---|---|
| Alerts dropdown | Topbar ยังใช้ mock alerts 2 ตัว → wire กับ `GET /api/alert-logs` จริง |
| Sidebar device counts | ตัวเลขข้างเมนู (142 cameras ฯลฯ) ยัง hardcode → ดึงจาก `GET /api/dashboard/summary` |
| Floor plan image | ปัจจุบัน fallback เป็น SVG vector → wire กับ `GET /api/floor-plans?Floor_ID=` (base64) |
| User management | Edit / Deactivate user → ยังเป็น UI เฉยๆ ยังไม่มี API call |

---

## สิ่งที่ต้องรู้ก่อนทำงาน

### Backend API Notes
- **NVR / Switch single-item:** ใช้ `?NVR_ID=` / `?SW_ID=` ไม่ใช่ `/{id}`
- **Floor plan image:** `GET /api/floor-plans?Floor_ID=xxx` → response มี `image_data` (base64) + `image_type` (MIME)
  ```tsx
  const src = `data:${plan.image_type};base64,${plan.image_data}`
  ```
- **Status values:** API ส่ง `"online"/"offline"/"warning"` → UI map เป็น `"ok"/"warn"/"alert"`
- **last_seen UTC:** ต้อง append `Z` ก่อน parse → `new Date(ts + 'Z')`
- **Admin-only endpoints:** `ping-logs`, `alert-logs`, `dashboard/summary` → ถ้าได้ 403 ให้ fallback mock
- **React Query queryFn:** ต้อง wrap เสมอ → `queryFn: () => getCameras()` ไม่ใช่ `queryFn: getCameras`

### CORS / Dev Setup
- Vite proxy: `vite.config.ts` forward `/api` → `localhost:50680` อัตโนมัติ ไม่ต้องแก้อะไร
- Backend CORS config รองรับ `localhost:3000` อยู่แล้ว

### CSS Tokens
```css
var(--bg)       var(--surface)    var(--surface-2)
var(--border)   var(--ink)        var(--ink-2)      var(--ink-3)
var(--accent)   var(--ok)         var(--warn)        var(--alert)
```

### CSS Files
```
src/styles/tokens.css       src/styles/global.css
src/styles/layout.css       src/styles/topology.css
src/styles/sites.css        src/styles/floor.css
src/styles/rack.css         src/styles/devicelist.css
src/styles/camera.css       src/styles/login.css
```

### Stack Rules
- Layout: CSS custom เท่านั้น — ไม่ใช้ Ant Design layout, ไม่ใช้ Tailwind
- Icons: lucide-react เท่านั้น
- ห้ามใส่ comment ในโค้ดยกเว้น WHY ที่ไม่ชัดเจน
- ตอบเป็นภาษาไทย

---

## ไฟล์สำคัญ

```
src/api/types.ts          → TypeScript interfaces ทุก API type
src/api/client.ts         → axios instance, JWT interceptor, proxy baseURL = '/api'
src/api/auth.ts           → login(), extractJwtUser()
src/api/cameras.ts        → getCameras(), getCameraById(), getPingLogs()
src/api/nvrs.ts           → getNvrs()
src/api/switches.ts       → getSwitches()
src/api/users.ts          → getUsers()
src/api/hierarchy.ts      → getDashboardSummary(), getAlertLogs(), getHierarchyTree()
src/stores/authStore.ts   → user state { id, username, displayName, role }
vite.config.ts            → proxy config
```
