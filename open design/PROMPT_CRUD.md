# Prompt — CRUD Modals (Sites / Cameras / NVRs / Switches)

> ส่ง prompt นี้แบบ stand-alone — ไม่ต้อง attach ไฟล์ใดๆ

---

You are a senior UI designer working on SSM (Surveillance Smart-Monitor). Your task is to produce **4 HTML files** — one per entity — each showing a list page with all CRUD interactions visible as overlays.

---

## Design System

```html
<link rel="stylesheet" href="../mpmh6zea-tokens.css">
<link rel="stylesheet" href="../mpmh6ze9-layout.css">
```

Tokens (no hardcoded colors):
```
--bg / --surface / --surface-2 / --surface-3
--border / --shadow-1
--ink / --ink-2 / --ink-3 / --ink-4
--accent / --ok / --warn / --alert
--ok-soft / --warn-soft / --alert-soft
```

Typography: `Inter` for UI, `JetBrains Mono` for IPs/numbers.

---

## Shared UI Patterns

### List Page Structure (same for all 4 files)
```
Page header + "Add [Entity]" button (top right)
Search input + filter dropdowns (toolbar)
Data table with action column
```

Table action column (last col, every row):
- Edit icon button → opens Edit Modal
- Delete icon button → opens Delete Confirm

Icon buttons: `width: 28px`, `height: 28px`, `border-radius: 6px`, transparent bg, hover: `var(--surface-2)`.

### Create / Edit Modal
- Centered overlay: `background: rgba(0,0,0,0.5)` backdrop
- Modal card: `width: 480px`, `border-radius: 12px`, `background: var(--surface)`
- Header: title ("เพิ่ม [Entity]" / "แก้ไข [Entity]") + X close button
- Body: form fields stacked with 16px gap
- Footer: "ยกเลิก" (outline) + "บันทึก" (filled `var(--accent)`) buttons, right-aligned

Form field style:
```css
label: 12px, font-weight 600, color var(--ink-2), text-transform uppercase, letter-spacing 0.06em
input/select: width 100%, background var(--bg), border 1px solid var(--border),
              border-radius 8px, height 36px, padding 0 12px
```

### Delete Confirmation Modal
- Smaller: `width: 380px`
- Warning icon (triangle SVG, `var(--alert)`) centered at top
- Title: "ยืนยันการลบ"
- Body text: "คุณต้องการลบ [Name] ออกจากระบบ? การกระทำนี้ไม่สามารถย้อนกลับได้"
- Footer: "ยกเลิก" + "ลบ" (background `var(--alert)`, color white)

---

## File 1: `screens_crud-sites.html` — Sites

**Table columns:** ชื่อสาขา | ที่อยู่ | จำนวนอาคาร | จำนวนกล้อง | สถานะ | Actions

**5 data rows:**
| ชื่อสาขา | ที่อยู่ | อาคาร | กล้อง | สถานะ |
|---|---|---|---|---|
| สำนักงานใหญ่ | ถ.พระราม 4, กรุงเทพฯ | 3 | 48 | Online |
| สาขาสีลม | ถ.สีลม, กรุงเทพฯ | 2 | 36 | Online |
| สาขาลาดพร้าว | ถ.ลาดพร้าว, กรุงเทพฯ | 2 | 44 | Warning |
| สาขาบางนา | ถ.บางนา-ตราด, กรุงเทพฯ | 1 | 20 | Online |
| คลังสินค้า | นิคมอุตสาหกรรม, สมุทรปราการ | 1 | 16 | Offline |

**Create/Edit form fields:**
- ชื่อสาขา (text, required)
- ที่อยู่ (textarea, 3 rows)
- จังหวัด (select: กรุงเทพฯ / สมุทรปราการ / นนทบุรี / ปทุมธานี)
- หมายเหตุ (text, optional)

**Show:** Edit modal open (pre-filled with "สาขาสีลม" row data)

---

## File 2: `screens_crud-cameras.html` — Cameras

**Table columns:** สถานะ | ชื่อกล้อง | IP Address | รุ่น | ตำแหน่ง | NVR | Actions

**5 data rows:**
| สถานะ | ชื่อกล้อง | IP | รุ่น | ตำแหน่ง | NVR |
|---|---|---|---|---|---|
| Online | CAM-A1-01 | 192.168.1.101 | Hikvision DS-2CD2T47G2 | ทางเข้าอาคาร A | NVR-01 |
| Online | CAM-A1-02 | 192.168.1.102 | Hikvision DS-2CD2T47G2 | โถงรับรอง | NVR-01 |
| Offline | CAM-A3-07 | 192.168.1.137 | Axis P3245-LVE | ลานจอดรถ | NVR-02 |
| Warning | CAM-B2-03 | 192.168.1.203 | Dahua IPC-HDW2831T | ห้องประชุม B | NVR-03 |
| Online | CAM-C1-01 | 192.168.1.301 | Hikvision DS-2CD2347G2 | ทางเข้าอาคาร C | NVR-04 |

**Create/Edit form fields:**
- ชื่อกล้อง (text, required)
- IP Address (text, monospace input, placeholder "192.168.x.x")
- รุ่น (text)
- ตำแหน่ง (text)
- NVR (select: NVR-01 / NVR-02 / NVR-03 / NVR-04)
- สาขา (select: list of sites)

**Show:** Create modal open (empty form) + Delete confirm modal for "CAM-A3-07" underneath (semi-visible behind create modal, or show delete modal as separate state note)

---

## File 3: `screens_crud-nvrs.html` — NVRs

**Table columns:** สถานะ | ชื่อ NVR | IP Address | รุ่น | ช่องสัญญาณ | HDD | สาขา | Actions

**5 data rows:**
| สถานะ | ชื่อ | IP | รุ่น | ช่อง | HDD | สาขา |
|---|---|---|---|---|---|---|
| Online | NVR-01 | 192.168.1.21 | Hikvision DS-7616NI-K2 | 16/16 | 78% | สำนักงานใหญ่ |
| Online | NVR-02 | 192.168.1.22 | Hikvision DS-7616NI-K2 | 12/16 | 45% | สำนักงานใหญ่ |
| Warning | NVR-03 | 192.168.1.23 | Dahua NVR5216-EI | 8/16 | 91% | สาขาสีลม |
| Online | NVR-04 | 192.168.1.24 | Hikvision DS-7632NI-K2 | 14/32 | 62% | สาขาลาดพร้าว |
| Offline | NVR-05 | 192.168.1.25 | Dahua NVR5208-EI | 0/8 | — | สาขาบางนา |

HDD column: mini progress bar inline (small, 60px wide, colored ok/warn/alert)

**Create/Edit form fields:**
- ชื่อ NVR (text, required)
- IP Address (text, monospace)
- รุ่น (text)
- จำนวนช่องสัญญาณ (number select: 8 / 16 / 32)
- สาขา (select)
- หมายเหตุ (text)

**Show:** Delete confirm modal open for "NVR-05"

---

## File 4: `screens_crud-switches.html` — Switches

**Table columns:** สถานะ | ชื่อ Switch | IP Address | รุ่น | Ports | Uptime | สาขา | Actions

**5 data rows:**
| สถานะ | ชื่อ | IP | รุ่น | Ports | Uptime | สาขา |
|---|---|---|---|---|---|---|
| Online | SW-CORE-01 | 192.168.1.1 | Cisco SG350-28 | 28 | 45d 2h | สำนักงานใหญ่ |
| Online | SW-FLOOR-A1 | 192.168.1.2 | Cisco SG250-24 | 24 | 30d 14h | สำนักงานใหญ่ |
| Warning | SW-FLOOR-B2 | 192.168.1.3 | TP-Link TL-SG3424 | 24 | 12d 6h | สาขาสีลม |
| Online | SW-FLOOR-C1 | 192.168.1.4 | Cisco SG250-18 | 18 | 28d 0h | สาขาลาดพร้าว |
| Online | SW-SITE-BN | 192.168.1.5 | Netgear GS324T | 24 | 5d 3h | สาขาบางนา |

**Create/Edit form fields:**
- ชื่อ Switch (text, required)
- IP Address (text, monospace)
- รุ่น (text)
- จำนวน Port (number)
- สาขา (select)
- หมายเหตุ (text)

**Show:** Edit modal open (pre-filled with "SW-FLOOR-B2" data)

---

## Output Requirements

- 4 HTML files named exactly: `screens_crud-sites.html`, `screens_crud-cameras.html`, `screens_crud-nvrs.html`, `screens_crud-switches.html`
- Each file shows the full list page + the specified modal state as described above
- All CSS inline in `<style>` block
- Use the token system — no hardcoded colors
- No JavaScript, no CSS frameworks
- Follow the same visual language as the attached `screens_device-list.html`
