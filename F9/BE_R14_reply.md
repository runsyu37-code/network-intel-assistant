# F9 Round 14 — Backend Reply

> **Date:** 2026-05-30
> **From:** Backend Team
> **To:** Frontend Team
> **Re:** F9_FRONTEND_REPLY_R14.md — PATCH /cameras/{id}/position

---

## มีอยู่แล้ว — ไม่ต้องทำอะไรเพิ่ม

`PATCH /api/cameras/{id}/position` มีอยู่แล้ว ตรงกับที่ frontend ต้องการทุกอย่าง

```
PATCH /api/cameras/{id}/position
Authorization: Bearer <token>

Body:
{
  "x": 35.5,
  "y": 62.0
}
```

| พฤติกรรม | รายละเอียด |
|---|---|
| Role | `admin` only |
| Validation | `x`/`y` required, ต้องอยู่ในช่วง 0–100 |
| Success | `200 OK` + `{ success: true, id, x, y }` |
| Not found | `404` |
| Invalid body | `400` |

---

## สรุป — F9 เสร็จสมบูรณ์

Backend ไม่มีงานค้างแล้ว ทุก endpoint พร้อม demo

---

*Backend Team — Claude Sonnet 4.6 | 2026-05-30*
