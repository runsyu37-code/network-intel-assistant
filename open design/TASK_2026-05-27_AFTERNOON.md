# Afternoon Session — 2026-05-27

## Goals
1. Dashboard page — summary stats + recent alerts
2. CRUD (Create / Edit / Delete) — Sites → Cameras → NVRs → Switches

---

## Dashboard

- **Mockup:** `open design/input/screens_dashboard.html` (moved from done/)
- **Route:** `/dashboard` — becomes the default landing page after login
  - Update redirect in `App.tsx`: after login → `/dashboard` instead of `/dashboard/topology`
  - Add entry in sidebar nav
- **Data:** mock only (no real API yet)

---

## CRUD — Confirmed Details

**Entity order:** Sites → Cameras → NVRs → Switches

**UI Pattern (use existing):**
- Create / Edit → Ant Design `<Modal>` + `<Form>`
- Delete → `Modal.confirm()` from antd
- After save → update local mock state (no API call yet)

---

## Files

| File | Purpose |
|---|---|
| `open design/input/screens_dashboard.html` | Dashboard mockup (move from done/) |
| `src/pages/DashboardPage.tsx` | New file to create |
| `src/styles/dashboard.css` | New CSS file |
| `src/pages/SitesPage.tsx` | Add CRUD |
| `src/pages/CamerasPage.tsx` | Add CRUD |
| `src/pages/NVRsPage.tsx` | Add CRUD |
| `src/pages/SwitchesPage.tsx` | Add CRUD |

---

## Notes

- All CRUD writes to in-file mock array only — no real API
- Keep Modal form fields consistent with existing mock data shape per page
- Sidebar: add "Dashboard" as first nav item, icon `LayoutDashboard` from lucide-react
