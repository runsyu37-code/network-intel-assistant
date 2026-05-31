# Session Log — Frontend 2026-06-01 (Session 6)

> Branch: `frontend` | เครื่อง: Home PC | Model: Claude Sonnet 4.6

---

## สิ่งที่ทำเสร็จในวันนี้

| # | งาน | ไฟล์ที่เปลี่ยน |
|---|---|---|
| 1 | Merge TopologyPage + SitesCrudPage → `SitesOverviewPage` (3-mode toggle: Topology / List / Grid) | `SitesOverviewPage.tsx` (ใหม่), ลบ `TopologyPage.tsx` + `SitesCrudPage.tsx` |
| 2 | Sites overview default zoom ออกให้กว้างขึ้น + แก้ bug fitView ยิงก่อน nodes โหลด → ใช้ `rfRef.fitView()` หลัง nodes set | `SitesOverviewPage.tsx` |
| 3 | Topology: คลิก site node → navigate ไป `/dashboard/map?site=` แทน SitesPage | `SiteNode.tsx` |
| 4 | List/Grid: คลิก site card/row → navigate ไป `/dashboard/map?site=` | `SitesOverviewPage.tsx` |
| 5 | BuildingMapPage zoom ใกล้ขึ้น (zoom 17) เมื่อ filter เจาะ site เดียวที่มีพิกัด | `BuildingMapPage.tsx` |
| 6 | Sidebar: "Building Map" ย้ายเป็น sub-item ใต้ "Sites" มี chevron พับ/กาง + auto-expand เมื่อเข้า path ที่เกี่ยวข้อง | `Sidebar.tsx`, `layout.css` |
| 7 | BuildingMapPage: เพิ่ม toggle **Map / List** (List แสดงตาราง อาคาร/Site/ชั้น/กล้อง/NVR/Alerts/GPS) | `BuildingMapPage.tsx` |
| 8 | BuildingMapPage: **Coordinate toolbar** — input paste lat,lng → flyTo + `Go` button | `BuildingMapPage.tsx` |
| 9 | BuildingMapPage: **Save View** button (admin) — บันทึก center+zoom ลง `localStorage['ssm.map.viewports'][siteId]` | `BuildingMapPage.tsx` |
| 10 | BuildingMapPage: **Restore viewport** อัตโนมัติเมื่อเข้า site — ถ้ามี saved ใช้เลย ถ้าไม่มีใช้ computed center | `BuildingMapPage.tsx` |
| 11 | BuildingMapPage: **Reset view** button (`RotateCcw`) — กลับไปยัง saved/computed viewport | `BuildingMapPage.tsx` |
| 12 | BuildingMapPage: **Create mode** (admin) — กดปุ่ม "+ เพิ่มตึก" → crosshair cursor → คลิกแผนที่ → modal กรอกชื่อ+Site → `createBuilding()` + `patchBuildingCoordinates()` | `BuildingMapPage.tsx` |
| 13 | BuildingMapPage: Create building — auto-generate Building ID (`B` + 6-char base36) ไม่ต้องกรอกเอง | `BuildingMapPage.tsx` |
| 14 | SitesOverviewPage: **Add Site** ปุ่มย้ายออกมา header ทุก viewMode (ไม่ต้องกด Edit ก่อน) | `SitesOverviewPage.tsx` |
| 15 | SitesOverviewPage: **Save View** topology — บันทึก ReactFlow viewport (`x,y,zoom`) ลง localStorage → restore ครั้งถัดไป | `SitesOverviewPage.tsx` |

---

## สถาปัตยกรรมที่เปลี่ยน

### Sites page — รวมเป็นหน้าเดียว

**ก่อน:**
- `/dashboard/topology` → `TopologyPage.tsx` (React Flow mindmap)
- `/dashboard/sites` → `SitesCrudPage.tsx` (ตาราง, admin-only RouteGuard)

**หลัง:**
- `/dashboard/topology` → ลบออก
- `/dashboard/sites` → `SitesOverviewPage.tsx` (3 mode, ทุก role เข้าได้, CRUD guard ผ่าน `canEdit()`)

### Navigation flow

```
Sites overview
  ├── Topology mode → คลิก site node → /dashboard/map?site={id}
  ├── List mode     → คลิก row       → /dashboard/map?site={id}
  └── Grid mode     → คลิก card      → /dashboard/map?site={id}

Building Map (/dashboard/map?site={id})
  ├── zoom 17, center = saved viewport หรือ average lat/lng ของอาคาร
  ├── คลิก marker → popup → View Building →
  └── /dashboard/buildings/{id}
```

---

## Bug ที่แก้

### fitView ยิงก่อน nodes โหลด

**อาการ:** เปลี่ยน padding ของ `fitViewOptions` แล้ว zoom ไม่เปลี่ยน

**สาเหตุ:** `fitView` prop ใน React Flow ยิงตอน component mount — ขณะนั้น nodes ยังว่างอยู่ (รอ API) พอ nodes มาทีหลัง viewport ไม่ปรับ

**วิธีแก้:** ใช้ `rfRef = useRef<ReactFlowInstance>` + `onInit` callback + `requestAnimationFrame(() => rfRef.current.fitView(...))` หลัง `setNodes()` ใน useEffect

---

## localStorage keys ที่ใช้

| Key | รูปแบบ | ใช้โดย |
|---|---|---|
| `ssm.topo.hq` | `{x,y}` | ตำแหน่ง HQ node บน topology |
| `ssm.topo.viewport` | `{x,y,zoom}` | มุมมอง topology ที่ save ไว้ |
| `ssm.map.viewports` | `Record<siteId, {lat,lng,zoom}>` | มุมมอง building map ต่อ site |
| `ssm.theme` | `'light'|'dark'` | Zustand theme persist |

---

## งานที่ยังค้างอยู่

| งาน | หมายเหตุ |
|---|---|
| Racks CRUD | ยัง wire ไม่ครบ — pattern เหมือน Cameras/NVRs |
| Fix Rack Detail loading | "Loading rack data…" เมื่อ navigate โดยตรง |
| Fix Racks sidebar badge | แสดง 6 แต่ list โชว์ 4 |
| `last_seen` จาก BE | gate Audit page (Phase 1) |
| `lat/lng` writable ผ่าน PATCH | gate Building Map markers |
| Import ข้อมูลจริงเข้า DB | ต้องอยู่หน้าเครื่อง / VLAN |
| PingService verify | ต้องทดสอบ hardware Phase 3 |
