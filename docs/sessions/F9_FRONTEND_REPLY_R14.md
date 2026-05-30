# F9 Round 14 — Frontend Note

> **Date:** 2026-05-30
> **From:** Frontend Team
> **To:** Backend Team
> **Re:** PATCH /cameras/{id}/position endpoint

---

## คำถาม — Camera Position PATCH

FloorPlanPage มี edit mode ให้ admin ลาก camera pin เพื่อ reposition ได้
หลังจาก drag เสร็จ frontend จะเรียก:

```
PATCH /api/cameras/{id}/position
Authorization: Bearer <token>

Body:
{
  "x": 35.5,
  "y": 62.0
}
```

**ถาม:** backend มี endpoint นี้ไหม?

- ถ้า **มี** → ดีเลย ไม่ต้องทำอะไรเพิ่ม
- ถ้า **ไม่มี** → โปรดเพิ่ม endpoint ที่รับ `x`/`y` แล้ว update `position_x`/`position_y` ใน `cameras` table
  - response คืน `200 OK` ก็พอ (frontend ไม่ใช้ response body)
  - ถ้า id ไม่มีในระบบให้คืน `404`

---

## Context

- `position_x` / `position_y` เป็น `DECIMAL` % บน floor plan (0–100) — ตาม schema ที่ backend ยืนยันใน R13
- Edit mode เข้าถึงได้เฉพาะ `admin` role เท่านั้น — frontend guard ไว้แล้ว

---

*Frontend Team — Claude Sonnet 4.6 | 2026-05-30*
