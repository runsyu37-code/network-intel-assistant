# F9 Round 3 — Rack Endpoints

> Frontend ต้องการ 2 endpoints เพื่อ wire หน้า Racks List + Rack Detail

---

## 1. GET /api/racks — Rack List

```
GET /api/racks
GET /api/racks?Site_ID=S01      ← filter by site (optional)
```

**Response (array):**
```json
[
  {
    "Rack_ID": "rack-a1",
    "name": "Rack A1",
    "Site_ID": "S01",
    "Building_ID": "a",
    "Floor_ID": "a-f2",
    "Room_ID": "server-room-f2",
    "room_name": "Server Room F2",
    "site_name": "HQ Bangkok",
    "building_name": "Building A",
    "total_units": 42,
    "used_units": 14,
    "device_count": 12,
    "power_kw": 1.24,
    "power_budget_kw": 2.5,
    "status": "warning"
  }
]
```

**หมายเหตุ fields:**
| Field | มาจากไหน |
|---|---|
| `Rack_ID`, `name`, `total_units` | ตาราง racks ตรงๆ |
| `max_power_w` → `power_budget_kw` | `max_power_w / 1000` |
| `room_name`, `site_name`, `building_name` | JOIN rooms / sites / buildings |
| `used_units` | นับ U จาก NVRs + switches ใน rack (ถ้าไม่มีข้อมูล → ส่ง 0) |
| `device_count` | นับ NVRs + switches ที่มี Rack_ID ตรงกัน |
| `power_kw` | sum PoE used จาก switches ใน rack (ถ้าไม่มี → ส่ง 0) |
| `status` | `"online"/"warning"/"offline"` — derive จาก device status ใน rack |

---

## 2. GET /api/racks/{rackId} — Rack Detail with Devices

```
GET /api/racks/{rackId}
```

**Response:**
```json
{
  "Rack_ID": "rack-a1",
  "name": "Rack A1",
  "site_name": "HQ Bangkok",
  "building_name": "Building A",
  "room_name": "Server Room F2",
  "total_units": 42,
  "used_units": 14,
  "power_kw": 1.24,
  "power_budget_kw": 2.5,
  "status": "warning",
  "devices": [
    {
      "device_id": "NVR-HQ-01",
      "device_name": "NVR-HQ-01",
      "device_type": "nvr",
      "model": "Hikvision DS-7732NI-I4",
      "status": "online",
      "ip_address": "192.168.1.200",
      "rack_unit": null
    },
    {
      "device_id": "SW-HQ-CORE",
      "device_name": "Core Switch HQ",
      "device_type": "switch",
      "model": "Cisco SG350X-24P",
      "status": "online",
      "ip_address": "192.168.1.2",
      "rack_unit": null
    }
  ],
  "alerts": [
    {
      "status": "warning",
      "device_name": "SW-HQ-FLOOR2",
      "message": "chassis temp 62°C",
      "alerted_at": "2026-05-28T09:45:00"
    }
  ]
}
```

**หมายเหตุ `devices` array:**
- รวม NVRs ทุกตัวที่มี `Rack_ID = rackId` + PoE Switches ทุกตัวที่มี `Rack_ID = rackId`
- `device_type`: `"nvr"` หรือ `"switch"`
- `rack_unit`: ถ้า DB ยังไม่มี column นี้ → ส่ง `null` ได้เลย frontend จะ auto-assign position เอง
- `alerts`: ดึงจาก alert_logs ที่ยังไม่ resolved (`resolved_at IS NULL`) ของ devices ใน rack นี้

---

## สรุปงานที่ต้องทำ

| Task | ความยาก |
|---|---|
| Query racks + JOIN rooms/sites/buildings | ง่าย |
| นับ device_count จาก nvrs + poe_switches | ง่าย |
| Derive status จาก device status | ง่าย |
| รวม devices (NVR + Switch) ใน rack detail | กลาง |
| ดึง alerts ของ rack | ง่าย (query alert_logs by device_id) |
| rack_unit position | ข้ามได้ → ส่ง null |

---

> แจ้ง frontend เมื่อพร้อม จะ wire ต่อทันที
> Response type ที่ frontend จะ add ใน `src/api/types.ts` รอ backend confirm shape ก่อน
