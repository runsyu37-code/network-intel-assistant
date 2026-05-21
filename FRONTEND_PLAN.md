# Frontend Plan — SSM Web App

> อัปเดตล่าสุด: 2026-05-21
> สถานะ: **กำลังวางแผน — UI layout ตัดสินใจแล้ว, รอ Ran อธิบายแต่ละ layer**

---

## โครงสร้าง Hierarchy (ที่ต้องแสดงผล)

```
Site
 └── Building
      └── Floor
           └── Room
                └── Rack
                     └── Devices (Camera / NVR / PoE Switch)
```

---

## UI Layout (ตัดสินใจแล้ว — 2026-05-21)

**Sidebar + Breadcrumb**

```
┌─────────────┬────────────────────────────────────┐
│  SIDEBAR    │  Site A > Building 1 > Floor 3     │ ← Breadcrumb
│             │────────────────────────────────────│
│ ▶ Site A    │  เนื้อหาของ Layer นั้น             │
│   Site B    │                                    │
│   Site C    │                                    │
└─────────────┴────────────────────────────────────┘
```

- **Sidebar** — แสดงรายการ Sites ทางซ้าย กดแล้วโหลดเนื้อหาฝั่งขวา
- **Breadcrumb** — บอก location ปัจจุบัน กดย้อนกลับได้
- Layer Building ลงไปแสดงฝั่งขวา ไม่ขยายใน Sidebar

---

## สิ่งที่ขาดใน Backend (ต้องเพิ่มก่อน frontend เริ่ม)

### GET by Parent Filter

ตอนนี้ GET คืนข้อมูลทั้งหมด — drill-down ต้องการ filter ตาม parent:

| Endpoint ที่ต้องเพิ่ม | ใช้ตอนไหน |
|---|---|
| `GET /api/Getbuildings?site_id=` | คลิกเข้า Site |
| `GET /api/Getfloors?building_id=` | คลิกเข้า Building |
| `GET /api/Getrooms?floor_id=` | คลิกเข้า Floor |
| `GET /api/Getracks?room_id=` | คลิกเข้า Room |
| `GET /api/Getcameras?rack_id=` | คลิกเข้า Rack |
| `GET /api/Getnvrs?rack_id=` | คลิกเข้า Rack |
| `GET /api/GetpoeSwitches?rack_id=` | คลิกเข้า Rack |

### GET by ID (Single Record)

| Endpoint ที่ต้องเพิ่ม | ใช้ตอนไหน |
|---|---|
| `GET /api/Getsites/{id}` | หน้า detail ของ Site |
| `GET /api/Getbuildings/{id}` | หน้า detail ของ Building |
| `GET /api/Getcameras/{id}` | หน้า detail ของ Camera |
| *(และทุก table ที่เหลือ)* | |

---

## สิ่งที่รอ Ran อธิบาย

### [ ] แต่ละ Layer แสดงผลยังไง?

| Layer | รอคำตอบ |
|---|---|
| **Site** | แสดงอะไรบ้าง? แค่รายชื่อ หรือมี map/สถานะด้วย? |
| **Building** | แสดงอะไร? มีรูปตึก หรือแค่ list floors? |
| **Floor** | แสดง floor plan มั้ย? หรือแค่ list rooms? |
| **Room** | แสดงอะไรใน room? racks และ devices? |
| **Rack** | แสดง devices ใน rack ยังไง? มี diagram rack มั้ย? |
| **Device (Camera)** | แสดงสถานะ online/offline, ping history, alerts? |
| **Device (NVR)** | แสดงอะไรบ้าง? กล้องที่ต่ออยู่? |
| **Device (PoE Switch)** | แสดง port status มั้ย? |

### [ ] Stack ที่จะใช้?

ยังไม่ได้ตัดสินใจ — รอ Ran หรือพี่เลี้ยงระบุ

### [ ] Design / Wireframe มีมั้ย?

พี่เลี้ยงมี mockup หรือ reference ที่ให้ดูมั้ย?

---

## งานที่จะทำหลังได้คำตอบ

- [ ] เพิ่ม GET filter ใน backend (13 tables)
- [ ] เพิ่ม GET by ID ใน backend
- [ ] ตัดสินใจ frontend stack
- [ ] สร้าง wireframe / component list
- [ ] เริ่ม implement
