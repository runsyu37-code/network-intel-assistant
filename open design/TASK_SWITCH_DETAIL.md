# Task: Switch Detail Page Redesign

## Mockup target
`output/screens_switch-detail.html`

## Route
`/dashboard/switches/:switchId`

## React files
- Update `src/pages/SwitchDetailPage.tsx`
- CSS in `src/styles/camera.css` (shared `.nvr-detail` layout)

## Layout (2-column)
```
Left column (288px fixed):
  - Info card: Switch name + status badge, IP, model, site, rack, uptime
  - Port summary card: total ports, active ports, error ports

Right column (flex 1):
  - Hardware port panel (dark bg #1a1a1a): visual port grid with LED dots
  - Traffic chart: SVG line chart — TX (accent color) + RX (ok color), 24h window
  - Port statistics table: port # | status | speed | device connected
```

## Key components to show
- Hardware panel: dark chassis look, 2 rows of ports, each port has LED dot
  - LED colors: green (active), gray (inactive), yellow (error)
  - Port label below each port (P1, P2 ... P24)
- Traffic chart: X-axis = -24h to Now, Y-axis = 0 / 500M / 1G
  - TX line = var(--accent), RX line = var(--ok)
  - Legend top-right
- Port stats table: 6-8 rows, columns: Port | Speed | Status | Connected Device

## Mock data
- Switch: SW-FLOOR-B2
- Status: Warning
- IP: 192.168.1.3
- Model: TP-Link TL-SG3424
- Ports: 24 total, 18 active, 1 error (port 14)
- Uptime: 12d 6h
- Traffic: TX ~650 Mbps, RX ~420 Mbps

## Constraints
- No sidebar/topbar
- Dark mode primary
- CSS tokens only
- JetBrains Mono for numbers/IPs
- No emoji
