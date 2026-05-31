# Session Log — Frontend 2026-05-31 (Session 5)

> Branch: `frontend` | เครื่อง: Home PC | Model: Claude Sonnet 4.6

---

## สิ่งที่ทำเสร็จในวันนี้

| # | งาน | Commit |
|---|---|---|
| 1 | ทดสอบทุก page (10 routes + 4 detail pages) ด้วย Playwright | — |
| 2 | ตรวจ BE: `last_seen` + PingService มีอยู่แล้วครบ ไม่ต้องแตะ | — |
| 3 | Discord webhook URL → ใส่ `Web.config` + ทดสอบยิงได้ | BE gitignored |
| 4 | Fix LoginPage: error message หายเร็ว | `791c908` |
| 5 | Fix LoginPage: ลบ dev fallback auto-login | `791c908` |
| 6 | Fix LoginPage: error ค้างระหว่าง loading (ลบ `setError(null)`) | `be1114e` |
| 7 | Satellite view เป็น default ใน Building Map | `63f835b` |
| 8 | Auto-select site เดียวบน Building Map | `63f835b` |
| 9 | ปุ่ม "Satellite" ใน Site detail → navigate ไป Map?site=S001 | `63f835b` |
| 10 | Building pin: คลิกแผนที่วางพิกัดตึก → PATCH /api/buildings/{id}/coordinates | `efbfd53` |
| 11 | CRUD wired ทุก layer → real API (server-driven, ไม่มี offline fallback) | `ad03a51` |

---

## ปัญหาที่เจอ + วิธีแก้

### P1 — Playwright auth inject ด้วย `localStorage.setItem` ไม่ได้ผล

**อาการ:** inject token ก่อน navigate แต่ทุกหน้า redirect กลับ `/login`

**สาเหตุ:** Zustand store initialize ก่อน script inject ทำงาน → store เห็น `user = null`

**วิธีแก้:** เปลี่ยนเป็น `context.addInitScript()` (inject ก่อน JS ทุกตัวโหลด) → แต่ยังไม่ได้ผลเพราะ backend return 401 → interceptor redirect

**วิธีแก้จริง:** Login ผ่าน form จริงด้วย credentials จริง (`admin` / `Admin@SSM1`)

---

### P2 — Login error หายก่อนอ่านได้ (root cause ซ้อนกัน 2 ชั้น)

**ชั้นที่ 1:** `axios client.ts` interceptor ดักจับ 401 ทุกตัว รวมถึง `/auth/login` เอง → `window.location.href = '/login'` (hard redirect) → error state reset ก่อน render

**วิธีแก้:** เพิ่ม `&& !error.config?.url?.includes('/auth/login')` ใน interceptor condition

**ชั้นที่ 2:** `setError(null)` ตอนเริ่ม submit ใหม่ → error หายระหว่าง loading ~1 วิ

**วิธีแก้:** ลบ `setError(null)` ออก ให้ error ค้างจนกว่าจะ submit สำเร็จ

---

### P3 — Cameras/NVRs/Switches ข้อมูล drift จาก server

**อาการ:** edit/delete แสดงผลสำเร็จในหน้าจอ แต่ถ้า refresh จะหายหรือกลับไปเหมือนเดิม

**สาเหตุ:** pattern `initialized.current = true` ป้องกัน re-sync → local state แยกจาก server → `mutateAsync()` ยิง API แต่ local state update อิสระ → ถ้า API fail ข้อมูลหน้าจอผิด

**วิธีแก้:** ลบ `initialized.current` + local state array ทั้งหมด → ใช้ `useMemo` derive จาก React Query โดยตรง → on save/delete: await mutation → close modal → `invalidateQueries` → refetch จาก server

---

### P4 — SitesCrudPage ไม่มี mutations เลย

**อาการ:** กด Add/Edit/Delete Site → update local state เท่านั้น ไม่ถึง API เลย

**วิธีแก้:** เพิ่ม `createSite`, `updateSite`, `deleteSite` ใน `hierarchy.ts` + เพิ่ม `useMutation` ใน page + เพิ่มช่อง Site ID ใน form (BE ต้องการ)

---

## สิ่งที่ยังขาด (ทำได้แค่หน้าเครื่อง/VLAN)

| งาน | ต้องการอะไร | Deadline |
|---|---|---|
| Import ข้อมูลจริงเข้า DB | Work NB + ข้อมูลจริง | ก่อนบิน 7 มิ.ย. |
| PingService บน VM always-on | เครื่องที่อยู่ VLAN ตลอด | ก่อนบิน 7 มิ.ย. |
| Hardware test Phase 3 | กล้อง + PoE switch + VLAN | ก่อนบิน 7 มิ.ย. |
| Racks CRUD wiring | ทำจาก FE ได้เลย | ไม่ urgent |

---

## สิ่งที่ตรวจพบระหว่างทดสอบ (ยังค้าง)

| Issue | รายละเอียด | Priority |
|---|---|---|
| Rack sidebar badge = 6 แต่ list โชว์ 4 | มี rack ใน DB ที่ไม่มี site / site ไม่ตรง | Low |
| Rack Detail "Loading rack data..." | ID format ในทดสอบผิด (`RACK-A-01` แทนที่จะเป็น numeric หรือ ID จริง) | Low |
| Building Map ไม่มี markers | lat/lng = null ใน DB mock — รอกรอกพิกัดจริงผ่าน Pin feature | รอข้อมูลจริง |
| กล้องทุกตัว Offline | PingService ยัง ping ไม่ถึง VLAN กล้อง | รอ hardware |

---

## Context สำคัญ

### ไฟล์ที่แก้ในวันนี้

```
src/api/client.ts                ← fix 401 interceptor bypass /auth/login
src/api/hierarchy.ts             ← เพิ่ม CRUD functions: sites/buildings/floors + patchBuildingCoordinates
src/pages/LoginPage.tsx          ← fix error persistence + ลบ dev fallback
src/pages/BuildingMapPage.tsx    ← satellite default + auto-select site + placement mode
src/pages/SitesPage.tsx          ← ปุ่ม Satellite + buildings CRUD wired
src/pages/SitesCrudPage.tsx      ← wire sites CRUD mutations
src/pages/BuildingDetailPage.tsx ← wire floors CRUD mutations
src/pages/CamerasPage.tsx        ← server-driven state
src/pages/NVRsPage.tsx           ← server-driven state
src/pages/SwitchesPage.tsx       ← server-driven state
Web.config (BE, gitignored)      ← DiscordWebhookUrl ใส่แล้ว
```

### Commits วันนี้ (branch: frontend)

```
791c908  fix: login error persists — remove dev fallback + fix 401 interceptor bypass
be1114e  fix: keep login error visible during subsequent submit attempts
63f835b  feat: satellite default + per-site map navigation
efbfd53  feat: pin building coordinates on satellite map
ad03a51  feat: wire all CRUD layers to real API (server-driven state)
02dbe3e  docs: update NEXT.md session 5 handoff before /clear
```

---

## โหลดต่อหลัง /clear

```
NEXT.md                          ← อ่านก่อนเสมอ
DEV.md                           ← phase gates
JAPAN_TRIP_PLAN_2026-06.md      ← deadline + แผนทริป
docs/sessions/SESSION_2026-05-31_FE.md  ← ไฟล์นี้
```
