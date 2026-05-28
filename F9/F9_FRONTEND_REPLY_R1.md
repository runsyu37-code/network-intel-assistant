# F9 Frontend Reply — R1

**Date:** 2026-05-28  
**From:** Frontend Team  
**To:** Backend Team  
**Re:** ตอบคำถาม 6 ข้อ + flagged issues ก่อนเริ่ม wire

---

## ตอบคำถาม 6 ข้อ

### 1. Token Storage
ใช้ **`localStorage`**

```ts
// client.ts — ทำแบบนี้อยู่แล้ว
const token = localStorage.getItem('token')
config.headers.Authorization = `Bearer ${token}`

// 401 handler
localStorage.removeItem('token')
window.location.href = '/login'
```

ไม่ใช้ `httpOnly cookie` — ไม่ต้องแก้ CORS ฝั่ง `supportsCredentials`

---

### 2. Dev Port — ⚠️ ต้องแก้ CORS ด่วน

Frontend รันที่ **port 3001**

```
npm run dev → http://localhost:3001
```

CORS ปัจจุบัน allow: `5173, 3000, 5174` — **ขาด 3001**  
กรุณาเพิ่ม `http://localhost:3001` ใน CORS whitelist ก่อนทดสอบ

---

### 3. หน้าที่พร้อม Wire

ทุกหน้าครบ component แล้ว — ใช้ mock data อยู่ พร้อม wire ทั้งหมด

| หน้า | Route | สถานะ |
|---|---|---|
| Login | `/login` | ✅ พร้อม wire |
| Topology | `/dashboard/topology` | ✅ พร้อม wire |
| Sites | `/dashboard/sites/:siteId` | ✅ พร้อม wire |
| Building Detail | `/dashboard/buildings/:buildingId` | ✅ พร้อม wire |
| Floor Plan | `/dashboard/floors/:floorId` | ✅ พร้อม wire |
| Racks List | `/dashboard/racks` | ✅ พร้อม wire |
| Rack Detail | `/dashboard/racks/:rackId` | ✅ พร้อม wire |
| Cameras | `/dashboard/cameras` | ✅ พร้อม wire |
| NVRs | `/dashboard/nvrs` | ✅ พร้อม wire |
| Switches | `/dashboard/switches` | ✅ พร้อม wire |
| Users | `/dashboard/users` | ✅ พร้อม wire (admin only) |
| Overview/Dashboard | `/dashboard` | ✅ พร้อม wire |

ไม่มีหน้า skeleton — ทุกหน้า render ข้อมูล mock ครบแล้ว

---

### 4. State Management

ใช้ **Zustand** ยืนยัน — ยังใช้อยู่

```ts
// authStore — เก็บ user session
{ id, username, displayName, role, token }
// methods: setAuth(), logout(), canEdit()

// themeStore — เก็บ theme preference
{ theme: 'light' | 'dark' }
// persisted ใน localStorage key: ssm.theme
```

หลัง login จะ call `setAuth({ id, username, displayName, role }, token)` แล้ว navigate ไป `/dashboard`

---

### 5. Timezone

แสดงเป็น **`th-TH` locale, Asia/Bangkok (UTC+7)**

```ts
// pattern ที่จะใช้ทุกหน้า
const display = new Date(last_seen + 'Z')
  .toLocaleString('th-TH', { timeZone: 'Asia/Bangkok' })
```

รู้แล้วว่า API ส่งเป็น UTC ไม่มี `Z` — จะ append ก่อน parse ทุกครั้ง

---

### 6. Alert Language

คงไว้เป็น **ภาษาไทย** — แอปใช้ภาษาไทย primary อยู่แล้ว ไม่ต้องแปล

---

## Issues ที่ Frontend ต้องการความชัดเจน

### Issue A — NVR / Switch single-item query param

Plan บอกว่า NVR/Switch ใช้ query param ไม่ใช่ path:
```
GET /api/nvrs?NVR_ID=NVR-HQ-01       (single)
GET /api/poe-switches?SW_ID=SW-HQ-CORE (single)
```

แต่ `src/api/nvrs.ts` ปัจจุบัน support แค่ `Site_ID`, `Rack_ID`, `status`  
→ **Frontend จะเพิ่ม `NVR_ID` และ `SW_ID` param เองได้เลย** — แค่ขอยืนยันว่า backend รับ param นี้จริง

---

### Issue B — Camera position unit

Plan บอก x/y เป็น `0.0–1.0` (percentage):
```json
{ "x": 0.35, "y": 0.72 }
```

Frontend floor plan ปัจจุบันเก็บเป็น pixel — จะ convert เป็น percentage ก่อน PATCH  
ขอยืนยัน: `(0,0)` = top-left ของรูปใช่ไหม?

---

### Issue C — Floor plan image endpoint

Plan บอก:
```
GET /api/floors/{id}/floor-plan/image
```

แต่ BACKLOG เดิมบอก:
```
GET /api/floor-plans?Floor_ID=xxx → { image_data: string, image_type: string }
```

endpoint ไหนคือตัวจริง? และ response shape เป็นแบบไหน (blob หรือ base64 json)?

---

### Issue D — Delete pattern (POST ไม่ใช่ HTTP DELETE)

รับทราบ — จะใช้ POST ทุก delete:
```ts
// ถูก
axios.post('/api/cameras/delete/5')

// ผิด — จะไม่ใช้
axios.delete('/api/cameras/5')
```

Frontend จะอัปเดต api functions ให้ตรงก่อน wire

---

### Issue E — Save = array body

รับทราบสำหรับ POST /api/cameras:
```ts
axios.post('/api/cameras', [{ device_name: 'CAM-01', ... }])
```

คำถาม: `/api/users` POST ก็ใช้ array เหมือนกันไหม? หรือ single object?

---

## สรุป Action Items

| ฝั่ง | งาน |
|---|---|
| **Backend** | เพิ่ม `localhost:3001` ใน CORS whitelist |
| **Backend** | ยืนยัน `?NVR_ID=` / `?SW_ID=` param ทำงานได้ |
| **Backend** | ยืนยัน floor plan image endpoint + response shape |
| **Backend** | ยืนยัน `(0,0)` = top-left สำหรับ camera position |
| **Backend** | ยืนยัน POST /api/users body เป็น array หรือ object |
| **Frontend** | เพิ่ม NVR_ID/SW_ID param ใน api functions |
| **Frontend** | อัปเดต delete → POST pattern |
| **Frontend** | แปลง camera position pixel → 0.0–1.0 ก่อน PATCH |
| **Frontend** | จัดการ floor plan image ด้วย axios blob + createObjectURL |

---

พร้อมเริ่ม wire ตามลำดับที่ backend แนะนำได้เลยทันทีที่ CORS แก้แล้ว

*Frontend: Ran | Builder: Claude Sonnet 4.6 | 2026-05-28*
