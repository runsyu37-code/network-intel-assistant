# DEV — Quick Resume Guide

> โหลดไฟล์นี้เมื่อ: resume session / แค่จะโค้ด / รัน dev
> โหลด `CLAUDE.md` เมื่อ: ต้องการ context เต็ม / ออกแบบ feature ใหม่

---

## Active This Week (อัปเดตต้นสัปดาห์)

**Frontend**
- (ว่าง — อัปเดตก่อนเริ่มงาน)

**Backend**
- (ว่าง — อัปเดตก่อนเริ่มงาน)

---

## Phase Gates — เช็คก่อนเริ่ม feature ใหม่ทุกครั้ง

> ❌ = ยังไม่ผ่าน — ห้ามเริ่ม feature ที่ขึ้นอยู่กับ gate นี้
> ✅ = ผ่านแล้ว — เริ่มได้

### Phase 1 — Audit-Ready
- [ ] BE: `last_seen` returned from `GET /api/cameras`
- [x] BE: `position_x` / `position_y` returned from `GET /api/cameras` (P5) ✅ already in SELECT
- [x] BE: topology SQL migration run on SSMS (P6) ✅ 2026-05-31
- [x] FE: localStorage position crutch deleted ✅ 2026-05-31
- [ ] FE: Flat Audit View built (table + counts + offline filter)
- [ ] BOTH: PingService verified — supervised service, always-on VM, ICMP path confirmed

### Phase 2.1 — Device CRUD
- [ ] BOTH: API contract signed for each mutation endpoint before coding
  (`F9/contracts/POST_api-cameras.md` etc.)

### Phase 2.2 — Rack U-Position *(do NOT start until all 4 gates below are ✅)*
- [ ] BE: `u_height` / `u_size` per device returned from device GET
- [ ] BE: rack `max_u` confirmed + returned
- [ ] BE: server-side overlap rejection (409 on overlapping U range)
- [ ] BOTH: U numbering convention locked in writing (U1 at bottom / top-down)

### Phase 2.3 — Building/Site CRUD + Coordinates
- [ ] BE: `lat` / `lng` writable via API

### Phase 2.4 — Satellite Map *(do NOT start until gate below is ✅)*
- [ ] Phase 2.3 complete (coordinate-entry UI exists — no more hand-seeding SQL)

### Phase 3 — Alert Hardware Test
- [ ] BOTH: baseline test done (camera connected, pings succeed, FE green, no Discord noise)
- [ ] BOTH: controlled failure test done (unplug → FE red → Discord fires once)

---

## สถานะ ณ 2026-05-31 (ล่าสุด)

**พร้อม demo เต็มรูปแบบ — Login + ทุกหน้าใช้งานได้กับ real backend**

| งาน | สถานะ |
|---|---|
| ทุก page (13 routes) | ✅ wire real API ครบ |
| Login real credentials | ✅ ใช้งานได้ |
| Breadcrumb (Building / Floor) | ✅ แสดงชื่อจริงจาก API |
| Floor plan camera positions | ✅ localStorage fallback (รอ backend return position_x/y) |
| Building floor reorder | ✅ drag-to-sort + localStorage |
| Topology positions | ✅ persist ลง API (`PATCH /api/sites/{id}/position`) |
| Building Map markers | ❌ รอ backend กรอก lat/lng ใน DB (F9 R18) |

---

## ⚠️ SQL migration ที่ต้องรันก่อน Topology ใช้งานได้

```sql
-- รันบน SSMS → SSM_DB
ALTER TABLE [dbo].[sites] ADD [topology_x] FLOAT NULL, [topology_y] FLOAT NULL;
```

ไฟล์: `db/migration_add_site_topology_position.sql` (อยู่ใน branch backend)

---

## Start

```bash
# Backend — Visual Studio
# Open: C:\ai-playground\API\BNO_Survei_MonitorAPI\BNO_Survei_MonitorAPI.slnx
# Ctrl+F5 → http://localhost:50680

# Frontend
cd C:\ai-playground\Frontend
npm run dev   # → http://localhost:3000
```

Login: `admin` / `Admin@SSM1` หรือ `ssm_user` / `User@SSM1`

---

## API Wiring Summary

| Page | Endpoint(s) |
|---|---|
| Dashboard Overview | `/dashboard/summary`, `/status/devices`, `/alert-logs` |
| Topology | `/sites` (real nodes + positions), `/dashboard/summary` (stats) |
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
| Floor plan position | `GET /api/cameras` ยัง return `position_x/y` ไม่ได้ — รอ backend (F9 R18) |
| Building Map markers | lat/lng = null ทุก building — รอ backend กรอกพิกัด (F9 R18) |
| Topology SQL migration | ต้องรัน ALTER TABLE ก่อน (ดูด้านบน) |

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
src/api/hierarchy.ts              ← getSites, getBuildingById, patchSitePosition, ...
src/api/client.ts                 ← axios instance + JWT interceptor
src/stores/authStore.ts           ← { id, username, displayName, role }
src/styles/tokens.css             ← CSS custom properties (light/dark)
F9/                               ← log การสื่อสาร frontend↔backend
vite.config.ts                    ← proxy /api/* → localhost:50680
```
