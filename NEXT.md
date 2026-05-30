# NEXT — สิ่งที่จะทำต่อ (เขียนก่อน /clear)

> เขียน: 2026-05-31 | ต่อจาก session นี้

---

## สถานะตอนนี้

- `frontend` branch: พร้อม demo ✅ — 13 routes, real API, RBAC, localStorage fallbacks, topology API
- `backend` branch: พร้อม demo ✅ — PATCH /sites/{id}/position เพิ่งเพิ่ม
- Ultra review: ไม่พบ bug ✅

---

## รอทำทันที (ก่อนอื่นเลย)

### 1. รัน SQL migration (topology)
```sql
-- รันบน SSMS → SSM_DB
ALTER TABLE [dbo].[sites] ADD [topology_x] FLOAT NULL, [topology_y] FLOAT NULL;
```
ไฟล์อ้างอิง: `db/migration_add_site_topology_position.sql` (branch backend)

### 2. ตอบ F9 R18 (backend ทำ)
- `GET /api/cameras` ต้อง return `position_x`, `position_y`
- กรอก `lat/lng` ใน buildings DB

---

## งานที่ตัดสินใจยังไม่ได้ (ค้างไว้คุยหลัง /clear)

### A. Rewrite ROADMAP
Opus วิเคราะห์แล้วพบว่า ROADMAP เก่าตั้งอยู่บนสมมติฐานที่หมดอายุแล้ว:
- เว็บแอปเสร็จก่อน deadline ~2 เดือน
- data collection pain point ถูกแก้ด้วยเว็บแอป ไม่ใช่ agent pipeline
- 4 agents เดิม (sanitizer/inventory/topology/alert-triage) ต้องประเมินใหม่ว่ายังจำเป็นไหม

**สิ่งที่ Opus แนะนำให้ทำก่อน:**
1. ปิด Phase 1 อย่างเป็นทางการ + เขียน RETRO-002
2. เปลี่ยนเว็บแอปให้เป็น portfolio piece (README + demo video + case study)
3. Rewrite ROADMAP บนความจริงใหม่
4. ทำ sanitizer Phase B บนเครื่องงานกับข้อมูลจริง (action item ค้างจาก RETRO-001)

### B. Frontend ที่ทำได้ต่อ (ถ้าไม่ทำ ROADMAP ก่อน)
- Add/Edit rack ใน RacksListPage
- ทำเว็บแอปเป็น portfolio piece จริง ๆ (sanitize code + README + screenshots)

---

## ไฟล์สำคัญที่ต้องโหลดหลัง /clear

```
DEV.md                              ← status frontend ล่าสุด
docs/plan/ROADMAP.md                ← แผน 5 เดือน (ต้อง rewrite)
docs/me/ABOUT_ME.md                 ← โปรไฟล์
docs/log/LEARNING_LOG.md            ← error/improvement/retro log
docs/sessions/SESSION_2026-05-31.md ← session log วันนี้
```

---

*ก่อน /clear: บอก Claude ให้โหลด NEXT.md + DEV.md ก่อนเสมอ*
