# Frontend Plan — SSM Web App

> อัปเดตล่าสุด: 2026-05-22
> สถานะ: **UI spec ครบ + stack ตัดสินใจแล้ว — พร้อม implement**

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

## สิ่งที่ขาดใน Backend (ต้องเพิ่มก่อน implement)

### GET by Parent Filter

| Endpoint | ใช้ตอนไหน |
|---|---|
| `GET /api/Getbuildings?site_id=` | เข้า Site |
| `GET /api/Getfloors?building_id=` | เข้า Building |
| `GET /api/Getrooms?floor_id=` | เข้า Floor |
| `GET /api/Getracks?room_id=` | เข้า Room |
| `GET /api/Getcameras?rack_id=` | เข้า Rack |
| `GET /api/Getnvrs?rack_id=` | เข้า Rack |
| `GET /api/GetpoeSwitches?rack_id=` | เข้า Rack |

### GET by ID

| Endpoint | ใช้ตอนไหน |
|---|---|
| `GET /api/Get{table}/{id}` | Device detail (ทุก table) |

---

## Stack — Decided (2026-05-22)

> All decisions listed here are open to revision if the reviewer or future sessions provide facts or evidence that a different approach is better. Nothing is locked permanently.

**React**

| Library | Purpose | Status |
|---|---|---|
| `React Flow` | Topology diagram (Home page) | Decided |
| `Konva.js` | Floor plan drag-drop camera icons | Decided |
| `Recharts` | Ping history graph in Device detail | Decided |
| `Axios` | Call C# REST API | Decided |

---

## Deployment Scope — Decided (2026-05-22)

**Intranet only** — internal use within the organization. No internet access required.

---

## Role & Permissions — Decided (2026-05-22)

3 roles: Admin, User, Guest

| Feature | Admin | User | Guest |
|---|---|---|---|
| Home — topology diagram | ✅ | ✅ | ✅ |
| Site list | ✅ | ✅ | ✅ |
| Building view (isometric) | ✅ | ✅ | ✅ |
| See floor count per building | ✅ | ✅ | ✅ |
| Enter floor plan | ✅ | ✅ | ❌ |
| See camera name on floor plan | ✅ | ✅ (name only) | ❌ |
| See full camera detail | ✅ | ❌ | ❌ |
| Enter Room layer | ✅ | ❌ | ❌ |
| Enter Rack layer | ✅ | ❌ | ❌ |
| Add / Edit / Delete any data | ✅ | ❌ | ❌ |
| Manage users | ✅ | ❌ | ❌ |

**Summary:**
- **Admin** — full access to everything
- **User** — read-only, navigates down to floor plan, sees camera names only, cannot enter Room/Rack or view device details
- **Guest** — read-only, sees site/building/floor count only, cannot enter any floor plan

> Open to revision if reviewer recommends adjustments with supporting rationale.

---

## MVP Scope — Agreed for July Demo (2026-05-22)

Reviewer reality check: full scope (52 forms, 3 roles, realtime) requires 3–4 devs × 3 months. 1 person × 6 weeks = MVP only.

**MVP (must have for demo):**
- Login + JWT auth
- Dashboard — read-only hierarchy tree (Site → Building → Floor → Room → Rack → Device)
- Device list + filter
- Device detail page
- Realtime status via polling (every 30 seconds)

**Phase 7.5 (if time allows):**
- CRUD forms for Site, Building, Floor (3 tables)
- Basic RBAC (3 roles)

**After demo:**
- CRUD forms for remaining 10 tables
- Full user management UI
- Audit log

> Data entry for the demo will continue using Excel + SSMS (Phase 3 workflow) — no web form needed yet.

---

## Real-time Status — Decided (2026-05-22)

**Polling every 30 seconds** — frontend calls the API on a timer.

Chosen over WebSocket because:
- Backend is already a C# REST API — no server-side changes needed
- 30-second interval is acceptable for CCTV monitoring
- Simpler to implement and maintain

> Open to revision: if reviewer provides evidence that WebSocket or SignalR is significantly better for this use case, the decision can be reconsidered.

---

## Open Decisions — Reviewer Input Needed

| Area | Question | Current Thinking |
|---|---|---|
| **State Management** | Zustand / Context API / Redux? | Unknown — awaiting recommendation |
| **Routing** | React Router structure? How to map hierarchy to URLs? | Unknown — awaiting recommendation |
| **Isometric View** | Which library for Site/Building isometric rendering? | Unknown — awaiting recommendation |

---

## Pending

- [ ] Wireframe / mockup
- [ ] U-position spec (see .md at work notebook)

---

## Next Steps

- [ ] Add GET filter + GET by ID to backend (branch: `backend`)
- [ ] Set up React project
- [ ] Implement MVP layer by layer
