# SSM Frontend — Session Notes
> บันทึกงานที่ทำเสร็จ + ปัญหาที่พบ + วิธีแก้  
> วันที่ทำงาน: 2026-05-26  
> Deadline presentation: 2026-05-29 (พฤหัส)

---

## งานที่ทำเสร็จในเซสชันนี้

### Polish Backlog (รอบแรก)
| งาน | ไฟล์ที่แก้ |
|-----|-----------|
| Topbar breadcrumb เต็ม path | `Topbar.tsx` |
| Sidebar active state nested routes | `Sidebar.tsx` |
| Rack List จัดกลุ่มตาม site | `RacksListPage.tsx`, `sites.css` |
| Camera Detail page + ping history chart | `CameraDetailPage.tsx`, `camera.css` |
| BACKEND_READY_NOTES.md | `BACKEND_READY_NOTES.md` |
| Building cross-section SVG 3D view | `BuildingDetailPage.tsx`, `sites.css` |
| Floor Plan drag-and-drop camera repositioning | `FloorPlanPage.tsx` |

### รอบสอง (stability + features)
| งาน | ไฟล์ที่แก้ |
|-----|-----------|
| ESC global → navigate back | `AppLayout.tsx` |
| Floor plan zoom (wheel, button, keyboard) | `FloorPlanPage.tsx`, `floor.css` |
| Click floor plan to add camera | `FloorPlanPage.tsx` |
| Site Map top-view SVG (Cards / Map toggle) | `SitesPage.tsx` |
| NVR Detail page | `NVRDetailPage.tsx`, `camera.css` |
| Switch Detail page + port map | `SwitchDetailPage.tsx`, `camera.css` |
| NVR/Switch list clickable rows | `NVRsPage.tsx`, `SwitchesPage.tsx` |
| Breadcrumb สำหรับ NVR/Switch detail | `Topbar.tsx` |

---

## ปัญหาที่พบ + วิธีแก้

### 1. `React.ElementType` หาไม่เจอใน Sidebar
**ปัญหา:** เขียน `icon: React.ElementType` ใน NavItem interface แต่ไม่ได้ import `React` namespace  
**Error:** `Cannot find namespace 'React'`  
**แก้:** เปลี่ยนเป็น `import type { ElementType } from 'react'` แล้วใช้ `icon: ElementType`

---

### 2. Edit tool หา string ไม่เจอ (whitespace ต่าง)
**ปัญหา:** copy string มาแก้แต่มี whitespace/newline ไม่ตรง tool ก็ error  
**แก้:** ใช้ Grep หา line number ก่อน → Read offset ที่ line นั้น → copy exact string จากผลลัพธ์

---

### 3. Write tool ต้อง Read ก่อนเสมอ (ถ้าไฟล์มีอยู่แล้ว)
**ปัญหา:** พยายาม Write ทับ `BACKEND_READY_NOTES.md` ที่มีอยู่แล้วโดยไม่ Read → tool error  
**แก้:** Read ไฟล์ก่อนเสมอ แม้จะไม่ได้ใช้เนื้อหา แล้วค่อย Write ทับ

---

### 4. Playwright ไม่ได้ติดตั้ง
**ปัญหา:** `node -e "require('playwright')"` fail  
**แก้:**
```bash
npm install --prefix "C:\ai-playground\Frontend" playwright --save-dev
npx playwright install chromium
```

---

### 5. Port conflict — dev server ใช้ port 3003
**ปัญหา:** `npm run dev` พยายาม 3001 → 3002 → 3003 เพราะ port ก่อนหน้าถูก occupy  
**ไม่ใช่ bug** แค่ Vite fallback อัตโนมัติ ใช้ http://localhost:3003 ได้เลย

---

### 6. `ping-stats` เป็น `flex` แต่ใส่ `gridTemplateColumns` inline ไม่ work
**ปัญหา:** NVRDetailPage ใช้ `className="ping-stats" style={{ gridTemplateColumns: ... }}`  
แต่ `.ping-stats` ใน camera.css เป็น `display: flex` → `gridTemplateColumns` ถูก ignore  
**แก้:** สร้าง class ใหม่ `.stats-grid` ที่เป็น `display: grid; grid-template-columns: repeat(3, 1fr)`  
แล้วใช้ class นั้นแทน

---

### 7. Canvas-tools + bldg-view-toggle ไม่มี CSS
**ปัญหา:** ใช้ class `.canvas-tools` และ `.bldg-view-toggle` ใน JSX แต่ไม่ได้เพิ่ม CSS  
→ ปุ่ม zoom และ toggle ไม่มี style  
**แก้:**
- `.canvas-tools` + `.ct-group` + `.ct-label` → เพิ่มใน `floor.css`
- `.bldg-view-toggle` → เพิ่มใน `sites.css`

---

### 8. Drag + Zoom interaction — delta คำนวณผิด
**ปัญหา:** ตอน zoom ≠ 1 การลาก camera เลื่อนผิดระยะ เพราะ mouse delta เป็น screen pixels  
แต่ camera position เป็น logical pixels (ก่อน zoom)  
**แก้:** หาร delta ด้วย zoom factor ก่อนเพิ่มใน position:
```ts
const dx = (e.clientX - dragging.current.startX) / zoom
const dy = (e.clientY - dragging.current.startY) / zoom
```

---

### 9. Click หลัง drag ทำให้เพิ่ม camera โดยไม่ตั้งใจ
**ปัญหา:** `onClick` บน canvas fire ต่อจาก drag release → วาง camera ผิดที่  
**แก้:** ใช้ `wasDragged` ref ติดตามว่า mouse เคลื่อนเกิน 3px ระหว่าง mousedown-mouseup หรือไม่  
ถ้าใช่ → skip `onClick` ครั้งนั้น

---

### 10. ESC ทำงานซ้ำซ้อน (global vs local)
**ปัญหา:** AppLayout มี global ESC handler (navigate back)  
FloorPlanPage ต้องการให้ ESC ออกจาก Edit mode ก่อน ไม่ใช่ navigate ออกทันที  
**แก้:** FloorPlanPage ใช้ `addEventListener('keydown', handler, true)` (capture phase)  
ซึ่ง fire ก่อน global handler และเรียก `e.stopImmediatePropagation()` ถ้าอยู่ใน edit mode

---

## State ปัจจุบันของ Frontend

### Pages ทั้งหมด (ครบแล้ว)
```
/ (Login)                    ✅
/dashboard/topology          ✅
/dashboard/sites/:siteId     ✅  Cards + Site Map toggle
/dashboard/buildings/:id     ✅  List + Cross-section toggle
/dashboard/floors/:id        ✅  Zoom + drag cam + add cam
/dashboard/racks             ✅  จัดกลุ่ม site
/dashboard/racks/:rackId     ✅
/dashboard/cameras           ✅
/dashboard/cameras/:id       ✅  Ping chart + uptime
/dashboard/nvrs              ✅
/dashboard/nvrs/:id          ✅  Channel sparkline + storage
/dashboard/switches          ✅
/dashboard/switches/:id      ✅  Port map + PoE stats
/dashboard/users             ✅  admin only
```

### ที่ยังรอ backend
ดู `BACKEND_READY_NOTES.md` — 5 fixes ต้องเสร็จก่อนถึงจะ wire React Query hooks ได้

---

## Keyboard Shortcuts (ทั่วแอป)
| Key | ทำอะไร |
|-----|--------|
| `Esc` | Navigate back (ยกเว้นใน input/textarea) |
| `Esc` (ใน Edit mode) | ออก Edit mode ก่อน แล้ว Esc อีกทีถึงจะ back |
| `+` / `=` | Zoom in (Floor Plan) |
| `-` | Zoom out (Floor Plan) |
| `0` | Reset zoom 100% (Floor Plan) |
| Scroll wheel | Zoom in/out (Floor Plan) |
