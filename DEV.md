# DEV — Quick Resume Guide

> โหลดไฟล์นี้เมื่อ: resume session / แค่จะโค้ด / รัน dev
> โหลด `CLAUDE.md` เมื่อ: ต้องการ context เต็ม / ออกแบบ feature ใหม่

---

## สถานะ ณ 2026-05-30 (ล่าสุด)

**พร้อม demo เต็มรูปแบบ — Login + ทุกหน้าใช้งานได้กับ real backend**

| งาน | สถานะ |
|---|---|
| ทุก page (13 routes) | ✅ wire real API ครบ |
| F9 round | ✅ ปิด R17 — รอ backend กรอก lat/lng |
| Breadcrumb (Building / Floor) | ✅ แสดงชื่อจริงจาก API แล้ว |
| Bug: `NaN วันที่แล้ว` ใน Dashboard | ✅ แก้แล้ว — timeAgo parse .NET date format |
| Bug: BuildingMapPage ว่างเปล่า | ✅ แก้แล้ว — ลบ @react-leaflet/core duplicate |
| Login real credentials | ✅ ใช้งานได้แล้ว (backend fix bcrypt hash R15) |
| Building Map markers | ❌ รอ backend กรอก lat/lng ใน DB (F9 R17) |

---

## Start

```bash
# Backend — Visual Studio
# Open: C:\ai-playground\API\BNO_Survei_MonitorAPI\BNO_Survei_MonitorAPI.slnx
# Ctrl+F5 → http://localhost:50680

# Frontend
cd C:\ai-playground\Frontend
npm run dev   # → http://localhost:3001
```

Login: `admin` / `Admin@SSM1` หรือ `ssm_user` / `User@SSM1`

---

## API Wiring Summary

| Page | Endpoint(s) |
|---|---|
| Dashboard Overview | `/dashboard/summary`, `/status/devices`, `/alert-logs` |
| Topology | `/hierarchy/tree` |
| Map | `/buildings` (lat/lng) |
| Sites (CRUD) | `/sites` |
| Sites/:id | `/hierarchy/tree` |
| Buildings/:id | `/buildings/{id}`, `/floors?Building_ID=` |
| Floors/:id | `/floors/{id}`, `/cameras?Floor_ID=` |
| Racks | `/racks`, `/sites` |
| Racks/:id | `/racks/{id}` (devices + alerts รวม) |
| Cameras + detail | `/cameras`, `/cameras/{id}`, ping logs |
| NVRs + detail | `/nvrs`, `/nvrs/{id}` |
| Switches + detail | `/switches`, `/switches/{id}` |
| Users (CRUD) | `/users` |

---

## Open Items (ยังค้างอยู่)

| Issue | รายละเอียด |
|---|---|
| Floor plan position ไม่ restore หลัง reload | `GET /api/cameras` ยัง return `position_x/y` ไม่ได้ — รอ backend |
| Building Map markers | lat/lng = null ทุก building — รอ backend กรอกพิกัด (F9 R17) |
| Role matrix | ✅ ตรวจแล้ว — cameras/NVRs/Switches lock ไว้ที่ ADMIN only ถูกต้องแล้ว |

---

## Rules (5 ข้อสำคัญที่สุด)

1. **ห้าม Tailwind** — layout CSS อยู่ใน `src/styles/` เท่านั้น
2. **ห้าม comment** ยกเว้น WHY ที่ไม่ชัดเจน
3. **Icons: lucide-react เท่านั้น** — ห้ามใช้ emoji ใน UI
4. CSS variables ทุกตัว → `src/styles/tokens.css`
5. Ant Design: ใช้แค่ `Form / Modal / Table` — ห้ามใช้ Layout

---

## Key Files

```
src/pages/                        ← 1 route = 1 file
src/api/types.ts                  ← TypeScript interfaces ทุก type
src/api/hierarchy.ts              ← getBuildingById, getFloorById, getFloors, ...
src/api/client.ts                 ← axios instance + JWT interceptor
src/stores/authStore.ts           ← { id, username, displayName, role }
src/styles/tokens.css             ← CSS custom properties (light/dark)
F9/                               ← log การสื่อสาร frontend↔backend (R1–R10)
vite.config.ts                    ← proxy /api/* → localhost:50680
```
