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

## Real-time Status — Decided (2026-05-22)

**Polling every 5 seconds** — frontend calls the API repeatedly on a timer.

Chosen over WebSocket because:
- Backend is already a C# REST API — no server-side changes needed
- 5-second delay is acceptable for CCTV monitoring
- Simpler to implement and maintain

> Open to revision: if reviewer has evidence that WebSocket or Server-Sent Events is significantly better for this use case, the decision can be reconsidered.

---

## Open Decisions — Reviewer Input Needed

The following areas have not been decided due to limited knowledge. Reviewer is asked to recommend an approach and explain the reasoning so the decision can be made with facts.

| Area | Question | Current Thinking |
|---|---|---|
| **State Management** | Zustand / Context API / Redux? | Unknown — awaiting recommendation |
| **Routing** | React Router structure? How to map Site→Building→Floor hierarchy to URLs? | Unknown — awaiting recommendation |
| **Isometric View** | Which library for Site/Building isometric rendering? | Unknown — awaiting recommendation |

---

## Pending

- [ ] Wireframe / mockup
- [ ] U-position spec (see .md at work notebook)

---

## Next Steps

- [ ] Add GET filter + GET by ID to backend (branch: `backend`)
- [ ] Set up React project
- [ ] Implement layer by layer
