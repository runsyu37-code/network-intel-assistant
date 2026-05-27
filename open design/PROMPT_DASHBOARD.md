# Prompt — Dashboard Page

> แนบ `screens_dashboard.html` ไปพร้อมกับ prompt นี้

---

You are a senior UI designer working on SSM (Surveillance Smart-Monitor), a CCTV management dashboard. Your task is to produce a **single high-fidelity HTML file** for the main Dashboard page — the first screen users see after login.

---

## Design System

Link these stylesheets:
```html
<link rel="stylesheet" href="../mpmh6zea-tokens.css">
<link rel="stylesheet" href="../mpmh6ze9-layout.css">
```

CSS tokens (use only these — no hardcoded colors):
```
--bg / --surface / --surface-2 / --surface-3
--border / --shadow-1
--ink / --ink-2 / --ink-3 / --ink-4
--accent / --ok / --warn / --alert
--ok-soft / --warn-soft / --alert-soft
```

Typography: `Inter` for UI, `JetBrains Mono` for numbers/IPs/timestamps.

---

## Page: Dashboard (`/dashboard`)

This is the **command center overview** — staff open this first thing every morning to check if anything needs attention.

### Layout

```
┌─────────────────────────────────────────────────────────┐
│  "Dashboard"  ภาพรวมระบบ        [↻ อัปเดตเมื่อ 2 นาที  │
│                                   ที่แล้ว · รีเฟรชใน 28s]│
├──────────┬──────────┬──────────┬──────────────────────── ┤
│ Cameras  │  NVRs    │ Switches │   Active Alerts        │  ← stat cards (clickable)
├──────────┴──────────┴──────────┴─────────────────────────┤
│                                  │                       │
│   Recent Alerts (~60% width)     │  Offline Devices      │  ← row 2
│                                  │  (~40% width)         │
├──────────────────────────────────┴───────────────────────┤
│   Per-site Status Table (full width)                     │  ← row 3
└──────────────────────────────────────────────────────────┘
```

---

### Page Header

- Title: **"Dashboard"** (24px, bold)
- Subtitle: "ภาพรวมระบบ" (13px, `var(--ink-3)`)
- Top-right: last refreshed indicator —  
  `"อัปเดตเมื่อ 2 นาทีที่แล้ว · รีเฟรชใน 28s"` (12px monospace, `var(--ink-3)`)  
  + small refresh icon button beside it

---

### Stat Cards (top row, 4 cards)

Each card is **clickable** (subtle hover: `var(--surface-2)` bg, pointer cursor) — clicking navigates to the relevant list page filtered by status.

Card anatomy:
- Icon (inline SVG 24×24, stroke `var(--accent)`)
- Big number (32px bold, JetBrains Mono, `var(--ink)`)
- Label (10px uppercase, `var(--ink-3)`, letter-spacing)
- Trend line: e.g. "3 offline" in `var(--alert)` or "All healthy" in `var(--ok)` (11px, bold)

| Card | Value | Trend | Click destination |
|---|---|---|---|
| Cameras | 128 | 3 offline | `/dashboard/cameras` |
| NVRs | 8 | All healthy | `/dashboard/nvrs` |
| Switches | 12 | 1 warning | `/dashboard/switches` |
| Active Alerts | 4 | ↑ 2 from yesterday | `/dashboard/alerts` |

Alert card: `border-left: 4px solid var(--alert)` when alerts > 0.

---

### Recent Alerts Table (~60% width)

Card with header **"Recent Alerts"** + **"ดูทั้งหมด →"** link top-right (12px, `var(--accent)`).

Columns: Severity | Device | Message | Time

8 rows — mix of CRITICAL, WARNING, INFO:
| Severity | Device | Message | Time |
|---|---|---|---|
| CRITICAL | NVR-03 | HDD2 storage at 91% | 14 นาทีที่แล้ว |
| WARNING | CAM-A3-07 | ไม่ได้รับสัญญาณ 5 นาที | 32 นาทีที่แล้ว |
| INFO | SW-CORE-01 | Port 14 reconnected | 1 ชั่วโมงที่แล้ว |
| CRITICAL | CAM-B2-03 | Connection lost | 1 ชั่วโมงที่แล้ว |
| WARNING | SW-FLOOR-B2 | High packet loss detected | 2 ชั่วโมงที่แล้ว |
| INFO | CAM-C1-01 | Camera back online | 3 ชั่วโมงที่แล้ว |
| WARNING | NVR-05 | Offline — no ping response | 5 ชั่วโมงที่แล้ว |
| INFO | SW-FLOOR-A1 | Firmware update available | 6 ชั่วโมงที่แล้ว |

Severity badge: pill, 10px bold uppercase
- CRITICAL → `var(--alert-soft)` bg, `var(--alert)` text
- WARNING → `var(--warn-soft)` bg, `var(--warn)` text
- INFO → `var(--surface-2)` bg, `var(--ink-3)` text

---

### Offline Devices (~40% width)

Card with header **"อุปกรณ์ที่ออฟไลน์"** + total count badge (e.g. `4`).

Show devices currently offline, sorted by longest offline first.  
Each row:
- Status dot (red, pulsing CSS animation)
- Device name (bold, 13px)
- Site name (12px, `var(--ink-3)`)
- Offline duration (JetBrains Mono, 11px, `var(--alert)`) — e.g. "5h 12m"

Data (5 rows):
| Device | Site | Offline for |
|---|---|---|
| NVR-05 | สาขาบางนา | 5h 12m |
| CAM-A3-07 | สำนักงานใหญ่ | 2h 44m |
| CAM-B2-03 | สำนักงานใหญ่ | 1h 58m |
| CAM-D1-09 | สาขาลาดพร้าว | 47m |
| SW-FLOOR-B2 | สาขาสีลม | 12m |

If all devices online: show a centered `var(--ok)` checkmark icon + "ทุกอุปกรณ์ออนไลน์" text.

---

### Per-site Status Table (full width)

Card with header **"สถานะแต่ละสาขา"**.

Columns: สาขา | กล้องทั้งหมด | ออนไลน์ | ออฟไลน์ | แจ้งเตือน | สถานะ

Site name is a clickable link (`var(--accent)`).  
Status column: badge — "ปกติ" (ok), "มีปัญหา" (warn), "ออฟไลน์" (alert).

| สาขา | ทั้งหมด | ออนไลน์ | ออฟไลน์ | แจ้งเตือน | สถานะ |
|---|---|---|---|---|---|
| สำนักงานใหญ่ | 48 | 46 | 2 | 3 | มีปัญหา |
| สาขาสีลม | 36 | 35 | 0 | 1 | มีปัญหา |
| สาขาลาดพร้าว | 44 | 43 | 1 | 0 | มีปัญหา |
| สาขาบางนา | 20 | 20 | 0 | 0 | ปกติ |
| คลังสินค้า | 16 | 16 | 0 | 0 | ปกติ |

---

## Output

- One complete HTML file named `screens_dashboard.html`
- All CSS in `<style>` block + the two external stylesheet links
- No JavaScript — static only
- No CSS frameworks
- Pulsing red dot animation via CSS `@keyframes` only
