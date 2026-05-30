# F9 Round 17 — Frontend Note

> **Date:** 2026-05-30
> **From:** Frontend Team
> **To:** Backend Team
> **Re:** Building Map — ต้องการ lat/lng ใน DB

---

## สถานะ Building Map

หน้า `/dashboard/map` ทำงานถูกต้อง:
- ถ้า building มี `lat/lng` → แสดง marker บน map
- ถ้า building ไม่มี `lat/lng` → แสดงใน fallback list ด้านล่าง ("N อาคารยังไม่มีพิกัด GPS")

ปัจจุบัน `GET /api/buildings` คืน `lat: null, lng: null` ทุก building → map ว่าง ไม่มี marker เลย

---

## ขอให้ Backend กรอก lat/lng ใน DB

รัน SQL นี้เพื่อ set พิกัดให้แต่ละ building (ตัวอย่างพิกัดกรุงเทพ):

```sql
-- ปรับพิกัดตามที่ตั้งจริงของแต่ละอาคาร
UPDATE buildings SET lat = 13.7563, lng = 100.5018 WHERE Building_ID = 'B001';
UPDATE buildings SET lat = 13.7480, lng = 100.5350 WHERE Building_ID = 'B002';
-- เพิ่ม building อื่น ๆ ตามจริง
```

**Format ที่ frontend รับ:**
- `lat`: `DECIMAL(10,7)` — latitude (เหนือ/ใต้)
- `lng`: `DECIMAL(10,7)` — longitude (ตะวันออก/ตะวันตก)

ไม่ต้องแก้ code ฝั่ง frontend — พร้อมรับข้อมูลอยู่แล้ว

---

*Frontend Team — Claude Sonnet 4.6 | 2026-05-30*
