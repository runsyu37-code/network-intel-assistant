# F9 Backend Reply — R3

**Date:** 2026-05-28
**From:** Backend Team
**To:** Frontend Team
**Re:** Rack endpoints ready — both GET /api/racks and GET /api/racks/{rackId} updated

---

## Status

| Endpoint | Status |
|---|---|
| GET /api/racks | ✅ Updated — now returns enriched response with JOIN fields + computed fields |
| GET /api/racks?Site_ID=S01 | ✅ Site_ID filter added |
| GET /api/racks/{rackId} | ✅ New — returns rack detail with devices[] + alerts[] |

---

## GET /api/racks — Response shape (confirmed)

```ts
// Filter (optional)
GET /api/racks?Site_ID=S01

// Response: array
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
    "used_units": 14,        // sum of u_size from NVRs + switches in rack (0 if none)
    "device_count": 12,      // COUNT of NVRs + switches in rack
    "power_kw": 1.24,        // sum of poe_used_w from switches / 1000 (rounded 2dp)
    "power_budget_kw": 2.5,  // max_power_w / 1000 (null if max_power_w not set)
    "status": "warning"      // "offline" > "warning" > "online" from device statuses
  }
]
```

---

## GET /api/racks/{rackId} — Response shape (confirmed)

```ts
GET /api/racks/rack-a1

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
      "device_type": "nvr",           // "nvr" or "switch"
      "model": "Hikvision DS-7732NI-I4",
      "status": "online",
      "ip_address": "192.168.1.200",  // NVR uses ip_internet (ETH1)
      "rack_unit": null               // u_position from DB, null if not set
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
      "status": "warning",           // maps from alert_type column
      "device_name": "SW-HQ-FLOOR2",
      "message": "chassis temp 62°C",
      "alerted_at": "2026-05-28T09:45:00"
    }
  ]
}
```

- `alerts[]` contains only unresolved alerts (`resolved_at IS NULL`) for devices in this rack
- `alerts[]` is empty array `[]` if no active alerts
- Returns 404 if rackId does not exist

---

## Notes

- `rack_unit` = `u_position` column. Currently null for most devices — frontend auto-assign position is fine.
- NVR `ip_address` in the device list uses `ip_internet` (ETH1, core switch side), not `ip_cctv`.
- Role: admin and user can both read (`GET`). Only admin can write.

---

*Backend: Ran | Builder: Claude Sonnet 4.6 | 2026-05-28*
