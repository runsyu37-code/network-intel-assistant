# Wireframe Brief — SSM v1.0 Surveillance Smart-Monitor

> Purpose: Feed this file into Claude Design to generate rough wireframes for each page.
> Last updated: 2026-05-22

---

## Project Overview

**SSM v1.0** is an internal web application for monitoring CCTV cameras, NVR devices, and PoE Switches across multiple sites within an organization.

**Core concept:** Hierarchical drill-down map — Site → Building → Floor → Room → Rack → Device

**Key behaviors:**
- If a device goes offline → alert color (red) propagates up every layer automatically
- Alerts are also sent to a Discord channel (server-side, not UI)
- Status updates via polling every 30 seconds

---

## Design System

| Property | Value |
|---|---|
| Style | Modern Minimal |
| Theme | Dark + Light (user toggleable) |
| Primary color | TBD — Claude to recommend |
| Alert colors | 🔴 Red = offline / critical, 🟡 Yellow = warning, 🟢 Green = online |
| Typography | Clean sans-serif, high readability |
| Layout | Sidebar (navigation) + Main content area + Breadcrumb |

---

## Global Layout

```
┌──────────────┬────────────────────────────────────────┐
│   SIDEBAR    │  Breadcrumb: Site A > Building 1 > ... │
│              │────────────────────────────────────────│
│ 🗺 Sites     │                                        │
│  ├ Site A 🔴 │         Main Content Area              │
│  ├ Site B 🟢 │                                        │
│  └ Site C 🟢 │                                        │
│              │                                        │
│ 📱 My Devices│                                        │
│  └ + Add     │                                        │
│              │                                        │
│ [Dark/Light] │                                        │
│ [User: Admin]│                                        │
└──────────────┴────────────────────────────────────────┘
```

---

## Pages

### 1. Login — `/login`
- Access: All
- Components: Logo, email + password fields, login button
- Style: Centered card, clean background

---

### 2. Home — `/` (Topology Diagram)
- Access: All
- Components:
  - Network topology mindmap (React Flow)
  - HQ node at center
  - Site nodes connected by lines (representing real network connections)
  - Sites with alerts show 🔴 on node
  - Click site node → navigate to `/sites/:id`
- Notes: This is the "big picture" view — shows how all sites connect

---

### 3. Site List — `/sites`
- Access: All
- Components:
  - Grid or list of site cards
  - Each card: site name, location, alert status badge (🔴/🟢)
  - Click card → navigate to `/sites/:id`

---

### 4. Site Overview — `/sites/:site_id`
- Access: All
- Components:
  - Isometric top-down view of all buildings in the site
  - Each building shown as 3D-style block
  - Buildings with alerts show 🔴
  - Outdoor cameras shown as icons on building exterior
  - Click building → navigate to `/sites/:id/buildings/:id`

---

### 5. Building Detail — `/sites/:site_id/buildings/:building_id`
- Access: All
- Components:
  - Isometric side view of building — floors visible like a cross-section
  - Each floor shown as a layer
  - Floors with alerts show 🔴
  - Floor count visible at a glance (no need for floor numbers)
  - Click floor → navigate to floor plan (Admin/User only — Guest sees this but cannot click through)

---

### 6. Floor Plan — `/sites/:site_id/buildings/:building_id/floors/:floor_id`
- Access: Admin, User
- Components:
  - 2D floor plan image as background
  - Camera icons placed at real positions on the plan
  - Each icon shows: camera name (User sees name only), status color 🔴🟢
  - 2 modes:
    - **View mode** (default): read-only, toggle show/hide icons
    - **Edit mode** (Admin only): drag icons to reposition, add new camera by dropping onto plan
  - Click camera icon → navigate to `/devices/cameras/:id` (Admin only)

---

### 7. Room View — `/rooms/:room_id`
- Access: Admin only
- Components:
  - Room layout showing rack positions
  - Each rack shown as a cabinet icon
  - Racks with alerts show 🔴
  - Click rack → navigate to `/racks/:id`

---

### 8. Rack Detail — `/racks/:rack_id`
- Access: Admin only
- Components:
  - Interactive rack diagram (vertical, U-position based)
  - Each U slot shows: device name, type icon, status color
  - Empty slots shown as available (click to add device)
  - Click device → navigate to device detail page

---

### 9. Camera Detail — `/devices/cameras/:id`
- Access: Admin only
- Components:
  - Status badge: Online 🟢 / Offline 🔴
  - Info table: IP, MAC, Serial No., OS, connected NVR, switch port
  - Ping history graph (Recharts) — last 24h
  - Alert log: list of recent alerts with timestamp

---

### 10. NVR Detail — `/devices/nvrs/:id`
- Access: Admin only
- Components:
  - Status badge
  - Info table: IP, MAC, Serial No., channel count, location
  - Connected cameras list
  - Ping history graph

---

### 11. Switch Detail — `/devices/switches/:id`
- Access: Admin only
- Components:
  - Status badge
  - Info table: IP, MAC, Serial No., port count, location
  - Port map: visual grid of ports, each showing connected device name + status
  - Ping history graph

---

### 12. User Management — `/admin/users`
- Access: Admin only
- Components:
  - User list table: name, email, role, last login, status
  - Add user button → modal form
  - Edit / Delete actions per row
  - Role dropdown: Admin / User / Guest

---

## Data Models — Form Fields for CRUD Popups

> Used when generating Add / Edit popup wireframes. Fields marked (FK) = dropdown selector.

### Site
| Field | Type | Required |
|---|---|---|
| Site ID | Text | ✅ |
| Site Name | Text | ✅ |
| Site Code | Text | |
| Location / Address | Text | |
| Description | Textarea | |

### Building
| Field | Type | Required |
|---|---|---|
| Site (FK) | Dropdown | ✅ |
| Building ID | Text | ✅ |
| Building Name | Text | ✅ |
| Building Code | Text | |
| Floor Count | Number | |
| Description | Textarea | |
| Note | Text | |
| Floor Plan Image | File upload | |

### Floor
| Field | Type | Required |
|---|---|---|
| Building (FK) | Dropdown | ✅ |
| Floor ID | Text | ✅ |
| Floor Number | Number | |
| Floor Name | Text | |
| Main Function | Text | |
| Has CCTV | Toggle | |
| Note | Text | |
| Floor Plan Image | File upload | |

### Room
| Field | Type | Required |
|---|---|---|
| Floor (FK) | Dropdown | ✅ |
| Room ID | Text | ✅ |
| Room Name | Text | ✅ |
| Room Type | Dropdown (server / network / office / power / other) | |
| Has NVR | Toggle | |
| Has Switch | Toggle | |
| Note | Text | |

### Rack
| Field | Type | Required |
|---|---|---|
| Room (FK) | Dropdown | ✅ |
| Rack ID | Text | ✅ |
| Rack Name | Text | ✅ |
| Total U | Number (default 42) | ✅ |
| Note | Text | |

### Camera
| Field | Type | Required |
|---|---|---|
| Floor (FK) | Dropdown | ✅ |
| Device Name | Text | ✅ |
| Brand / Model | Text | |
| Serial No. | Text | |
| MAC Address | Text | |
| Camera Type | Text | |
| Resolution | Text | |
| IP Address | Text | |
| VLAN | Number | |
| NVR (FK) | Dropdown | |
| NVR Channel | Number | |
| PoE Switch (FK) | Dropdown | |
| Switch Port | Number | |
| Status | Dropdown (online / offline / warning / unknown) | |
| Notes | Textarea | |

### NVR
| Field | Type | Required |
|---|---|---|
| Rack (FK) | Dropdown | ✅ |
| Device Name | Text | ✅ |
| Brand / Model | Text | |
| Serial No. | Text | |
| MAC Address | Text | |
| IP (Internet Port) | Text | |
| IP (CCTV Port) | Text | |
| OS / Firmware | Text | |
| VLAN | Number | |
| Total Channels | Number | |
| Active Channels | Number | |
| HDD Total (TB) | Number | |
| Recording Resolution | Text | |
| Retention (days) | Number | |
| Record Status | Dropdown (normal / warning / error / stopped) | |
| U Position | Number | |
| Status | Dropdown (online / offline / warning / unknown) | |
| Notes | Textarea | |

### PoE Switch
| Field | Type | Required |
|---|---|---|
| Rack (FK) | Dropdown | ✅ |
| Device Name | Text | ✅ |
| Brand / Model | Text | |
| Serial No. | Text | |
| MAC Address | Text | |
| Switch Type | Dropdown (PoE / Non-PoE / Core / Aggregation) | |
| IP Address | Text | |
| OS / Firmware | Text | |
| VLAN | Number | |
| Total Ports | Number | |
| PoE Ports | Number | |
| PoE Budget (W) | Number | |
| Uplink Port | Text | |
| U Position | Number | |
| Status | Dropdown (online / offline / warning / unknown) | |
| Notes | Textarea | |

---

## Notes for Claude Design

- Prioritize readability of alert status colors at all times
- Dark theme: use deep navy or dark gray background (not pure black)
- Light theme: use off-white or light gray (not pure white)
- The isometric views (Site Overview, Building Detail) are the most visually complex — rough sketch is fine
- Rack diagram should feel like a real server rack (vertical, U-numbered)
- All pages share the same sidebar + breadcrumb global layout (except Login)
