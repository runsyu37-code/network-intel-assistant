# Design Update — 2026-05-27

สวัสดีทีม 👋 อัปเดตงาน open design รอบนี้

---

## มีอะไรพร้อมแล้ว

โฟลเดอร์ `output/` มีไฟล์ครบ 6 หน้าแล้ว ทั้งหมด high-fidelity พร้อม implement เป็น React ได้เลย

| ไฟล์ | หน้า | Route |
|---|---|---|
| `mpnjkqqr-screens_topology.html` | Network Topology | `/dashboard/topology` |
| `mpnjkqqp-screens_sites.html` | Site / Building drill-down | `/dashboard/sites/:siteId` |
| `mpnjkqql-screens_floor.html` | Floor Plan + camera overlay | `/dashboard/floors/:floorId` |
| `mpnjkqqo-screens_nvr-detail.html` | NVR Detail | `/dashboard/nvrs/:id` |
| `mpnjkqqp-screens_switch-detail.html` | Switch Detail | `/dashboard/switches/:id` |
| `mpnjkqr1-screens_users.html` | User Management | `/dashboard/users` |

ทุกไฟล์ใช้ CSS tokens ถูกต้อง (`var(--accent)`, `var(--ok)`, `var(--surface)` ฯลฯ) และ link stylesheet เดิม 2 ตัวอยู่แล้ว:
```html
<link rel="stylesheet" href="../mpmh6zea-tokens.css">
<link rel="stylesheet" href="../mpmh6ze9-layout.css">
```

---

## สิ่งที่ต้องทำต่อ

### 1. Implement 6 หน้าจาก output → React

Workflow เดิมคือ:
1. เปิด HTML ใน `output/`
2. แปลง CSS → ไฟล์ใน `src/styles/` (ตามชื่อไฟล์ที่มีอยู่แล้ว)
3. แปลง HTML → `.tsx` ตามแต่ละ route
4. ย้าย HTML ที่ implement แล้วไป `done/`

หน้าที่อาจต้องระวังเป็นพิเศษ:
- **Topology** — ปัจจุบัน implement ด้วย React Flow v11 อยู่แล้ว ดู design ใหม่แล้วปรับ node style ให้ตรง
- **Floor Plan** — มี 2 mode (View / Edit) ระวัง state toggle
- **Switch Detail** — port diagram + traffic chart เป็น SVG ใน HTML อยู่แล้ว copy ได้เลย

### 2. เปลี่ยน accent color ทั้งเว็บเป็นสีม่วง

เราใช้สีน้ำเงิน (`#2563eb`) เป็น accent อยู่ แต่อยากให้เปลี่ยนเป็นสีม่วง brand Buono ให้ตรงกับ logo

**Logo อยู่ที่:** `logo/256.png`
**สีประมาณ:** `#8B44AF` (medium warm purple — eyedrop จาก logo แล้วปรับได้)

**ไฟล์ที่ต้องแก้:**

`src/styles/tokens.css`
```css
/* เปลี่ยนบรรทัดนี้ */
--accent: #2563eb;
/* เป็น */
--accent: #8B44AF; /* หรือสีที่ eyedrop มาได้ */
```

`src/App.tsx` — ตรงส่วน Ant Design ConfigProvider
```tsx
// เปลี่ยน colorPrimary ให้ตรงกับ --accent ที่ตั้งไว้
colorPrimary: '#8B44AF',
```

แค่ 2 จุดนี้ทั้งเว็บเปลี่ยนหมดเลย เพราะทุก component ใช้ token

---

## Workflow รวม

```
open design/
  input/   ← ต้นฉบับ (อย่าแตะ)
  output/  ← ไฟล์ที่ implement ต่อได้เลย ← อยู่ตรงนี้แหละ
  done/    ← ย้ายมาหลัง implement เสร็จ
```

---

ถ้าติดอะไรดู `NEXT_SESSION.md` ที่ root project ด้วย มีรายละเอียด stack + API + gotchas ครบ
