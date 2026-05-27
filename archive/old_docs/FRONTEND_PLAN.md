# Frontend Plan — SSM Web App

> อัปเดตล่าสุด: 2026-05-24
> สถานะ: **Backend เสร็จและทดสอบแล้ว — พร้อมเริ่ม frontend**

---

## Layout หลัก

**Sidebar + Breadcrumb**

```
┌─────────────────┬──────────────────────────────────┐
│  SIDEBAR        │  Site A > Building 1 > Floor 3   │ ← Breadcrumb
│  (ทุก layer)    │──────────────────────────────────│
│                 │  เนื้อหาของ layer นั้น            │
│ 🗺 Sites        │                                  │
│  ├── Site A     │                                  │
│  ├── Site B     │                                  │
│  └── Site C     │                                  │
│                 │                                  │
│ 📱 My Devices   │                                  │
│  └── + Add      │                                  │
└─────────────────┴──────────────────────────────────┘
```

- **Sites** — navigate hierarchy
- **My Devices** — permanent menu ทุก layer, กด Add กรอก IP/ข้อมูล sync อัตโนมัติ

---

## Alert Propagation (ทุก layer)

ถ้า device มีปัญหา สีแดงลอยขึ้นมาทุก layer:

```
Device offline
 → Rack 🔴 → Room 🔴 → Floor 🔴 → Building 🔴 → Site 🔴 → Topology 🔴
```

---

## UI แต่ละ Layer

### Home — Topology Diagram
- Network topology แบบ mindmap
- HQ อยู่ตรงกลาง Sites โยงออกมา
- เส้น = network connection จริง
- กด Site node → เข้า Site layer
- Sites ที่มี alert แสดง 🔴

---

### Site Layer
**ขั้น 1 — Overview**
- Isometric top view มองจากบนเฉียงๆ เห็นทุกตึกใน Site พร้อมกัน
- กด building ไหน → ขั้น 2

**ขั้น 2 — Building detail**
- Isometric view ของตึกนั้น เห็นชั้นตามจริง
- ไม่ต้องใส่เลขชั้น มองเห็นด้วยตาเปล่าได้
- ชั้นที่มี alert แสดงสีแดง
- กล้องนอกตึก → วาง icon บน building isometric ได้เลย
- กด floor → เข้า Floor layer

---

### Floor Layer
- แสดงผัง floor plan ของชั้นนั้น
- Camera icon วางตามตำแหน่งจริง
- กด icon กล้อง → เข้า Device layer

**2 modes:**

| Mode | ทำอะไรได้ |
|---|---|
| View (default) | ดูตำแหน่งกล้อง, toggle ซ่อน/แสดง icon |
| Edit (unlock) | ลาก icon กล้องย้ายตำแหน่ง, add กล้องใหม่ drop ลงผังได้เลย |

---

### Room Layer
- แสดงเฉพาะห้องที่มี rack (server room, network room)
- เห็นตู้ rack คล้ายตู้จริง
- กด rack → เข้า Rack layer

---

### Rack Layer
- Interactive rack diagram แสดงตาม U-position
- เห็นอุปกรณ์เรียงตาม slot จริง (NVR, Switch ฯลฯ)
- ช่องว่าง = กดวางอุปกรณ์ได้

| Action | ทำได้ |
|---|---|
| วาง | เลือก U ที่ว่าง → add อุปกรณ์ |
| แก้ | กดอุปกรณ์ → แก้ข้อมูล |
| ลบ | กด delete ออกจาก rack |

---

### Device Layer (Camera / NVR / PoE Switch)

| ข้อมูล | |
|---|---|
| Status | Online / Offline 🔴🟢 |
| IP | IP address |
| MAC | MAC address |
| S/N | Serial number |
| OS | Operating system |
| Ping history | กราฟ ping ย้อนหลัง |
| Alerts | รายการ alert ล่าสุด |

---

## สถานะ Backend (อัปเดต 2026-05-24)

✅ **Backend พร้อมแล้ว** — 13 controllers, CRUD ครบ, ทดสอบผ่านแล้ว
✅ Route ทุกตัว PascalCase: `GetSites`, `SaveSites`, `UpdateSites`, `DeleteSites`, ฯลฯ
✅ `GetDevices` — unified search ข้าม cameras/nvrs/poe_switches
✅ Delete hierarchy (sites/buildings/floors/rooms/racks) ลบ child devices อัตโนมัติ

### ⚠️ GET filter ที่อาจต้องเพิ่มระหว่าง implement

ตอนนี้ filter บาง endpoint ยังไม่ครบสำหรับ drill-down — ตรวจสอบตอนทำแต่ละหน้า:

| Endpoint ที่ต้องการ | มีแล้ว? |
|---|---|
| `GET /api/GetBuildings?Site_ID=` | ⚠️ ตรวจสอบ |
| `GET /api/GetFloors?Building_ID=` | ✅ มีแล้ว |
| `GET /api/GetRooms?Floor_ID=` | ⚠️ ตรวจสอบ |
| `GET /api/GetRacks?Room_ID=` | ⚠️ ตรวจสอบ |
| `GET /api/GetCameras?Floor_ID=` | ✅ มีแล้ว |
| `GET /api/GetNvrs?Rack_ID=` | ⚠️ ตรวจสอบ |
| `GET /api/GetPoeSwitches?Rack_ID=` | ⚠️ ตรวจสอบ |

> ถ้า filter ไหนขาด → เพิ่มใน backend branch แล้ว push ก่อน implement หน้านั้น

---

## Stack (ตัดสินใจแล้ว — อัปเดต 2026-05-24)

**React + Vite**

| ส่วน | Library | ใช้ทำอะไร |
|---|---|---|
| Build | `Vite` | เบา setup เร็ว |
| Routing | `React Router v6` | nested routes ตาม hierarchy |
| UI หลัก | `Ant Design` | Table/Form/Modal/Breadcrumb ครบ เหมาะ admin tool |
| Topology | `React Flow` | Topology diagram (Home page) |
| Floor plan | `Konva.js` | drag-drop camera icons บน floor plan |
| Graph | `Recharts` | Ping history graph ใน Device detail |
| HTTP | `Axios` | เรียก C# REST API |
| State | `useState / useContext` | scope เล็กพอ ไม่ต้อง Redux/Zustand |
| Realtime | polling ทุก 30 วินาที | ง่ายกว่า WebSocket ไม่ต้องแก้ backend |

---

## MVP Scope (สำหรับ demo)

1 คน 6 สัปดาห์ ทำได้เท่านี้:

**MVP (must have):**
- Login
- Dashboard — hierarchy tree (Site → Building → Floor → Room → Rack → Device) + status
- Device list + filter (ใช้ GetDevices)
- Device detail page
- Realtime status polling ทุก 30 วินาที

**Phase 7.5 (ถ้าเวลาพอ):**
- CRUD forms สำหรับ Site, Building, Floor
- Delete พร้อม confirm popup แจ้งว่าจะลบ child ด้วย

**หลัง demo:**
- CRUD ครบทุก 13 table
- User management
- Alert log management

---

## Route Structure

```
/login
/                          → Dashboard
/sites                     → รายการ sites
/sites/:siteId             → Buildings ใน site
/buildings/:buildingId     → Floors ใน building
/floors/:floorId           → Floor plan + cameras
/rooms/:roomId             → Racks ใน room
/racks/:rackId             → Rack diagram (switches + NVRs)
/devices                   → ค้นหา device ทุกประเภท
/alerts                    → Alert logs
/admin/users               → User management (admin only)
```

---

## งานถัดไป

- [ ] setup React + Vite project ใน `frontend` branch
- [ ] สร้าง skeleton: layout + routing + sidebar ทั้งหมด
- [ ] implement ทีละหน้าเริ่มจาก Dashboard → Sites → drill-down ลงไป
- [ ] ตรวจสอบ GET filter ที่ขาดระหว่าง implement แต่ละหน้า
