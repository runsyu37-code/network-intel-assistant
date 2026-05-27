# Task: NVR Detail Page Redesign

## Mockup target
`output/screens_nvr-detail.html`

## Route
`/dashboard/nvrs/:nvrId`

## React files
- Update `src/pages/NVRDetailPage.tsx`
- CSS already in `src/styles/camera.css` (shared `.nvr-detail`, `.nvr-info-col`, `.nvr-chart-col`)

## Layout (2-column, same pattern as Camera Detail)
```
Left column (288px fixed):
  - Info card: NVR name + status badge, IP, model, site, rack
  - Channel usage card: used/total ch + progress bar

Right column (flex 1):
  - HDD storage card: progress bar per drive (HDD1 78%, HDD2 91% alert)
  - 30-day uptime bar (30 blocks, ok/warn/alert colors)
  - Recording stats: resolution, retention days, bitrate
```

## Key components to show
- Status badge (pill style: Online/Warning/Offline) in page header
- HDD drive rows — each row: drive label + progress bar + pct + color (ok < 80%, warn 80-90%, alert > 90%)
- Uptime blocks: 30 bars, color-coded, hover shows date
- Stats grid: 3 items (Active Channels / Retention / Avg Bitrate)

## Mock data to show in mockup
- NVR name: NVR-03
- Status: Warning
- IP: 192.168.1.23
- Model: Dahua NVR5216-EI
- Site: สาขาสีลม
- HDD1: 45% (ok), HDD2: 91% (alert — highlight red)
- Channels: 8/16
- Uptime: mostly ok, 3 warn days, 1 offline day

## Constraints
- No sidebar/topbar in mockup — page content only (padding 24px)
- CSS tokens only — no hardcoded colors
- Dark mode primary
- No emoji
- JetBrains Mono for all numbers/IPs
