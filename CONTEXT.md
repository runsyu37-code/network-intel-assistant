# CONTEXT — frontend branch

> สำหรับ AI: อ่านไฟล์นี้จบแล้วรู้ทุกอย่างที่ต้องทำใน branch นี้

---

## branch นี้คืออะไร

**React Web App — SSM Surveillance Monitor UI**
Frontend ของระบบ SSM แสดงผล hierarchy ของอุปกรณ์ CCTV
เชื่อมกับ C# REST API (branch: `backend`)

---

## Stack

| Library | หน้าที่ |
|---|---|
| `React + Vite` | framework หลัก |
| `React Router v6` | nested routes ตาม hierarchy |
| `Ant Design` | UI components (Table/Form/Modal/Breadcrumb) |
| `React Flow` | Topology diagram (Home page) |
| `Konva.js` | Floor plan drag-drop camera icons |
| `Recharts` | กราฟ ping history ใน Device detail |
| `Axios` | เรียก C# REST API |
| `useState / useContext` | State management |

---

## สถานะตอนนี้ (อัปเดต 2026-05-25)

| ส่วน | สถานะ |
|---|---|
| UI spec ทุก layer | ✅ ครบแล้ว |
| Stack ตัดสินใจแล้ว | ✅ React + Vite + Ant Design |
| Backend API ครบ + ทดสอบผ่าน | ✅ พร้อมให้ frontend เรียก |
| GET filter ทุก endpoint | ✅ ครบหมดแล้ว (ตรวจสอบแล้ว 2026-05-25) |
| React project setup | ❌ ยังไม่เริ่ม |
| Implementation | ❌ ยังไม่เริ่ม |

---

## UI Hierarchy

```
Home (Topology diagram)
 └── Site (Isometric overview → กด building)
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
│  (ทุก layer)    │──────────────────────────────│
│                 │  Content                     │
│ 🗺 Sites        │                              │
│ 📱 My Devices   │                              │
└─────────────────┴──────────────────────────────┘
```

---

## UI Spec แต่ละ Layer

| Layer | รูปแบบ |
|---|---|
| Home | Topology diagram — HQ center, Sites เชื่อมต่อ, เส้น = network connection |
| Site | Isometric top view ทุกตึก → กด building → isometric detail |
| Floor | Floor plan + camera icons, View/Edit mode, toggle แสดง/ซ่อน |
| Room | Rack cabinet view (เฉพาะห้องที่มี rack) |
| Rack | Rack diagram U-position, add/edit/delete device |
| Device | Status, IP, MAC, S/N, OS, Ping graph, Alerts list |

→ ดูรายละเอียดเต็มที่ `FRONTEND_PLAN.md` และ `WIREFRAME_BRIEF.md`

---

## Backend API — พร้อมใช้งานทั้งหมด

Base URL: `https://localhost:44342`

| ต้องการ | Endpoint | สถานะ |
|---|---|---|
| Sites ทั้งหมด | `GET /api/GetSites` | ✅ |
| Buildings ของ Site | `GET /api/GetBuildings?Site_ID=` | ✅ |
| Floors ของ Building | `GET /api/GetFloors?Building_ID=` | ✅ |
| Rooms ของ Floor | `GET /api/GetRooms?Floor_ID=` | ✅ |
| Racks ของ Room | `GET /api/GetRacks?Room_ID=` | ✅ |
| NVRs ของ Rack | `GET /api/GetNvrs?Rack_ID=` | ✅ |
| Switches ของ Rack | `GET /api/GetPoeSwitches?Rack_ID=` | ✅ |
| Cameras ของ Floor | `GET /api/GetCameras?Floor_ID=` | ✅ |
| Search devices | `GET /api/GetDevices?device_type=&Site_ID=&status=` | ✅ |

HTTP Method convention: GET ใช้ `GET`, ทุกอย่างอื่น (Save/Update/Delete) ใช้ `POST`

---

## งานที่ต้องทำ (ตามลำดับ)

```
1. ✅ UI spec ครบ
2. ✅ Backend GET filter ครบ
3. ❌ Setup React + Vite project ใน C:\ai-playground\Frontend
4. ❌ Implement Sidebar + Breadcrumb layout (Ant Design)
5. ❌ Implement Home — Topology diagram (React Flow)
6. ❌ Implement Site list + Site overview (Isometric)
7. ❌ Implement Floor layer — Konva.js floor plan
8. ❌ Implement Room + Rack layers
9. ❌ Implement Device detail
10. ❌ Alert propagation ทุก layer
```

## MVP Scope (เริ่มจากนี้ก่อน)

1. Login
2. Dashboard — hierarchy tree (Site → Building → Floor → Room → Rack → Device) + status
3. Device list + filter (ใช้ GetDevices)
4. Device detail page
5. Realtime status polling ทุก 30 วินาที

---

## หมายเหตุสำคัญ

- Frontend อยู่ที่ `C:\ai-playground\Frontend` (แยก folder จาก backend)
- Backend อยู่ที่ `C:\ai-playground\API` branch `backend`
- ทดสอบ backend ด้วย Bruno ที่ `C:\ai-playground\API\bruno\`
