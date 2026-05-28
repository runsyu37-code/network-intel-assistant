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
| F1 | Project scaffolding — Vite + React + TypeScript + Ant Design, Buono purple theme, dark/light mode, Auth flow (LoginPage → real JWT from backend → localStorage) |
| F2 | AppLayout — sidebar nav, breadcrumb, theme toggle, role-aware menu hiding |
| F3 | OverviewPage — live device status summary, per-site card grid, alert feed |
| F4 | TopologyPage — React Flow network diagram (HQ node + site nodes), drag-to-reposition with localStorage persistence, edit mode for admin |
| F5 | SitesPage + BuildingDetailPage — hierarchy drill-down (Site → Building → Floor), admin CRUD modals in-page |
| F6 | FloorPlanPage — floor plan background (static image or SVG fallback), draggable camera pins, PATCH /api/cameras/{id}/position on drag end |
| F7 | Devices — CamerasPage, NVRsPage, SwitchesPage with filters + CRUD; Detail pages for each with API merge pattern |
| F8 | RacksListPage + RackDetailPage — rack status, device list, active alerts, auto-assign U positions |
| F9 | Wire all pages to real backend API (localhost:50680 via Vite proxy); mock fallback data on every page |

---

## Key Technical Decisions — and Why

### 1. Ant Design, not a custom component library
**Decision:** Use antd for Form, Modal, Table, Select components.
**Why:** The system targets intranet desktop users. Antd's components handle real data density well. Building custom components would cost weeks with no user-facing benefit.
**Trade-off accepted:** Antd bundle is large (~1 MB gzipped). Acceptable for intranet — no CDN latency concern.

### 2. Zustand, not Context API or Redux
**Decision:** Zustand for global state (auth token + user, theme).
**Why:** Only 2 pieces of truly global state. Redux is overkill; Context re-renders the whole tree on every change. Zustand gives selector-based subscriptions with minimal boilerplate.

### 3. JWT in localStorage, not httpOnly cookie
**Decision:** Store JWT in localStorage.
**Why:** The backend is a separate origin (`localhost:50680`). Cookies with `SameSite=Strict` would be blocked cross-origin without CORS cookie config. Since this is an intranet system with no XSS risk from user-generated content, localStorage is acceptable.
**If reviewer asks about XSS:** Noted risk. Acceptable trade-off for an intranet system with no user-generated content.

### 4. Vite proxy, not hardcoded API URL
**Decision:** All API calls use `/api/...` — Vite proxies them to `localhost:50680`.
**Why:** Avoids CORS issues in dev. In production, the proxy config points to the real server with a single change in `vite.config.ts`.

### 5. Floor plan image served as static file, not authenticated fetch
**Decision:** Floor plan images are placed in `public/floorplans/{floorId}.{ext}` and served as static files. `<img src>` tries extensions in order: jpg → jpeg → png → svg → webp.
**Why:** The backend does not expose a floor plan image endpoint with auth. Static file serving through Vite is simpler and sufficient for the intranet context.
**If reviewer asks:** If auth-gated images are required in future, the pattern would change to `axios.get(..., { responseType: 'blob' })` + `URL.createObjectURL()` with `Authorization: Bearer` header.

### 6. Camera position as 0–100, not 0–1
**Decision:** Frontend sends `{ x: 23.5, y: 67.1 }` where values are percentages (0–100).
**Why:** CSS positioning naturally uses percentages. Storing as 0–100 is more readable in dev tools. Backend (PATCH /api/cameras/{id}/position) was updated in R4 to accept this range.

### 7. Mock fallback data on every page
**Decision:** Every page initialises state with a hardcoded fallback array. If the API returns data, state is updated; if not, the mock remains.
**Why:** Enables development and demo without a running backend. Never shows a blank screen to users.

---

## Role Guard Implementation

Role is decoded from the JWT on login (`extractJwtUser`) and stored in Zustand auth store.

```ts
// canEdit() = admin OR user (viewer is read-only)
canEdit: () => {
  const role = get().user?.role
  return role === 'admin' || role === 'user'
}

// Sidebar — Users page hidden from non-admin
const showUsers = isAdmin()

// On restricted pages
if (!canEdit()) return <AccessDenied />
```

Pages that require admin show an "Access Denied" component instead of redirecting — the URL stays bookmarkable and the user understands why they can't see the page.

---

## API Connections (per page)

| Page | Endpoints Used |
|---|---|
| Overview | GET /api/status/devices, GET /api/dashboard/summary, GET /api/alert-logs |
| Topology | GET /api/dashboard/summary (header stats) |
| Sites | GET /api/hierarchy/tree |
| Building Detail | GET /api/hierarchy/tree |
| Floor Plan | GET /api/cameras?Floor_ID=, PATCH /api/cameras/{id}/position |
| Racks List | GET /api/racks?Site_ID= |
| Rack Detail | GET /api/racks/{rackId} |
| Cameras | GET /api/cameras |
| Camera Detail | GET /api/cameras?id=, GET /api/ping-logs |
| NVRs | GET /api/nvrs |
| NVR Detail | GET /api/nvrs (filter by NVR_ID) |
| Switches | GET /api/poe-switches |
| Switch Detail | GET /api/poe-switches (filter by SW_ID) |
| Users | GET/POST/POST {id}/POST delete/{id} /api/users |
| Topbar | GET /api/alert-logs (limit 5) |
| Sidebar | GET /api/dashboard/summary (device counts) |

---

## Common Reviewer Questions — Suggested Answers

**Q: Why is there no real-time WebSocket?**
> The system polls every 30 seconds via `refetchInterval` in React Query. For an intranet monitoring dashboard with ~30 users, polling is operationally simpler (no persistent connections, no reconnect logic) and the latency difference is imperceptible. If requirements change, the status endpoint is designed to be lightweight for high-frequency polling.

**Q: What happens if the backend is down?**
> Every page initialises from a hardcoded mock array. If the API call fails or returns no data, the page stays on the mock — no crash, no blank screen. The user sees a working UI with demonstration data until the backend recovers.

**Q: Why is the floor plan image not fetched with auth headers?**
> Current implementation uses static files from `public/floorplans/`. If the backend adds an auth-gated image endpoint in the future, the change is straightforward: swap `<img src>` for `axios.get(..., { responseType: 'blob' })` + `URL.createObjectURL()`.

**Q: How does the drag-and-save work on FloorPlanPage?**
> `onDragEnd` calculates the camera's new position as a percentage of the container (0–100 on both axes) and calls `PATCH /api/cameras/{id}/position` with `{ x, y }`. The position is saved to the DB. Note: `GET /api/cameras` does not yet return `position_x`/`position_y` — so saved positions are not restored on page reload. This is a known pending item with the backend team.

**Q: How is theme (light/dark) persisted?**
> Zustand store with `persist` middleware — stored in localStorage under key `ssm.theme`. On app load, the stored value is read and applied as a `data-theme` attribute on the root element, which switches the CSS token set.

---

## Known Issues / Accepted Limitations

| Issue | Status |
|---|---|
| Floor plan camera positions not restored after reload | Pending — GET /api/cameras does not return position_x/y yet |
| Floor plan shows SVG fallback if no image in public/floorplans/ | By design — fallback is a generic room SVG |
| SitesPage uses siteId/siteCode matching — may fall back to mock if DB IDs differ | Accepted — graceful fallback to mock data |
| No mobile layout | Accepted — intranet desktop only |
| No unit tests in frontend | Accepted for timeline — manual testing across all 3 roles |

---

## If Reviewer Asks to See Code

Key files to show:
- `src/App.tsx` — routing structure + AntApp wrapper
- `src/api/client.ts` — Axios instance with auth interceptor
- `src/pages/FloorPlanPage.tsx` — most complex page (drag, position save, zoom)
- `src/pages/RackDetailPage.tsx` — API merge pattern + auto-assign device positions
- `src/stores/authStore.ts` — Zustand auth store (JWT + role)
- `vite.config.ts` — proxy config

---

*Frontend Team: Claude Sonnet 4.6 | Backend: Ran | 2026-05-28*
