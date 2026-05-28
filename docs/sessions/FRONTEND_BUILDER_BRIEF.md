# Frontend Builder Brief — SSM Network Monitor

> **For:** Frontend Team (Claude playing the builder role)
> **Date:** 2026-05-28
> **Purpose:** Context you need to present your work confidently to a reviewer

---

## Your Role in This Review

You are the **frontend builder**. You designed and built the React SPA from scratch across phases F1–F9. The reviewer has read `REVIEW_BRIEF.md` and will ask you to walk them through the work, justify decisions, and explain edge cases.

**The reviewer is not Ran.** They don't know the project history. Treat them as a capable engineer seeing this codebase for the first time.

---

## What You Built (F1–F9 Summary)

| Phase | What Was Delivered |
|---|---|
| F1 | Project scaffolding — Vite + React + TypeScript + Ant Design, Buono purple theme, dark/light mode, Auth flow (LoginPage → JWT → localStorage) |
| F2 | AppLayout — sidebar nav, breadcrumb, theme toggle, role-aware menu hiding |
| F3 | OverviewPage + DashboardPage shell — live device status summary, per-site card grid |
| F4 | TopologyPage — collapsible Site → Building → Floor tree, camera/alert counts |
| F5 | SitesPage + BuildingDetailPage + SitesCrudPage — hierarchy drill-down, admin CRUD |
| F6 | FloorPlanPage — SVG floor plan viewer, draggable camera pins (PATCH /api/cameras/{id}/position), auth-guarded image fetch |
| F7 | Devices — CamerasPage, NVRsPage, SwitchesPage with filters; Detail pages for each |
| F8 | RacksListPage + RackDetailPage — rack status, device list, active alerts |
| F9 | Wire all pages to real backend API (localhost:50680 via Vite proxy); replace all mock data |

---

## Key Technical Decisions — and Why

### 1. Ant Design, not a custom component library
**Decision:** Use antd for all UI components.
**Why:** The system targets intranet desktop users. Antd's table, form, and layout components handle real data density well. Building custom components would cost weeks with no user-facing benefit.
**Trade-off accepted:** Antd bundle is large (~1 MB gzipped). Acceptable for intranet — no CDN latency concern.

### 2. Zustand, not Context API or Redux
**Decision:** Zustand for global state (auth token, theme).
**Why:** Only 2 pieces of truly global state. Redux is overkill; Context re-renders the whole tree on every change. Zustand gives selector-based subscriptions with minimal boilerplate.

### 3. JWT in localStorage, not httpOnly cookie
**Decision:** Store JWT in localStorage.
**Why:** The backend is a separate origin (`localhost:50680`). Cookies with `SameSite=Strict` would be blocked cross-origin without CORS cookie config. Since this is an intranet system with no XSS risk from user-generated content, localStorage is acceptable.
**If reviewer asks about XSS:** Noted risk. Acceptable trade-off for an intranet system with no user-generated content.

### 4. Vite proxy, not hardcoded API URL
**Decision:** All API calls use `/api/...` — Vite proxies them to `localhost:50680`.
**Why:** Avoids CORS issues in dev. In production (if ever deployed), the proxy config can point to the real server with a single change.

### 5. Floor plan image fetched with Axios, not `<img src>`
**Decision:** `axios.get(..., { responseType: 'blob' })` → `URL.createObjectURL()`
**Why:** The `/api/floors/{id}/floor-plan/image` endpoint requires an `Authorization: Bearer` header. Plain `<img src>` cannot send headers. This is a documented constraint in `docs/FRONTEND_HANDOFF.md`.

### 6. Camera position as 0–100, not 0–1
**Decision:** Frontend sends `{ x: 23.5, y: 67.1 }` where values are percentages (0–100).
**Why:** CSS and SVG positioning naturally use percentages. Storing as 0–100 is more readable in dev tools. Backend (PATCH /api/cameras/{id}/position) was updated in R4 to accept this range.

---

## Role Guard Implementation

Role is decoded from the JWT on login and stored in Zustand auth store.

```ts
// In AppLayout sidebar — menu items hidden by role
const isAdmin  = role === 'admin'
const canSeeDevices = isAdmin
const canSeeRooms   = isAdmin || role === 'user'

// On restricted pages — 403 guard component
if (!canSeeDevices) return <AccessDenied />
```

Pages that require admin show an "Access Denied" component instead of redirecting — this is intentional so the URL stays bookmarkable and the user understands why they can't see the page.

---

## API Connections (per page)

| Page | Endpoints Used |
|---|---|
| Overview | GET /api/status/devices, GET /api/dashboard/summary |
| Topology | GET /api/hierarchy/tree |
| Sites (read) | GET /api/hierarchy/tree (siteId filter) |
| Sites CRUD | GET/POST/POST {id}/POST delete/{id} /api/sites |
| Building Detail | GET /api/buildings/{id}, GET /api/hierarchy/tree |
| Floor Plan | GET /api/floors/{id}/floor-plan/image, GET /api/cameras?Floor_ID=, PATCH /api/cameras/{id}/position |
| Racks List | GET /api/racks?Site_ID= |
| Rack Detail | GET /api/racks/{rackId} |
| Cameras | GET /api/cameras?Site_ID=&Floor_ID=&status= |
| Camera Detail | GET /api/cameras?id= |
| NVRs | GET /api/nvrs?Site_ID=&Rack_ID= |
| NVR Detail | GET /api/nvrs?NVR_ID= |
| Switches | GET /api/poe-switches?Site_ID=&Rack_ID= |
| Switch Detail | GET /api/poe-switches?SW_ID= |
| Users | GET/POST/POST {id}/POST delete/{id} /api/users |

---

## Common Reviewer Questions — Suggested Answers

**Q: Why is there no real-time WebSocket?**
> The system polls every 30 seconds. For an intranet monitoring dashboard with ~30 users, polling is operationally simpler (no persistent connections, no reconnect logic) and the latency difference is imperceptible. If requirements change, the status endpoint is designed to be lightweight for high-frequency polling.

**Q: What happens if the backend is down?**
> All pages show an error state (Ant Design Alert component with the error message). No page crashes — all API calls are wrapped in try/catch with a fallback UI.

**Q: Why is the floor plan SVG stored on the backend and not bundled with the frontend?**
> Floor plans change over time as buildings are renovated. Bundling SVGs would require a frontend redeploy for every floor plan update. Storing on the backend (registered via POST /api/floor-plans) lets admins update floor plans through the API without touching the frontend.

**Q: How does the drag-and-save work on FloorPlanPage?**
> `onDragEnd` calculates the camera's new position as a percentage of the SVG container (0–100 on both axes). It calls `PATCH /api/cameras/{id}/position` with `{ x, y }`. The position is saved in the DB and reloaded on next page visit via GET /api/cameras?Floor_ID=.

**Q: How is theme (light/dark) persisted?**
> Zustand store with `persist` middleware — stored in localStorage under key `theme`. On app load, the stored value is read and applied to `document.documentElement` as a `data-theme` attribute.

---

## Known Issues / Accepted Limitations

| Issue | Status |
|---|---|
| Floor plan shows SVG fallback if no image uploaded | By design — fallback is a placeholder SVG |
| Camera pins at position (null, null) appear in "Unplaced" section | Handled — null position cameras shown separately |
| No mobile layout | Accepted — intranet desktop only |
| No unit tests in frontend | Accepted for timeline — manual testing via all 3 roles |

---

## If Reviewer Asks to See Code

Key files to show:
- `src/App.tsx` — routing structure
- `src/pages/DashboardPage.tsx` — nested routes
- `src/pages/FloorPlanPage.tsx` — most complex page (drag, auth image fetch)
- `src/stores/` — Zustand stores (auth, theme)
- `vite.config.ts` — proxy config

---

*Frontend Team: Claude Sonnet 4.6 | Backend: Ran | 2026-05-28*
