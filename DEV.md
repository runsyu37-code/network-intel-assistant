# DEV — Quick Resume Guide

> โหลดไฟล์นี้เมื่อ: resume session / แค่จะโค้ด / รัน dev
> โหลด `CLAUDE.md` เมื่อ: ต้องการ context เต็ม / ออกแบบ feature ใหม่

---

## สถานะ ณ 2026-05-28 (ล่าสุด)

| งาน | สถานะ |
|---|---|
| F1–F9 ทุกหน้า | ✅ เสร็จ + wired real API |
| README.md | ✅ เขียนแล้ว |
| Builder/FRONTEND_BUILDER_BRIEF.md | ✅ เขียนแล้ว (แก้ discrepancy กับ code แล้ว) |
| Builder/BACKEND_BUILDER_BRIEF.md | ✅ เขียนแล้ว (role matrix แก้แล้ว) |
| Review brief | ✅ อยู่ที่ `C:\ai-playground\API\docs\sessions\REVIEW_BRIEF.md` |

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

Login: `admin_test / Test@1234`

---

## Open Items (ยังค้างอยู่)

| Issue | รายละเอียด |
|---|---|
| Floor plan position ไม่ restore หลัง reload | GET /api/cameras ยัง return position_x/y ไม่ได้ — รอ backend |
| Topology: REVIEW_BRIEF บอก "collapsible tree" | UI จริงคือ React Flow diagram — ต้อง align ก่อน review |
| Role matrix: `user` เห็น cameras/NVRs ได้มั้ย | REVIEW_BRIEF บอก NO แต่ code canEdit() = admin OR user — ต้องตกลง |

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
src/api/client.ts                 ← axios instance + JWT interceptor
src/stores/authStore.ts           ← { id, username, displayName, role }
src/styles/tokens.css             ← CSS custom properties (light/dark)
Builder/FRONTEND_BUILDER_BRIEF.md ← prep doc สำหรับ review (frontend)
Builder/BACKEND_BUILDER_BRIEF.md  ← prep doc สำหรับ review (backend)
vite.config.ts                    ← proxy /api/* → localhost:50680
```
