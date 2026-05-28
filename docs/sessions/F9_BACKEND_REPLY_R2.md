# F9 Backend Reply — R2

**Date:** 2026-05-28
**From:** Backend Team
**To:** Frontend Team
**Re:** ทุก endpoint ที่ขอมีอยู่แล้วในระบบ — ไม่มีงานเพิ่มฝั่ง backend

---

## สรุป — ไม่ต้องรอ backend

| Priority | Endpoint | สถานะ |
|---|---|---|
| 🔴 POST /api/cameras | ✅ มีอยู่แล้ว |
| 🔴 POST /api/cameras/{id} | ✅ มีอยู่แล้ว |
| 🔴 POST /api/cameras/delete/{id} | ✅ มีอยู่แล้ว |
| 🔴 POST /api/nvrs | ✅ มีอยู่แล้ว |
| 🔴 POST /api/nvrs/{NVR_ID} | ✅ มีอยู่แล้ว |
| 🔴 POST /api/nvrs/delete/{NVR_ID} | ✅ มีอยู่แล้ว |
| 🔴 POST /api/poe-switches | ✅ มีอยู่แล้ว |
| 🔴 POST /api/poe-switches/{SW_ID} | ✅ มีอยู่แล้ว |
| 🔴 POST /api/poe-switches/delete/{SW_ID} | ✅ มีอยู่แล้ว |
| 🟡 GET /api/hierarchy/tree | ✅ มีอยู่แล้ว — response shape ตรงทุก field |
| 🟢 GET /api/floors/{floorId}/floor-plan/image | ✅ มีอยู่แล้ว — binary blob |

---

## ⚠️ สิ่งที่ต้องรู้ก่อน wire — Create ใช้ array body

**Create (POST ไม่มี ID)** — body ต้องเป็น **array** เสมอ แม้สร้างทีละตัว:

```ts
// Cameras
await axios.post('/api/cameras', [{
  device_name: 'CAM-X-01',
  ip_address: '192.168.1.200',
  NVR_ID: 'NVR-HQ-01',
  Site_ID: 'S01',
  Floor_ID: 'a-f1',
  // ...fields อื่นๆ
}]);

// NVRs
await axios.post('/api/nvrs', [{
  NVR_ID: 'NVR-NEW-01',   // ← ต้องใส่ NVR_ID ด้วย (required)
  device_name: 'NVR-NEW-01',
  ip_internet: '192.168.1.50',
  ip_cctv: '10.10.1.50',
  Site_ID: 'S01',
  // ...
}]);

// PoE Switches
await axios.post('/api/poe-switches', [{
  SW_ID: 'SW-NEW-01',   // ← ต้องใส่ SW_ID ด้วย (required)
  device_name: 'SW-NEW-01',
  ip_address: '192.168.1.20',
  Site_ID: 'S01',
  // ...
}]);
```

**Update (POST มี ID)** — single object ตามปกติ ✅

```ts
await axios.post(`/api/cameras/${id}`, {
  device_name: 'CAM-X-01-updated',
  NVR_ID: 'NVR-HQ-02',
  // ส่งแค่ field ที่แก้ก็ได้
});
```

---

## Hierarchy Tree — response ตรงกับที่ขอทุก field

```
GET /api/hierarchy/tree
```

DTO ที่ backend ส่งมา field names ตรงทุกอย่าง:
`siteId`, `siteName`, `siteCode`, `location`, `alertCount`, `totalDevices`,
`buildings[]` → `buildingId`, `buildingName`, `buildingCode`, `floorCount`, `alertCount`,
`floors[]` → `floorId`, `buildingId`, `floorNumber`, `floorName`, `mainFunction`, `cameraCount`, `alertCount`

wire ได้เลยไม่ต้องแปลง field

---

## Floor Plan Image — blob พร้อมใช้

```
GET /api/floors/{floorId}/floor-plan/image
Authorization: Bearer <token>
```

- Response: binary blob, `Content-Type: image/png` หรือ `image/jpeg`
- ถ้าไม่มีไฟล์ → 404 (frontend มี SVG fallback อยู่แล้ว)
- Floor ID format: `a-f1`, `b-f3` ฯลฯ

```ts
const res = await axios.get(`/api/floors/${floorId}/floor-plan/image`, {
  responseType: 'blob',
  headers: { Authorization: `Bearer ${token}` }
});
const url = URL.createObjectURL(res.data);
```

---

*Backend: Ran | Builder: Claude Sonnet 4.6 | 2026-05-28*
