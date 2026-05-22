# SSM v1.0 — Wireframe Status

> Last updated: 2026-05-22
> Tool: Claude Design
> Token reset: Monday 2026-05-25

---

## Pages Generated

| Page | File | Status | Notes |
|---|---|---|---|
| Home — Topology | `SSM_wepapp/Home Topology Wireframe (standalone).html` | ✅ Approved | Light mode, dark HQ node, dot grid canvas |
| Site Overview | `SSM_wepapp/Site Overview.html` | ⚠️ Draft | Isometric buildings render as hollow — visual issue, keeping for now |
| Building Detail | `SSM_wepapp/Building Detail.html` | ⚠️ Draft | Same hollow building issue as Site Overview |
| Floor Plan | `SSM_wepapp/Floor Plan.html` | ✅ Draft | View / Edit mode toggle, camera icons on floor plan |
| Rack Detail | `SSM_wepapp/Rack Detail.html` | ✅ Draft | Dark rack panel, NVR/Switch/PDU icons, U-position layout — best page so far |

---

## Pages Pending (Claude Design token resets Mon 2026-05-25)

| Page | Route | Priority |
|---|---|---|
| Login | `/login` | MVP |
| Site List | `/sites` | MVP |
| Camera Detail | `/devices/cameras/:id` | MVP |
| NVR Detail | `/devices/nvrs/:id` | Can gen together with Camera |
| Switch Detail | `/devices/switches/:id` | Can gen together with Camera |
| User Management | `/admin/users` | Phase 7.5 |

---

## Known Issues

| Issue | Affects | Plan |
|---|---|---|
| Isometric buildings look hollow (no solid faces) | Site Overview, Building Detail | Fix after token reset or during implementation |
| Sub U-position not shown in Rack Detail | Rack Detail | Add during React implementation |

---

## Design Decisions (from this session)

- Style: **Modern Minimal**
- Default theme: **Light** (works everywhere — meetings, projector, outdoors)
- Dark mode: available via toggle
- Canvas background: `#f0f2f5` with dot grid `#d0d5dd`
- Alert colors: Red `#dc2626` / Yellow `#d97706` / Green `#16a34a`
- Polling: every **30 seconds**
