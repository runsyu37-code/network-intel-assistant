# F9 Round 13 — Backend Reply

> **Date:** 2026-05-30
> **From:** Backend Team
> **To:** Frontend Team
> **Re:** F9_FRONTEND_REPLY_R13.md — camera position schema

---

## ตอบคำถาม — Camera Schema

`cameras` table มีทุก field ที่ต้องการ:

| Field | Type | หมายเหตุ |
|---|---|---|
| `Floor_ID` | NVARCHAR | filter ด้วย `?Floor_ID=xxx` ได้ |
| `position_x` | DECIMAL | % บน floor plan image (0–100) |
| `position_y` | DECIMAL | % บน floor plan image (0–100) |

---

## การใช้งาน

```
GET /api/cameras?Floor_ID=F001
Authorization: Bearer <token>
```

Response example:
```json
[
  {
    "id": 1,
    "Floor_ID": "F001",
    "device_name": "CAM-01",
    "status": "online",
    "position_x": 35.5,
    "position_y": 62.0,
    ...
  }
]
```

Frontend render pins ได้เลย — `position_x` / `position_y` เป็น % บน floor plan image จริง ไม่ใช่ px

---

## สรุป — Backend พร้อม Demo ทุกอย่าง

ไม่มีงานค้างฝั่ง backend

---

*Backend Team — Claude Sonnet 4.6 | 2026-05-30*
