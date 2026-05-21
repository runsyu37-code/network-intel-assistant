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
| `React` | framework หลัก |
| `React Flow` | Topology diagram (Home page) |
| `Konva.js` | Floor plan drag-drop camera icons |
| `Recharts` | กราฟ ping history ใน Device detail |
| `Axios` | เรียก C# REST API |

---

## สถานะตอนนี้

| ส่วน | สถานะ |
|---|---|
| UI spec ทุก layer | ✅ ครบแล้ว |
| Stack ตัดสินใจแล้ว | ✅ React |
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

→ ดูรายละเอียดเต็มที่ `FRONTEND_PLAN.md`

---

## ข้อมูลมาจากไหน

API ทั้งหมดมาจาก C# backend (branch: `backend`)
Base URL: `https://localhost:44342`

| ต้องการ | Endpoint |
|---|---|
| Sites ทั้งหมด | `GET /api/Getsites` |
| Buildings ของ Site | `GET /api/Getbuildings?site_id=` ⚠️ ยังไม่มี |
| Floors ของ Building | `GET /api/Getfloors?building_id=` ⚠️ ยังไม่มี |
| Rooms ของ Floor | `GET /api/Getrooms?floor_id=` ⚠️ ยังไม่มี |
| Racks ของ Room | `GET /api/Getracks?room_id=` ⚠️ ยังไม่มี |
| Devices ของ Rack | `GET /api/Get{device}?rack_id=` ⚠️ ยังไม่มี |
| Device detail | `GET /api/Get{table}/{id}` ⚠️ ยังไม่มี |

> ⚠️ = ต้องให้ backend เพิ่มก่อน — แก้ที่ branch `backend` ก่อน implement frontend

---

## งานที่ต้องทำ (ตามลำดับ)

```
1. ✅ UI spec ครบ
2. ⏳ รอ backend เพิ่ม GET filter + GET by ID
3. ❌ Setup React project (create-react-app หรือ Vite)
4. ❌ Implement Sidebar + Breadcrumb layout
5. ❌ Implement Home — Topology diagram (React Flow)
6. ❌ Implement Site layer — Isometric view
7. ❌ Implement Floor layer — Konva.js floor plan
8. ❌ Implement Room + Rack layers
9. ❌ Implement Device detail
10. ❌ Alert propagation ทุก layer
```
