# Task: Topology Page — Simplified

## Mockup target
`output/screens_topology.html`

## Route
`/dashboard/topology`

## React files
- Update `src/pages/TopologyPage.tsx`
- Update `src/styles/topology.css`

## Problem with current version
The current topology is too complex and noisy. Simplify it.

## What to show
A **clean network topology diagram** — nodes and edges only, no clutter.

### Node types (3 levels)
```
HQ / Site node
  └── Building node (per building)
        └── Device nodes: NVR | Switch | Camera (grouped, not all individual)
```

### Simplification rules
- Do NOT show individual camera nodes — show a group node "48 Cameras" instead
- Show only: Sites → Buildings → NVR + Switch per building
- Status color on each node border (ok=green, warn=orange, alert=red)
- Clicking a Building node → navigate to `/dashboard/sites/:siteId`
- Clicking an NVR/Switch node → navigate to its detail page

### Layout
- Left panel (240px): Node legend + filter (show/hide offline nodes toggle)
- Right area (flex 1): React Flow canvas with nodes
- Nodes use custom styled boxes, not default React Flow defaults
- Edge style: straight or bezier, color = var(--border), animated if status warn/alert

### Node design
```
Site node:    [icon] Site Name     — rounded rect, accent border
Building node:[icon] Building A    — smaller rect
Device node:  [icon] NVR-01 · IP  — compact, mono IP
Group node:   [camera icon] 48 cameras — pill shape with count
```

## Mock data
- 1 HQ site → 3 buildings (A, B, C)
- Building A: NVR-01, NVR-02, SW-CORE-01, group "48 cameras"
- Building B: NVR-03, SW-FLOOR-B2 (warning), group "36 cameras"
- Building C: NVR-04, SW-FLOOR-C1, group "20 cameras"

## Constraints
- No sidebar/topbar in mockup
- Dark mode primary
- CSS tokens only
- Keep it clean — less is more
- Show status badges on nodes with issues (warn/alert)
