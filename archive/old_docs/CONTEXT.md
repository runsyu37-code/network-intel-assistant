# CONTEXT — frontend branch

> สำหรับ AI: อ่านไฟล์นี้จบแล้วรู้ทุกอย่างที่ต้องทำใน branch นี้

> **ภาษา:** ตอบเป็นภาษาไทยเสมอ — ยกเว้นไฟล์ .md ที่จะนำไปใช้กับ AI อื่น (เช่น bolt.new, Claude Design) ให้เขียนเป็นภาษาอังกฤษเท่านั้น

---

## branch นี้คืออะไร

**React Web App — SSM Surveillance Monitor UI**
Frontend ของระบบ SSM แสดงผล hierarchy ของอุปกรณ์ CCTV
เชื่อมกับ C# REST API (branch: `backend`)

---

## Stack

| Library | หน้าที่ |
|---|---|
| `React + Vite + TypeScript` | framework หลัก |
| `React Router v6` | nested routes ตาม hierarchy |
| `Ant Design` | UI components (Table/Form/Modal/Breadcrumb) |
| `Zustand` | Global state (auth, user role) |
| `React Query (TanStack)` | Server state + caching + polling |
| `Axios` | เรียก C# REST API พร้อม JWT interceptor |
| `React Flow` | Topology diagram (Home page) |
| `Konva.js` | Floor plan drag-drop camera icons |
| `Recharts` | กราฟ ping history ใน Device detail |

---

## สถานะตอนนี้ (อัปเดต 2026-05-25)

| ส่วน | สถานะ |
|---|---|
| UI spec ทุก layer | ✅ ครบแล้ว |
| Stack ตัดสินใจแล้ว | ✅ React + Vite + Ant Design |
| Backend CRUD API (Phase 6) | ✅ 13 controllers ทดสอบผ่านหมด |
| GET filter ทุก endpoint | ✅ ครบหมดแล้ว |
| **Backend Week 0 prep** | ❌ **ยังไม่ได้ทำ — blocker หลัก** |
| React project setup | ❌ ยังไม่เริ่ม |
| Implementation | ❌ ยังไม่เริ่ม |

---

## ⚠️ Backend ต้องทำก่อน (Week 0) — Frontend รอสิ่งเหล่านี้

Backend ฝั่ง C# ยังขาดของที่จำเป็นสำหรับ React อยู่ ถ้าไม่ทำ React เรียก API ไม่ได้เลย

| # | งาน | ทำไมถึงบล็อก frontend |
|---|---|---|
| 1 | **CORS config** | Browser บล็อกทุก request จาก React ทันที |
| 2 | **JWT Auth + Login endpoint** | ไม่มี login = ไม่มี token = ทุก page พัง |
| 3 | **Rename endpoints** (ลบ `Get` prefix, kebab-case) | URL ที่ frontend จะใช้ต่างจาก URL ปัจจุบัน |
| 4 | **Swagger** | Generate TypeScript types อัตโนมัติจาก schema |
| 5 | **`GET /api/hierarchy/tree`** | Topology + Site overview ต้องการ 1 call ได้ nested data ทั้งหมด |
| 6 | **`GET /api/status/devices`** | Polling 30 วินาที — endpoint เบาสำหรับ status เท่านั้น |
| 7 | **`GET /api/{type}/{id}/breadcrumb`** | Breadcrumb component ต้องดึง path จาก API |
| 8 | **Schema: `cameras.position_x/y` + `floor_plans` table** | Floor plan layer ทำงานไม่ได้ถ้าไม่มี column นี้ |
| 9 | **Floor plan endpoints** (6-layer validation + TOCTOU) | Admin ลงทะเบียน floor plan ผ่าน UI |
| 10 | **`PATCH /api/cameras/{id}/position`** | Drag-drop camera บน floor plan บันทึกไม่ได้ |

> รายละเอียดเต็มอยู่ใน `FRONTEND_PLAN_REVIEW_V2_1.md` — Section 13 (MVP Roadmap) + Section 14 (Action Items)

---

## Frontend ทำได้ระหว่างรอ Backend Week 0

ไม่ต้องรอ backend เสร็จทุกอย่าง ทำส่วนนี้ไปก่อนได้เลย:

| งาน | เหตุผลที่ทำได้เลย |
|---|---|
| ✅ Setup React + Vite + TypeScript project | ไม่ต้องเรียก API |
| ✅ React Router setup + layout shell | ไม่ต้องเรียก API |
| ✅ Sidebar component (static ก่อน) | ไม่ต้องเรียก API |
| ✅ Breadcrumb component (static ก่อน) | ไม่ต้องเรียก API |
| ✅ Login page UI (form เท่านั้น ยังไม่ต่อ API) | รอ JWT endpoint |
| ✅ ต่อ wireframe pages ใน Claude Design | ไม่เกี่ยวกับ API |
| ✅ Topology page (React Flow + mock data hardcode) | ใช้ mock data ก่อน |
| ✅ Site list page (mock data) | ใช้ mock data ก่อน |

**ห้ามทำระหว่างรอ:** ส่วนที่ต้องเรียก API จริง เช่น auth flow, data fetching, polling, floor plan save

---

## UI Hierarchy

```
Home (Topology diagram)
 └── Site (Card list MVP → Isometric Phase 8)
      └── Building (Floor list MVP → Isometric Phase 8)
           └── Floor (Floor plan + camera icons)
                └── Room (Rack cabinets view)
                     └── Rack (Interactive rack diagram U-position)
                          └── Device (Status, IP, MAC, S/N, Ping, Alerts)
```

**Alert propagation:** device มีปัญหา → สีแดงลอยขึ้นทุก layer จนถึง Home

---

## Layout หลัก

```
┌─────────────────┬──────────────────────────────┐
│  SIDEBAR        │  Breadcrumb                  │
│  (dynamic per   │──────────────────────────────│
│   layer)        │  Content                     │
│ 🗺 Sites        │                              │
│ ⚡ Quick Add    │                              │
└─────────────────┴──────────────────────────────┘
```

Sidebar เปลี่ยนตาม layer ปัจจุบัน (Home → Sites list, Site → Buildings list, ฯลฯ)
"My Devices" เปลี่ยนชื่อเป็น **"Quick Add"** — shortcut สำหรับ technician เพิ่ม Camera

---

## UI Spec แต่ละ Layer

| Layer | รูปแบบ MVP | Phase 8 |
|---|---|---|
| Home | Topology diagram (React Flow) | — |
| Site | Card grid ของ buildings | Isometric 3D (Renderer Pattern) |
| Building | Floor list พร้อม status | Isometric cross-section |
| Floor | Floor plan + camera icons (Konva.js) | — |
| Room | Rack cabinet list | — |
| Rack | Rack diagram U-position | Sub U-position |
| Device | Status, IP, MAC, S/N, OS, Ping graph, Alerts | — |

> Isometric ใช้ **Renderer Pattern** — MVP ใช้ `renderer="cards"`, Phase 8 swap เป็น `renderer="isometric"`
> ดูรายละเอียดเต็มที่ `FRONTEND_PLAN.md`, `WIREFRAME_BRIEF.md`, `FRONTEND_PLAN_REVIEW_V2_1.md`

---

## Backend API — Endpoint ที่มีอยู่แล้ว (Phase 6)

Base URL: `https://localhost:44342`

| ต้องการ | Endpoint ปัจจุบัน | หลัง rename (Week 0) |
|---|---|---|
| Sites ทั้งหมด | `GET /api/GetSites` | `GET /api/sites` |
| Buildings ของ Site | `GET /api/GetBuildings?Site_ID=` | `GET /api/buildings?siteId=` |
| Floors ของ Building | `GET /api/GetFloors?Building_ID=` | `GET /api/floors?buildingId=` |
| Rooms ของ Floor | `GET /api/GetRooms?Floor_ID=` | `GET /api/rooms?floorId=` |
| Racks ของ Room | `GET /api/GetRacks?Room_ID=` | `GET /api/racks?roomId=` |
| NVRs ของ Rack | `GET /api/GetNvrs?Rack_ID=` | `GET /api/nvrs?rackId=` |
| Switches ของ Rack | `GET /api/GetPoeSwitches?Rack_ID=` | `GET /api/poe-switches?rackId=` |
| Cameras ของ Floor | `GET /api/GetCameras?Floor_ID=` | `GET /api/cameras?floorId=` |
| Search devices | `GET /api/GetDevices?device_type=&Site_ID=&status=` | `GET /api/devices?type=&siteId=&status=` |

**Endpoint ที่ยังไม่มี (Week 0 ต้องสร้าง):**
- `POST /api/auth/login` — JWT token
- `GET /api/hierarchy/tree` — nested JSON ทั้ง tree
- `GET /api/status/devices` — lightweight status สำหรับ polling
- `GET /api/{type}/{id}/breadcrumb` — breadcrumb path
- `GET/POST /api/floor-plans` — จัดการ floor plan images
- `PATCH /api/cameras/{id}/position` — บันทึก drag-drop position

HTTP Method: GET ใช้ `GET`, Save/Update/Delete ใช้ `POST` (team convention)

---

## MVP Scope (Phase 7 — ~6 สัปดาห์)

**Week 0:** Backend prep (ทำใน branch `backend`) ← **ทำอยู่ตอนนี้**
**Week 1:** React setup + Auth flow
**Week 2:** Layout + Topology + Site list
**Week 3:** Site Overview + Building Detail (CardListRenderer)
**Week 4:** Floor Plan (Konva.js) + Rack + Quick Add Camera
**Week 5:** Device Detail + Polling 30 วินาที
**Week 6:** Polish + Deploy

---

## หมายเหตุสำคัญ

- Frontend project อยู่ที่ `C:\ai-playground\Frontend` (แยก folder จาก backend)
- Backend อยู่ที่ `C:\ai-playground\API` branch `backend`
- ทดสอบ backend ด้วย Bruno ที่ `C:\ai-playground\API\bruno\`
- Camera position เก็บเป็น percentage (0.0–1.0) ไม่ใช่ pixel — robust ต่อการเปลี่ยน resolution ของ floor plan
- Floor plan image เก็บที่ `/uploads/floor_plans/` บน server, ไม่ใช่ใน DB
