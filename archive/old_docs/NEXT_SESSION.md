# Next Session — Open Design Implementation

> อ่านไฟล์นี้จบแล้วเริ่มได้เลย ไม่ต้องถามบริบทเพิ่ม

---

## สถานะโปรเจกต์ (2026-05-27)

- **Branch:** `frontend` — latest commit `02d4566`
- **Dev server:** `npm run dev` → http://localhost:3001 (port 3000 มักถูกใช้งานอยู่)
- **Demo mode:** login ด้วย username/password อะไรก็ได้ถ้า backend offline
- **Backend API:** port 50680, ทุก endpoint พร้อมแล้วยกเว้น `GET /api/dashboard/summary` (กำลังสร้าง)

---

## งานของ session นี้: Open Design → React

### Workflow
```
open design/input/    ← Ran ส่งให้ Gemini ไปแล้ว
open design/output/   ← Gemini ส่งกลับมา (Ran drop ไว้ตรงนี้)
open design/done/     ← implement เสร็จแล้ว ย้ายมาที่นี่
```

### ขั้นตอน
1. อ่านไฟล์ใน `open design/output/` ว่า Gemini ส่งอะไรกลับมาบ้าง
2. อ่าน HTML นั้น → implement เป็น React + CSS ตาม stack เดิม
3. ย้ายไฟล์ output ที่ implement แล้วไป `open design/done/`

---

## ไฟล์ที่ส่งให้ Gemini แล้ว (อยู่ใน input/)

| ไฟล์ | หน้าที่จะ implement | Route |
|---|---|---|
| `screens_topology.html` | TopologyPage | `/dashboard/topology` |
| `screens_sites.html` | SitesPage | `/dashboard/sites/:siteId` |
| `screens_floor.html` | FloorPlanPage | `/dashboard/floors/:floorId` |
| `screens_nvr-detail.html` | NVRDetailPage | `/dashboard/nvrs/:nvrId` |
| `screens_switch-detail.html` | SwitchDetailPage | `/dashboard/switches/:swId` |
| `screens_users.html` | UsersPage | `/dashboard/users` |

---

## Stack ที่ต้องใช้

- **React 18 + Vite 6 + TypeScript**
- **Ant Design 5** — Form / Modal / Table เท่านั้น (ไม่ใช้สำหรับ layout)
- **CSS:** เขียนใน `src/styles/` — ไม่ใช้ Tailwind ไม่ใช้ inline style
- **Icons:** lucide-react เท่านั้น — ห้ามใช้ emoji
- **ห้ามใส่ comment ในโค้ด** ยกเว้นอธิบาย WHY ที่ไม่ชัดเจน
- **ตอบเป็นภาษาไทย** เสมอ

### CSS Tokens (light/dark)
```css
var(--bg)          /* พื้นหลังหลัก */
var(--surface)     /* card/panel */
var(--surface-2)   /* nested surface */
var(--border)      /* เส้นขอบ */
var(--ink)         /* ตัวหนังสือหลัก */
var(--ink-2)       /* secondary text */
var(--ink-3)       /* muted text */
var(--accent)      /* blue primary */
var(--ok)          /* green */
var(--warn)        /* yellow */
var(--alert)       /* red */
```

### CSS Files ที่มีอยู่แล้ว
```
src/styles/tokens.css      → CSS custom properties
src/styles/global.css      → reset + base
src/styles/layout.css      → sidebar, topbar, page-content
src/styles/topology.css    → topology page
src/styles/sites.css       → building/floor cards
src/styles/floor.css       → floor plan + camera overlays
src/styles/rack.css        → rack detail
src/styles/devicelist.css  → shared table styles (cameras/nvrs/switches)
src/styles/camera.css      → camera detail + ping chart
src/styles/login.css       → login page
```
เพิ่ม CSS ใหม่ได้ใน `src/styles/` แล้ว import ใน `src/index.css`

---

## Pages ที่ทำเสร็จแล้ว (อย่าแตะ)

| Route | File | สถานะ |
|---|---|---|
| `/login` | `LoginPage.tsx` | ✅ API connected |
| `/dashboard/topology` | `TopologyPage.tsx` | ✅ API connected |
| `/dashboard/sites/:siteId` | `SitesPage.tsx` | ✅ mock |
| `/dashboard/buildings/:id` | `BuildingDetailPage.tsx` | ✅ mock |
| `/dashboard/floors/:id` | `FloorPlanPage.tsx` | ✅ mock |
| `/dashboard/racks` | `RacksListPage.tsx` | ✅ mock |
| `/dashboard/racks/:rackId` | `RackDetailPage.tsx` | ✅ mock |
| `/dashboard/cameras` | `CamerasPage.tsx` | ✅ API connected |
| `/dashboard/cameras/:id` | `CameraDetailPage.tsx` | ✅ API connected |
| `/dashboard/nvrs` | `NVRsPage.tsx` | ✅ API connected |
| `/dashboard/nvrs/:id` | `NVRDetailPage.tsx` | ✅ mock |
| `/dashboard/switches` | `SwitchesPage.tsx` | ✅ API connected |
| `/dashboard/switches/:id` | `SwitchDetailPage.tsx` | ✅ mock |
| `/dashboard/users` | `UsersPage.tsx` | ✅ API connected |

---

## API ที่ใช้งานได้ (port 50680)

```ts
import client from '../api/client'

// ตัวอย่าง React Query hook
const { data } = useQuery({
  queryKey: ['cameras'],
  queryFn: () => getCameras(),
  refetchInterval: 30_000,
})
```

Functions พร้อมใช้ใน `src/api/`:
- `getCameras()`, `getCameraById(id)`, `getPingLogs(id)` — `cameras.ts`
- `getNvrs()` — `nvrs.ts`
- `getSwitches()` — `switches.ts`
- `getUsers()` — `users.ts`
- `getAlertLogs()`, `getDashboardSummary()` — `hierarchy.ts`

---

## สิ่งที่ต้องระวัง

- **Status mapping:** API ส่ง `"online"/"offline"/"warning"` → UI ใช้ `"ok"/"warn"/"alert"`
- **last_seen** เป็น UTC → ต้อง append `Z` ก่อน parse: `new Date(last_seen + 'Z')`
- **ping-logs / alert-logs** admin only → ถ้าได้ 403 ให้ fallback เป็น mock data
- **React Query queryFn** ต้อง wrap: `queryFn: () => getCameras()` ไม่ใช่ `queryFn: getCameras`

---

## เริ่มต้น session

```
1. อ่านไฟล์นี้จบ
2. ดูว่า open design/output/ มีไฟล์อะไรบ้าง
3. อ่าน HTML นั้น → implement ทีละไฟล์
4. npm run dev ถ้ายังไม่รัน
```
