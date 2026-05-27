# Task: Floor Plan Page Redesign (with Mode Toggle)

## Mockup target
`output/screens_floor.html`

## Route
`/dashboard/floors/:floorId`

## React files
- Update `src/pages/FloorPlanPage.tsx`
- Update `src/styles/floor.css`

## Core requirement
The floor plan page must support **2 modes** switchable via toggle button:

### Mode A — Top View (2D map)
- SVG-based floor plan showing room layout from above
- Camera icons overlaid at their install positions (colored dot = status)
- Clicking a camera dot → opens camera info popup (name, IP, status, last seen)
- Rooms labeled (ห้องประชุม, Lobby, Server Room, etc.)
- Simple, minimal — no 3D

### Mode B — Edit Mode
- Same 2D layout but cameras are **draggable**
- Drag camera to reposition → save button appears
- Visual feedback: dragging camera shows dashed outline
- Save button: "บันทึกตำแหน่ง" → calls PATCH /api/cameras/{id}/position

## Mode toggle
- Toggle button top-right of canvas: `[View] [Edit]` pill switch
- Default = View mode
- Edit mode shows save/cancel bar at bottom

## Other UI elements
- Page header: Floor name + building breadcrumb (Building A > F3 — Office)
- Camera legend: dot colors (green=online, orange=warning, red=offline)
- Camera count summary: "12 cameras · 11 online · 1 offline"
- Zoom in/out buttons (+ / - )

## Mock data to show
- Floor: A-F3 (Building A, Floor 3 — Office)
- 8 cameras placed around the floor
  - 6 online (green), 1 warning (orange), 1 offline (red)
- Rooms: Open Office, Meeting Room A, Meeting Room B, Kitchen, Corridor

## Constraints
- No sidebar/topbar in mockup
- Dark mode primary
- CSS tokens only
- Lucide icons for buttons
- Show BOTH modes in the mockup (side by side or as separate states)
