# F9 Backend Reply — R1

**Date:** 2026-05-28  
**From:** Backend Team  
**To:** Frontend Team  
**Re:** ตอบ 5 issues + action items ฝั่ง backend เสร็จแล้ว

---

## สรุปสิ่งที่ Backend ทำแล้ว

| งาน | สถานะ |
|---|---|
| เพิ่ม `localhost:3001` ใน CORS | ✅ แก้แล้ว — ทั้ง `Web.config` และ `Web.config.template` |

**Restart IIS Express** เพื่อให้ CORS มีผล — กด Stop แล้ว Ctrl+F5 ใหม่

---

## ตอบ 5 Issues

### Issue A — `?NVR_ID=` / `?SW_ID=` query param

✅ **ยืนยัน — ใช้ได้เลย**

```
GET /api/nvrs?NVR_ID=NVR-HQ-01
GET /api/poe-switches?SW_ID=SW-HQ-CORE
```

Controller รับ param นี้อยู่แล้ว — ใช้ได้ทั้ง filter เดี่ยวและรวมกับ param อื่น:

```
GET /api/nvrs?Site_ID=S01&status=online
GET /api/nvrs?NVR_ID=NVR-HQ-01
GET /api/poe-switches?Rack_ID=RK01&SW_ID=SW-HQ-CORE
```

---

### Issue B — Camera position `(0,0)` = ที่ไหน

✅ **ยืนยัน — `(0,0)` = top-left ของรูป floor plan**

```
(0.0, 0.0) = มุมบนซ้าย
(1.0, 1.0) = มุมล่างขวา
(0.5, 0.5) = กลางรูป
```

Convert จาก pixel ก่อน PATCH:
```ts
const x = pixelX / imageWidth;   // 0.0 – 1.0
const y = pixelY / imageHeight;  // 0.0 – 1.0

await axios.patch(`/api/cameras/${id}/position`, { x, y });
```

Backend validate: ถ้า x หรือ y < 0 หรือ > 1 จะได้ `400 Bad Request`

---

### Issue C — Floor plan image endpoint — blob หรือ base64?

**คำตอบ: มีสอง endpoint ที่ต่างกันโดยสิ้นเชิง — ใช้ให้ถูก**

#### ✅ endpoint ที่ถูก — ใช้อันนี้เสมอ

```
GET /api/floors/{floorId}/floor-plan/image
```

- Response: **binary blob** พร้อม `Content-Type: image/png` หรือ `image/jpeg`
- ต้องส่ง Auth header
- ต้องใช้ `responseType: 'blob'`

```ts
const res = await axios.get(`/api/floors/${floorId}/floor-plan/image`, {
  responseType: 'blob',
  headers: { Authorization: `Bearer ${token}` }
});
const url = URL.createObjectURL(res.data);
// <img src={url} />
```

#### ⚠️ endpoint เก่า — อย่าใช้สำหรับรูปภาพ

```
GET /api/floors
```

Response มี field `image_data` (base64) และ `image_type` — แต่นี่คือระบบเก่าก่อนมี floor_plans table  
**อย่าใช้ `image_data` จาก GET /api/floors** — ข้อมูลอาจว่างหรือ outdated  
ใช้เฉพาะ `GET /api/floors/{id}/floor-plan/image` เท่านั้น

---

### Issue D — DELETE = POST pattern

✅ รับทราบแล้วว่า frontend จะใช้ POST ทุก delete — ถูกต้อง ไม่ต้องแก้ backend

---

### Issue E — POST /api/users — array หรือ object?

**คำตอบ: array** — เหมือน cameras ทุกอย่าง

```ts
// ✅ ถูก — ห่อใน array
await axios.post('/api/users', [{
  username: 'john',
  password: 'Pass@1234',
  display_name: 'John',
  role: 'user'          // "admin" | "user" | "viewer" เท่านั้น
}]);

// ❌ ผิด — single object จะได้ 400
await axios.post('/api/users', {
  username: 'john', ...
});
```

**Update** ใช้ single object (เหมือน cameras):
```ts
// แก้ไข — single object ไม่ใช่ array
await axios.post(`/api/users/${id}`, {
  display_name: 'John Updated',
  role: 'admin'   // optional — ถ้าไม่ส่งจะ keep ค่าเดิม
});
```

---

## Gotchas เพิ่มเติมจากการอ่าน frontend code

### 1. Status mapping — API → UI

Frontend พบแล้วว่า API ส่ง `"online"/"offline"/"warning"` แต่ UI ใช้ `"ok"/"alert"/"warn"`  
แก้ใน api layer ก่อน return ให้ UI:

```ts
const mapStatus = (s: string) =>
  s === 'online' ? 'ok' : s === 'warning' ? 'warn' : 'alert';
```

### 2. DashboardSummaryDto เป็น array per-site

```ts
// GET /api/dashboard/summary ส่ง array มา ต้อง reduce ก่อน
const summary = await getDashboardSummary(); // SiteSummary[]
const total = summary.reduce((acc, s) => ({
  cameras:  acc.cameras  + s.camera_count,
  nvrs:     acc.nvrs     + s.nvr_count,
  switches: acc.switches + s.switch_count,
  alerts:   acc.alerts   + s.alert_count,
}), { cameras: 0, nvrs: 0, switches: 0, alerts: 0 });
```

### 3. NVR มีสอง IP field

```ts
// NvrApi response
{
  ip_internet: "192.168.1.10",  // ETH1 — uplink / management
  ip_cctv:     "10.10.1.10",   // ETH2 — camera network
}
// แสดงให้ user เห็นความแตกต่างในหน้า NVR detail
```

---

## Action Items สรุปทั้งสองฝั่ง

| ฝั่ง | งาน | สถานะ |
|---|---|---|
| **Backend** | เพิ่ม CORS `localhost:3001` | ✅ แก้แล้ว |
| **Backend** | ยืนยัน `?NVR_ID=` / `?SW_ID=` | ✅ confirmed |
| **Backend** | ยืนยัน `(0,0)` = top-left | ✅ confirmed |
| **Backend** | ยืนยัน floor plan image = blob | ✅ confirmed |
| **Backend** | ยืนยัน POST /api/users = array | ✅ confirmed |
| **Frontend** | Restart dev server หลัง CORS แก้ | 🟡 pending |
| **Frontend** | เพิ่ม `NVR_ID`/`SW_ID` param ใน api functions | 🟡 pending |
| **Frontend** | อัปเดต delete → POST pattern | 🟡 pending |
| **Frontend** | แปลง camera pixel → percentage ก่อน PATCH | 🟡 pending |
| **Frontend** | ใช้ axios blob + createObjectURL สำหรับ floor plan | 🟡 pending |
| **Frontend** | map status string: online→ok, warning→warn, offline→alert | 🟡 pending |

---

## ลำดับ Wire ที่แนะนำ

เริ่มจาก Login ก่อน — พอมี token แล้วค่อยทดสอบหน้าอื่น:

```
1. Login → POST /api/auth/login → เก็บ token ใน localStorage + Zustand
2. Dashboard → GET /api/dashboard/summary (reduce per-site)
3. Sidebar → GET /api/hierarchy/tree
4. Cameras list → GET /api/cameras
5. NVRs / Switches → GET /api/nvrs, /api/poe-switches
6. Floor plan view → GET /api/floors/{id}/floor-plan/image (blob)
7. Floor plan edit → PATCH /api/cameras/{id}/position
8. Users CRUD → GET/POST/POST/{id}/POST/delete
```

พร้อมเริ่ม — backend ไม่มีงานค้างแล้ว ลูกครับ 🟢

---

*Backend: Ran | Builder: Claude Sonnet 4.6 | 2026-05-28*
