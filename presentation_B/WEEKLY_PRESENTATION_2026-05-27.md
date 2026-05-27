# SSM Network Monitor — Weekly Progress
### Week of 2026-05-27

---

## Slide 1 — What We Built This Week

**SSM Network Monitor**  
ระบบติดตามกล้องวงจรปิดและอุปกรณ์เครือข่ายแบบ Real-time

ทีม: Backend (Ran) + Frontend (Claude)  
สถานะ: Backend เสร็จ 100% · Frontend เชื่อมต่อแล้ว

---

## Slide 2 — ภาพรวมระบบ

```
Frontend (React)          Backend (ASP.NET API)        Database (SQL Server)
localhost:3000     →      localhost:50680         →     SSM_DB
                          
Login Page                /api/auth/login               users
Dashboard                 /api/dashboard/summary        sites, cameras, nvrs
Floor Plan                /api/floor-plans              floor_plans
Camera Overlay            /api/cameras                  ping_logs, alert_logs
```

---

## Slide 3 — สิ่งที่ทำสำเร็จ (Backend)

| Phase | งานที่ทำ | ผลลัพธ์ |
|---|---|---|
| 7–8 | JWT Auth + BCrypt + CORS | Login ปลอดภัย |
| 9 | Rate Limiting (10 ครั้ง/5 นาที → ล็อค 15 นาที) | ป้องกัน Brute Force |
| 10 | RBAC ครบทุก Endpoint | 17/17 Tests PASS |
| 11 | Dashboard API + Frontend Connect | Demo พร้อม |

---

## Slide 4 — ระบบ Role (สิทธิ์การใช้งาน)

| Role | คือใคร | เห็นอะไร |
|---|---|---|
| **Admin** | IT Support | ทุกอย่าง + แก้ไขได้ |
| **User** | เจ้าหน้าที่ดูโครงสร้าง | สถานที่ / อาคาร / ชั้น / ห้อง / แร็ค |
| **Viewer** | ผู้บริหาร | สถานที่ / อาคาร / ชั้น / ผังพื้น |

ทุก endpoint บังคับ Role server-side — ไม่สามารถ bypass ได้จาก frontend

---

## Slide 5 — API ที่พร้อมใช้งาน

**ทุก Role อ่านได้:**
- `/api/sites` `/api/buildings` `/api/floors` `/api/floor-plans`
- `/api/hierarchy/tree` — ต้นไม้ Site → Building → Floor

**Admin + User:**
- `/api/rooms` `/api/racks`

**Admin เท่านั้น:**
- `/api/cameras` `/api/nvrs` `/api/poe-switches` `/api/devices`
- `/api/alert-logs` `/api/ping-logs` `/api/users`
- `/api/dashboard/summary` ← **ใหม่สัปดาห์นี้**

---

## Slide 6 — Dashboard Summary (ใหม่)

`GET /api/dashboard/summary` — ภาพรวมแต่ละ Site

```json
{
  "siteName": "สำนักงานใหญ่",
  "totalCameras": 48,
  "camerasOnline": 45,
  "camerasOffline": 2,
  "camerasWarning": 1,
  "totalNvrs": 4,
  "nvrsOffline": 0,
  "totalBuildings": 3,
  "totalFloors": 12
}
```

---

## Slide 7 — ความปลอดภัยที่ Implement แล้ว

✅ **JWT Authentication** — token หมดอายุ 8 ชั่วโมง  
✅ **BCrypt Password Hashing** — รหัสผ่านไม่เก็บ plain text  
✅ **Rate Limiting** — ป้องกัน brute force login  
✅ **RBAC ทุก Endpoint** — ทั้ง GET และ POST/DELETE  
✅ **Error Sanitization** — ไม่ leak stack trace หรือ SQL error  
✅ **JWT Secret Rotation** — เปลี่ยน secret แล้ว token เก่าใช้ไม่ได้  
✅ **Secrets ไม่อยู่ใน Git** — Web.config อยู่แค่ local  

---

## Slide 8 — สิ่งที่ Frontend สร้าง

**Stack:** React 18 + Vite + TypeScript + TanStack Query

**หน้าที่มีแล้ว (Mock → Real):**
- Login Page → เชื่อมต่อ API จริงแล้ว ✅
- Dashboard / Topology
- Floor Plan (รองรับ base64 image + camera overlay)
- Camera / NVR / Switch detail

**Dev Setup:**
- Vite Proxy: `localhost:3000` → forward → `localhost:50680`
- ไม่มีปัญหา CORS ในช่วง development

---

## Slide 9 — Floor Plan Feature

กล้องแต่ละตัวมีตำแหน่งบนผังพื้น (`position_x`, `position_y`)  
ค่า 0.0–1.0 relative กับขนาดรูป

```
Admin ลาก camera icon
        ↓
PATCH /api/cameras/{id}/position
        ↓
บันทึก position_x, position_y ใน DB
        ↓
Frontend render ทุกคนเห็นตำแหน่งเดียวกัน
```

---

## Slide 10 — Demo Checklist

- [ ] Login ด้วย `admin_test / Test@1234`
- [ ] ดู Dashboard summary (camera online/offline count)
- [ ] เปิด Floor Plan — เห็นผัง + กล้องบนแผน
- [ ] Login ด้วย `viewer_test` — ดูได้แค่ผังพื้น ห้องและกล้องถูกซ่อน
- [ ] Login ด้วย `user_test` — เห็นห้องและแร็ค แต่ไม่เห็นกล้อง

---

## Slide 11 — งานที่เหลือ (Phase 12)

| งาน | Priority |
|---|---|
| RequireRole attribute — refactor role checks | Medium |
| Per-username rate limiting (ป้องกัน NAT DoS) | Medium |
| Real-time device status (polling 30s) | Low |
| Webhook delivery สำหรับ alert_logs | Low |
| Pagination (เมื่อข้อมูลมากกว่า 500 rows) | Low |

---

## Slide 12 — Timeline

```
สัปดาห์นี้:
Phase 7-8  ── Foundation + Security hardening
Phase 9    ── Rate limiting + RBAC gap fix  
Phase 10   ── Full RBAC matrix (17 tests ✅)
Phase 11   ── Debate closed + Frontend connect

พรุ่งนี้:
Demo ──────────────────────────────────────────
```

---

*SSM Network Monitor · Backend: Ran · Frontend: Claude · 2026-05-27*
