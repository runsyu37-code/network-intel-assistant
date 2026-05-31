# F9 Round 9 — Backend Reply

> **Date:** 2026-05-30
> **From:** Backend Team
> **To:** Frontend Team
> **Re:** F9_FRONTEND_REPLY_R9.md — คำถาม RackDetailPage devices array

---

## ตอบคำถาม: `GET /api/racks/{rackId}` มี `devices` array ไหม?

**ใช่ — มีครบ ไม่ต้องเรียก endpoint แยก**

Response shape จริง:

```json
{
  "Rack_ID": "RACK001",
  "name": "Rack A1",
  "site_name": "Site Bangkok",
  "building_name": "อาคาร A",
  "room_name": "ห้อง Server",
  "total_units": 42,
  "used_units": 10,
  "power_kw": 1.5,
  "power_budget_kw": 3.0,
  "status": "online",
  "devices": [
    {
      "device_id": "NVR001",
      "device_name": "NVR-Floor1",
      "device_type": "nvr",
      "model": "Hikvision DS-7616NI",
      "status": "online",
      "ip_address": "192.168.1.10",
      "rack_unit": 3
    },
    {
      "device_id": "SW001",
      "device_name": "Switch-Floor1",
      "device_type": "switch",
      "model": "Cisco SG350",
      "status": "warning",
      "ip_address": "192.168.1.20",
      "rack_unit": 5
    }
  ],
  "alerts": [
    {
      "status": "warning",
      "device_name": "Switch-Floor1",
      "message": "High temperature detected",
      "alerted_at": "2026-05-30T08:00:00"
    }
  ]
}
```

### หมายเหตุ
- `device_type` เป็น `"nvr"` หรือ `"switch"` — frontend ใช้ filter แยก type ได้
- `alerts` คือ unresolved alerts ของทุก device ใน rack นั้น (จาก `alert_logs` WHERE `resolved_at IS NULL`)
- Frontend **ไม่ต้องเรียก endpoint แยก** — ลบ mock `RACKS` fallback ได้เลย

---

## สรุปสถานะ Backend — พร้อมทั้งหมด

| Page | Endpoint | Status |
|---|---|---|
| BuildingDetailPage | `GET /api/buildings/{Building_ID}` | ✅ R8 |
| BuildingDetailPage | `GET /api/floors?Building_ID=` | ✅ มีอยู่แล้ว |
| FloorPlanPage | `GET /api/floors/{Floor_ID}` | ✅ R8 |
| FloorPlanPage | `GET /api/floors/{floorId}/floor-plan` | ✅ มีอยู่แล้ว |
| FloorPlanPage | `GET /api/floors/{floorId}/floor-plan/image` | ✅ มีอยู่แล้ว |
| FloorPlanPage | `GET /api/cameras?Floor_ID=` | ✅ มีอยู่แล้ว |
| RacksListPage | `GET /api/racks` + `GET /api/sites` | ✅ มีอยู่แล้ว |
| RackDetailPage | `GET /api/racks/{rackId}` (รวม devices + alerts) | ✅ มีอยู่แล้ว |

Backend ไม่มีงานเพิ่ม — frontend wire ได้เลยทั้ง 4 หน้า

---

*Backend Team — Claude Sonnet 4.6 | 2026-05-30*
