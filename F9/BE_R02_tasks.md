# F9 Round 2 — Backend Tasks

> Frontend ได้ wire ทุก GET endpoint แล้ว รอบนี้ขอเพิ่ม:
> 1. CRUD mutations ที่ยังขาด
> 2. Hierarchy tree สำหรับหน้า Sites/Buildings/Floors
> 3. Floor plan image (authenticated)

---

## Priority 🔴 — CRUD ที่ frontend ต้องการ

### Cameras

```
POST   /api/cameras              ← สร้างใหม่
POST   /api/cameras/{id}         ← แก้ไข
POST   /api/cameras/delete/{id}  ← ลบ
```

**POST /api/cameras body:**
```json
{
  "device_name": "CAM-X-01",
  "ip_address": "192.168.1.200",
  "model": "Hikvision DS-2CD2T47G2",
  "install_location": "ทางเข้า",
  "NVR_ID": "NVR-HQ-01",
  "Site_ID": "S01",
  "Floor_ID": "a-f1"
}
```

**POST /api/cameras/{id} body (แก้เฉพาะที่ส่งมา):**
```json
{
  "device_name": "CAM-X-01",
  "ip_address": "192.168.1.200",
  "model": "Hikvision DS-2CD2T47G2",
  "install_location": "ทางเข้า",
  "NVR_ID": "NVR-HQ-01"
}
```

**POST /api/cameras/delete/{id}:** ไม่มี body → 200 OK

---

### NVRs

```
POST   /api/nvrs              ← สร้างใหม่
POST   /api/nvrs/{id}         ← แก้ไข  (id = NVR_ID string)
POST   /api/nvrs/delete/{id}  ← ลบ
```

**POST /api/nvrs body:**
```json
{
  "device_name": "NVR-NEW-01",
  "ip_internet": "192.168.1.50",
  "ip_cctv": "10.10.1.50",
  "model": "Hikvision DS-9632NXI",
  "total_channels": 32,
  "hdd_total_tb": 8.0,
  "retention_days": 30,
  "Site_ID": "S01",
  "Rack_ID": "rack-a1"
}
```

---

### PoE Switches

```
POST   /api/poe-switches              ← สร้างใหม่
POST   /api/poe-switches/{id}         ← แก้ไข  (id = SW_ID string)
POST   /api/poe-switches/delete/{id}  ← ลบ
```

**POST /api/poe-switches body:**
```json
{
  "device_name": "SW-NEW-01",
  "ip_address": "192.168.1.20",
  "model": "Cisco CBS350-24P",
  "total_ports": 24,
  "poe_budget_w": 370,
  "Site_ID": "S01",
  "Rack_ID": "rack-a1"
}
```

---

## Priority 🟡 — Hierarchy Tree

```
GET /api/hierarchy/tree
```

ใช้สำหรับหน้า Sites → Buildings → Floors (sidebar + navigation)

**Response format ที่ต้องการ:**
```json
[
  {
    "siteId": "S01",
    "siteName": "สำนักงานใหญ่",
    "siteCode": "HQ",
    "location": "Bangkok",
    "alertCount": 3,
    "totalDevices": 58,
    "buildings": [
      {
        "buildingId": "a",
        "siteId": "S01",
        "buildingName": "Building A",
        "buildingCode": "A",
        "floorCount": 6,
        "alertCount": 2,
        "floors": [
          {
            "floorId": "a-f1",
            "buildingId": "a",
            "floorNumber": 1,
            "floorName": "F1 — Lobby",
            "mainFunction": "lobby",
            "cameraCount": 8,
            "alertCount": 0
          }
        ]
      }
    ]
  }
]
```

---

## Priority 🟢 — Floor Plan Image

```
GET /api/floors/{floorId}/floor-plan/image
```

- ต้องการ JWT header (`Authorization: Bearer ...`)
- Response: binary image พร้อม `Content-Type: image/jpeg` หรือ `image/png`
- ถ้ายังไม่มีไฟล์จริง → ส่ง 404 ได้เลย frontend มี SVG fallback รอไว้

**Floor ID format:** `a-f1` ถึง `a-f6`, `b-f1` ถึง `b-f4` เป็นต้น

---

## หมายเหตุ Pattern ที่ตกลงกันไว้

| Pattern | ค่า |
|---|---|
| Create | `POST /api/{resource}` |
| Update | `POST /api/{resource}/{id}` |
| Delete | `POST /api/{resource}/delete/{id}` (ไม่ใช้ HTTP DELETE) |
| Auth | Bearer JWT ทุก endpoint ยกเว้น `/auth/login` |
| CORS | `localhost:3000`, `localhost:3001` (มีแล้วใน Web.config) |

---

> เมื่อ endpoint พร้อมแล้วแจ้ง frontend ได้เลย จะ wire ต่อทันที
