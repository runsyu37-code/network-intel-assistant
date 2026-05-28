# Phase F9 — Frontend ↔ Backend Wiring Plan

**Date:** 2026-05-28  
**From:** Backend Team  
**To:** Frontend Team  
**Purpose:** แผนการเชื่อมต่อ frontend กับ backend API จริง + ขอให้ frontend team ตอบกลับ

---

## สถานะปัจจุบัน

| Layer | สถานะ |
|---|---|
| Backend (Phase 7–13) | **เสร็จสมบูรณ์** — maintenance mode, ทุก endpoint พร้อมใช้งาน |
| Frontend (F1–F8) | **15 หน้าสร้างแล้ว** — ใช้ mock/static data อยู่ |
| **F9** | **เริ่มได้เลย** — wire ทุกหน้าเข้า real API |

Backend รันที่ `http://localhost:50680` — CORS เปิดไว้สำหรับ `localhost:5173`, `localhost:3000`, `localhost:5174`

---

## ภาพรวม: Backend เชื่อมตรงไหนได้บ้าง

### ทุกหน้า — Auth + Token

```
POST /api/auth/login
Body:     { "username": "admin_test", "password": "Test@1234" }
Response: { "token": "eyJ...", "role": "admin", "displayName": "Admin", "expiresIn": 28800 }

ทุก request ถัดจากนี้: Authorization: Bearer <token>
Token อายุ 8 ชั่วโมง — ถ้าได้ 401 ให้ redirect ไป /login
```

---

## Mapping: หน้าเว็บ → API Endpoints

### 1. หน้า Login `/login`

| Action | Endpoint | Method |
|---|---|---|
| กด Login | `/api/auth/login` | POST |
| ตรวจสอบ token ปัจจุบัน | `/api/auth/me` | GET |

**Response shape:**
```json
{ "token": "eyJ...", "role": "admin", "displayName": "Ran", "expiresIn": 28800 }
```
เก็บ `token` และ `role` ไว้ใน auth store — ใช้ `role` ควบคุม UI ทุกหน้า

---

### 2. หน้า Topology `/` (HQ + Sites map)

| Action | Endpoint | Method | Role |
|---|---|---|---|
| โหลด site nodes ทั้งหมด | `/api/sites` | GET | All |
| สถานะ devices แบบ realtime (poll 30s) | `/api/status/devices` | GET | All |

**Response shape (sites):**
```json
[{ "Site_ID": "S01", "name": "สาขากรุงเทพ", "location": "Bangkok", ... }]
```

---

### 3. หน้า Site Overview `/sites/:id`

| Action | Endpoint | Method | Role |
|---|---|---|---|
| โหลด buildings ของ site นี้ | `/api/buildings?Site_ID=S01` | GET | All |
| โหลด alert summary | `/api/alert-logs?Site_ID=S01` | GET | admin |

**Response shape (buildings):**
```json
[{ "Building_ID": "B01", "Site_ID": "S01", "name": "อาคาร A", ... }]
```

---

### 4. หน้า Building Detail `/sites/:id/buildings/:bid`

| Action | Endpoint | Method | Role |
|---|---|---|---|
| โหลด floors ของ building | `/api/floors?Building_ID=B01` | GET | All |
| โหลด camera count ต่อชั้น | `/api/cameras?Building_ID=B01` | GET | admin |

---

### 5. หน้า Floor Plan `/floors/:id/plan`

| Action | Endpoint | Method | Role |
|---|---|---|---|
| โหลดรูป floor plan | `/api/floors/{id}/floor-plan/image` | GET | All |
| โหลด cameras บน floor นี้ | `/api/cameras?Floor_ID=F01` | GET | admin |
| ย้าย pin กล้อง | `/api/cameras/{id}/position` | PATCH | admin |
| Upload floor plan ใหม่ | `/api/floor-plans/validate-path` → `/api/floor-plans` | POST | admin |

> ⚠️ **สำคัญ:** รูป floor plan ต้องส่ง Auth header — ใช้ `<img src>` ตรงๆ ไม่ได้
```js
const res = await axios.get(`/api/floors/${id}/floor-plan/image`, {
  responseType: 'blob',
  headers: { Authorization: `Bearer ${token}` }
});
const url = URL.createObjectURL(res.data);
// <img src={url} />
```

**Camera position (PATCH):**
```json
// Body — x/y เป็น percentage 0.0–1.0 (จาก top-left ของรูป)
{ "x": 0.35, "y": 0.72 }
```

---

### 6. หน้า Room Detail `/rooms/:id`

| Action | Endpoint | Method | Role |
|---|---|---|---|
| โหลด room info | `/api/rooms?Room_ID=R01` | GET | admin, user |
| โหลด racks ใน room | `/api/racks?Room_ID=R01` | GET | admin, user |

---

### 7. หน้า Rack Detail `/racks/:id`

| Action | Endpoint | Method | Role |
|---|---|---|---|
| โหลด rack info | `/api/racks?Rack_ID=RK01` | GET | admin, user |
| โหลด devices ใน rack | `/api/cameras?...` + `/api/nvrs?...` + `/api/poe-switches?...` | GET | admin |

---

### 8. หน้า Camera Detail `/cameras/:id`

| Action | Endpoint | Method | Role |
|---|---|---|---|
| โหลดข้อมูล camera | `/api/cameras?id=5` | GET | admin |
| แก้ไข camera | `/api/cameras/{id}` | POST | admin |
| ลบ camera | `/api/cameras/delete/{id}` | POST | admin |

---

### 9. หน้า Dashboard `/dashboard`

| Action | Endpoint | Method | Role |
|---|---|---|---|
| Summary cards (counts) | `/api/dashboard/summary` | GET | admin |
| Device status สำหรับ chart | `/api/status/devices` | GET | admin |
| Alert log ล่าสุด | `/api/alert-logs` | GET | admin |

---

### 10. หน้า User Management `/users`

| Action | Endpoint | Method | Role |
|---|---|---|---|
| โหลด user list | `/api/users` | GET | admin |
| เพิ่ม user ใหม่ | `/api/users` | POST | admin |
| แก้ไข user | `/api/users/{id}` | POST | admin |
| ลบ user | `/api/users/delete/{id}` | POST | admin |

**Body เพิ่ม user:**
```json
{ "username": "john", "password": "Pass@1234", "display_name": "John", "role": "user" }
```
`role` ต้องเป็นหนึ่งใน `"admin"`, `"user"`, `"viewer"` เท่านั้น

---

### 11. หน้า Alert Logs `/alerts`

| Action | Endpoint | Method | Role |
|---|---|---|---|
| โหลด alert list | `/api/alert-logs` | GET | admin |

---

### 12. Quick Add Camera Modal

| Action | Endpoint | Method | Role |
|---|---|---|---|
| เพิ่ม camera | `/api/cameras` | POST | admin |

> ⚠️ **Body ต้องเป็น array เสมอ แม้จะเพิ่มทีละตัว:**
```json
[{ "device_name": "CAM-01", "Site_ID": "S01", "Floor_ID": "F01", ... }]
```

---

## Sidebar — Hierarchy Tree

ใช้ endpoint นี้โหลด sidebar ทั้งหมดใน 1 call:

```
GET /api/hierarchy/tree
Response:
[{
  "Site_ID": "S01", "name": "สาขากรุงเทพ",
  "buildings": [{
    "Building_ID": "B01", "name": "อาคาร A",
    "floors": [{ "Floor_ID": "F01", "name": "ชั้น 1" }, ...]
  }]
}]
```

---

## Error Handling — ต้องจัดการทุกหน้า

```json
{ "Message": "Human-readable error string" }
```

| Status | ความหมาย | Frontend ต้องทำ |
|---|---|---|
| 400 | validation error | แสดง `Message` ให้ user |
| 401 | token หมดอายุ / ไม่มี token | redirect ไป `/login` |
| 403 | role ไม่พอ | แสดง "Access denied" หรือซ่อน element |
| 429 | login ผิดเกิน 10 ครั้ง | แสดง retry-after จาก header |
| 500 | server error | แสดง "Something went wrong" |

---

## CRUD Patterns ที่ต้องรู้

### DELETE ใช้ POST ไม่ใช่ HTTP DELETE
```
POST /api/cameras/delete/{id}    ✅ ถูกต้อง
DELETE /api/cameras/{id}          ❌ 404
```

### Save = array body, Update = single object body
```js
// เพิ่มใหม่ — ห่อใน array
axios.post('/api/cameras', [{ name: 'CAM-01', ... }])

// แก้ไข — single object
axios.post('/api/cameras/5', { name: 'CAM-01-updated', ... })
```

### Camera x/y เป็น NULL จนกว่าจะวาง pin
```js
if (camera.x === null) {
  // แสดงใน "ยังไม่ได้วาง" list — อย่าพยายาม render บน floor plan
}
```

---

## Role Gate — Frontend Display Rules

```js
const isAdmin       = user?.role === 'admin';
const canSeeDevices = user?.role === 'admin';
const canSeeRooms   = user?.role === 'admin' || user?.role === 'user';

// ซ่อน/แสดง elements
{isAdmin && <EditButton />}
{isAdmin && <DeleteButton />}
{isAdmin && <DragPin />}
{canSeeDevices && <CameraPage />}
{canSeeRooms && <RoomPage />}
```

| สิ่งที่แสดง | admin | user | viewer |
|---|---|---|---|
| หน้า cameras/NVRs/devices | ✅ | ❌ ซ่อน | ❌ ซ่อน |
| หน้า rooms/racks | ✅ | ✅ | ❌ ซ่อน |
| ปุ่ม Edit/Delete ทุกชนิด | ✅ | ❌ ซ่อน | ❌ ซ่อน |
| หน้า Users, Dashboard, Logs | ✅ | ❌ ซ่อน | ❌ ซ่อน |
| drag camera pin | ✅ | ❌ disable | ❌ disable |

---

## Test Accounts (ใช้ทดสอบแต่ละ role)

| Username | Password | Role |
|---|---|---|
| `admin_test` | `Test@1234` | admin — ทดสอบ write ทุกอย่าง |
| `user_test` | `Test@1234` | user — ทดสอบ read structural data |
| `viewer_test` | `Test@1234` | viewer — ทดสอบ read-only |

---

## คำถามที่ Frontend ต้องตอบกลับ

ก่อนเริ่ม F9 backend ต้องการคำตอบเหล่านี้:

1. **Token storage** — จะเก็บ JWT ไว้ที่ไหน? `localStorage` หรือ `httpOnly cookie`?  
   (ถ้าใช้ cookie ต้องแก้ CORS backend เพิ่ม `supportsCredentials: true`)

2. **Dev port** — frontend run ที่ port อะไร? ถ้าไม่ใช่ 5173/3000/5174 ต้องแจ้งเพื่อเพิ่มใน CORS

3. **หน้าไหนทำแล้วบ้าง** — ใน 15 หน้าที่สร้างแล้ว หน้าไหนมี component ครบพร้อม wire? หน้าไหนยังเป็น skeleton?

4. **State management** — ใช้อะไรจัดการ auth state? (plan บอกว่า Zustand — ยืนยันว่ายังใช้อยู่?)

5. **last_seen timezone** — จะแสดง timezone อะไร? `th-TH` หรืออื่น?  
   (ทุก `last_seen` จาก API เป็น UTC — ต้อง convert ก่อนแสดง)

6. **Alert language** — `alert_logs.message` เก็บเป็นภาษาไทย จะให้คงไว้หรือเปลี่ยนเป็น English?

---

## ลำดับที่แนะนำให้ทำ F9

ทำทีละชั้นจากง่ายไปยาก:

| ลำดับ | หน้า | เหตุผล |
|---|---|---|
| 1 | Login | foundation — ต้องมีก่อนทุกอย่าง |
| 2 | Hierarchy sidebar | ใช้ข้อมูลนี้ทุกหน้า |
| 3 | Topology | GET /api/sites เดียว |
| 4 | Dashboard | แสดงผลอย่างเดียว ไม่มี write |
| 5 | Site / Building / Floor pages | read-only ก่อน |
| 6 | Floor Plan (view mode) | รูปภาพ + camera pins |
| 7 | Floor Plan (edit mode) | drag-drop PATCH |
| 8 | Camera/NVR detail + CRUD | write operations |
| 9 | User Management | write operations |
| 10 | Alert Logs | admin only |

---

*Backend: Ran | Builder: Claude Sonnet 4.6 | 2026-05-28*
