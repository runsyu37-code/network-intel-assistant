# SSM — Weekly Update
### 2026-05-27

---

## Slide 1 — อาทิตย์นี้ทำอะไรไปแล้ว

```
Backend ──────────────────────────────── ✅ เสร็จ 100%
  17 API endpoints · JWT · BCrypt · RBAC
  17/17 Security tests PASS

Frontend ─────────────────────────────── ✅ เสร็จ 100%
  14 หน้า · 9 endpoints เชื่อม API จริง

Full-stack ───────────────────────────── ✅ Demo พร้อม
  Login → JWT → API → DB → UI
  localhost:3000
```

---

## Slide 2 — UI ที่สร้าง: Network Topology

> **[screenshot: mpnjkqqr-screens_topology.html]**

- ดูสถานะ Site / Building ทั้งหมดในหน้าเดียว
- Live stats: กล้องออนไลน์ / NVR / Switch
- Recent alerts — อัปเดตทุก 30 วินาที

---

## Slide 3 — UI ที่สร้าง: ผังพื้น + กล้อง

> **[screenshot: mpnjkqql-screens_floor.html]**

- เห็นตำแหน่งกล้องบนผัง
- Admin ลากวางกล้องได้ → บันทึก DB ทันที
- Zoom เข้า-ออก / คลิกกล้องดู detail

---

## Slide 4 — UI ที่สร้าง: รายละเอียดอุปกรณ์

> **[screenshot: mpnjkqqo-screens_nvr-detail.html หรือ mpnjkqqp-screens_switch-detail.html]**

- ดู channel / port usage รายตัว
- Ping history chart
- สถานะ 🟢 Online / 🟡 Warning / 🔴 Offline

---

## Slide 5 — สิทธิ์ผู้ใช้ (RBAC)

```
Admin   → ทุกหน้า + แก้ไขได้
User    → Site / Building / Floor / Rack
Viewer  → Site / Building / ผังพื้น

บังคับทั้ง Backend และ Frontend
```

---

## Slide 6 — อาทิตย์หน้า: 3 เป้าหมาย

```
1. Frontend พร้อมใช้งานจริง
   → redesign UI 6 หน้า
   → ดึงข้อมูลจริงทุกหน้า

2. Full-stack ข้อมูลจริง
   → ใส่ข้อมูล device จริงลง DB
   → ดูในเว็บได้เลย

3. ทดสอบ Alert live ด้วยอุปกรณ์จริง
```

---

## Slide 7 — อาทิตย์หน้า: ทดสอบ Alert Live

```
  PoE Switch ──┐
               ├──► เครื่อง Test ──► เว็บ SSM
  กล้อง CCTV ──┘

  ทดสอบ: ถอดสาย / ปิดกล้อง
            ↓
  เว็บต้องขึ้น 🔴 Offline + แจ้งเตือน

  คำถามที่จะตอบ:
  → ระบบตรวจจับได้จริงมั้ย?
  → แจ้งเตือนเร็วแค่ไหน?
```

---

## Slide 8 — เป้าหมายสุดท้ายอาทิตย์หน้า

```
ต่ออุปกรณ์จริง
      ↓
เว็บแสดงสถานะ + แจ้งเตือนได้
      ↓
ระบบ SSM ใช้งานได้จริง ✅
```
