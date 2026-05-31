# SSM Project Brief — Full Context for Strategic Review

> **Purpose:** Hand this file to Opus (or any strategic AI) to get a project-focused plan.
> Context compiled from all session logs, F9 coordination notes, DEV.md, LEARNING_LOG, and source files.
> **Last updated:** 2026-05-31

---

## Prompt (copy-paste to Opus)

```
Please read this file carefully. Ignore portfolio, master's, and investing goals for now.
Focus only on the active project described below. I need a practical roadmap for two teams
(frontend + backend) to finish the remaining work without backtracking. Identify the correct
build order so neither team has to redo work because the other team wasn't ready. Also
identify what coordination documents or API contracts would prevent the recurring "frontend
waits on backend" problem we've had throughout this project.
```

---

## 1. Project Overview

**Name:** Surveillance Smart-Monitor (SSM)
**Type:** Internal network operations web application
**Purpose:** Monitor CCTV infrastructure across multiple sites — track device status,
drill into floor plans, get alerts when cameras go offline, and manage device inventory.

**Hierarchy model:**
```
Site → Building → Floor → Room → Rack → Device (Camera / NVR / Switch)
```

**Stack:**
- Frontend: React 18 + Vite 6 + TypeScript, port 3000
- Backend: ASP.NET Core .NET 10 (C#), port 50680
- DB: SQL Server (SSMS)
- Auth: JWT, 8-hour tokens, RBAC (admin / user / viewer)
- Alerts: Python PingService → Discord webhook

**Two-team model:** Ran is on both teams in practice, but frontend and backend are
developed in separate branches (`frontend`, `backend`) and communicate through F9 log files
(markdown request/reply documents in the `F9/` folder).

---

## 2. What Has Been Built (History)

### Phase 1 — Backend (Phase 7–13, completed ~May 2026)

The backend was built first, over many sessions.

| Milestone | What was delivered |
|---|---|
| Phase 7–8 | Core models: Sites, Buildings, Floors, Cameras, NVRs, Switches, Racks |
| Phase 9–10 | JWT auth + RBAC (admin/user/viewer), login endpoint, role middleware |
| Phase 11 | PingService: Python pings every camera every N minutes; after 3 failures marks it offline, cascades status up the hierarchy |
| Phase 12 | Alert system: alert_logs table, Discord webhook on status change |
| Phase 13 | Security hardening: 43/43 security gate PASS, rate limiting, CORS |
| Post-13 | PATCH /api/sites/{id}/position (topology node persistence) |

All 43 security tests pass. Backend is in maintenance mode — only adding endpoints when
frontend requests them through F9.

### Phase 2 — Frontend (F1–F9, completed ~May 2026)

| Phase | What was delivered |
|---|---|
| F1–F3 | UI scaffolding: sidebar, topbar, routing, auth store (Zustand), theme (light/dark) |
| F4–F5 | All 13 page components built with mock/static data |
| F6–F7 | Floor plan with camera pin drag-and-drop (edit mode, admin only) |
| F8 | React Flow topology page with real Site_IDs, node positions persist to API via PATCH |
| F9 | All pages wired to real API (React Query + Axios), JWT interceptor, RBAC route guards |

**Additional features built post-demo:**
- Building Map (Leaflet, satellite + OSM tiles, circle markers, site filter)
- Building detail: floor drag-to-sort (admin, stored in localStorage)
- Floor plan: localStorage position fallback (when API returns null)
- Topology: positions persist to DB via PATCH /api/sites/{id}/position

**Demo delivered:** ~2026-05-30, roughly 2 months ahead of the original late-July deadline.
All 13 routes work end-to-end with real API. Login with JWT, RBAC route guards active.

---

## 3. Current Problems (as of 2026-05-31)

### P1 — Floor Plan: Camera icon and status indicator are misaligned

Camera icon (the pin on the floor plan image) and its status light/indicator render at
different positions. They are not overlapping correctly. This is a CSS/layout positioning
bug in `src/pages/FloorPlanPage.tsx` and `src/styles/floor.css`.

**Status:** Not yet fixed. No backend dependency.

---

### P2 — No working CRUD through the web UI

The web app can read and display all data. But users cannot create, edit, or delete anything
through the interface with actual database writes. The modals exist (cameras, NVRs, switches,
racks) but the POST/PATCH/DELETE calls are either wired to a non-functional placeholder or
simply missing.

**Affected pages:**
- CamerasPage — Add / Edit / Delete camera
- NVRsPage — Add / Edit / Delete NVR
- SwitchesPage — Add / Edit / Delete switch
- RacksListPage — Add / Edit / Delete rack
- RackDetailPage — Add device to rack, remove device from rack
- SitesCrudPage — Create / rename / delete site
- BuildingDetailPage — Add / rename / delete building (partial)
- FloorPlanPage — Upload floor plan image

**Root cause:** Backend POST/PATCH/DELETE endpoints exist for cameras, NVRs, switches, users.
But frontend never wired the write operations — CRUD modals are local-only. No mutation calls
to the API are made.

**Backend note:** DELETE uses `POST /api/cameras/delete/{id}` pattern (not HTTP DELETE).
Add/save uses array body even for single items. Update uses single object body.

---

### P3 — Building Map: Satellite view + clickable building overlays

Current state: Building Map shows OSM tiles with circle markers at lat/lng coordinates.

**What Ran wants instead:**
- Default tile layer: satellite (e.g., ESRI World Imagery or Google Satellite)
- Building footprints visible as clickable polygons or markers on the satellite view
- Click a building → navigate to `/dashboard/buildings/:id` (already implemented for
  circle markers, just needs to carry over)

**Additional blocker:** `GET /api/buildings` returns `lat: null, lng: null` for every
building because no one has filled in the coordinates in the DB yet (F9 R17/R18, no reply).

---

### P4 — Rack: Cannot add devices through UI, U-position system unused

On the Rack Detail page (`/dashboard/racks/:id`), the rack renders as a visual unit diagram
but:
- There is no UI to add a device to a specific U position
- There is no UI to remove/replace a device
- The U-position field exists in the data model but is not used anywhere in the display

**What Ran wants:**
- Click on a U slot in the rack diagram → "Add device" modal opens
- Select device type (camera, NVR, switch, patch panel) and fill details → saves to DB
- U positions shown with the device that occupies them
- Remove device from U slot

---

### P5 (Backend blocker) — GET /api/cameras does not return position_x / position_y

`PATCH /api/cameras/{id}/position` writes `position_x` and `position_y` to the DB.
But `GET /api/cameras` does not SELECT those columns — so on every page reload the
floor plan falls back to a grid layout, discarding all manually placed positions.

**Frontend workaround in place:** Positions are saved to localStorage after each drag.
On reload, localStorage values are used if API returns null. This is a fallback, not
a fix — positions won't survive a browser clear or a different machine.

**Fix needed (backend):** Add `position_x` and `position_y` to the SELECT in the
cameras GET endpoint. No frontend change needed once this is done.

---

### P6 (Backend blocker) — SQL migration for topology positions not yet run

`PATCH /api/sites/{id}/position` writes to `topology_x` and `topology_y` columns, but
these columns do not yet exist in the live DB. The migration file exists on the backend
branch but has not been run on SSMS.

```sql
ALTER TABLE [dbo].[sites] ADD [topology_x] FLOAT NULL, [topology_y] FLOAT NULL;
```

Until this runs, any drag on the topology page will error silently and positions won't persist.

---

## 4. Planned Work — What Comes Next

### 4A. Complete CRUD across all pages

Every entity in the hierarchy needs full Create / Edit / Delete wired end-to-end:

| Page | Entity | Backend endpoint | Status |
|---|---|---|---|
| CamerasPage | Camera | POST /api/cameras (array body) | ❌ not wired |
| CamerasPage | Camera | POST /api/cameras/{id} (edit) | ❌ not wired |
| CamerasPage | Camera | POST /api/cameras/delete/{id} | ❌ not wired |
| NVRsPage | NVR | POST /api/nvrs | ❌ not wired |
| SwitchesPage | Switch | POST /api/switches | ❌ not wired |
| RacksListPage | Rack | POST /api/racks | ❌ not wired |
| RackDetailPage | Device in rack | POST /api/cameras (with Rack_ID + u_position) | ❌ not wired |
| SitesCrudPage | Site | POST /api/sites | ❌ not wired |
| BuildingDetailPage | Building | POST /api/buildings | ❌ not wired |
| FloorPlanPage | Floor plan image | POST /api/floor-plans | ❌ not wired |
| UsersPage | User | POST/edit/delete /api/users | ❌ not wired (read works) |

### 4B. Satellite Building Map

- Switch map tile provider to satellite (ESRI or equivalent)
- Keep clickable markers / polygons that navigate to building detail
- Backend must fill lat/lng for at least the real buildings in use

### 4C. Rack U-Position System

- Rack diagram shows U slots (1U through max_u)
- Occupied slots show device name + type
- Click empty slot → Add device modal → POST to API with u_position field
- Click occupied slot → Edit / Remove device

### 4D. Alert System — End-to-End Test with Real Hardware

This is the planned integration test phase:

```
Real camera
    → connected to PoE switch port
    → switch uplinked to laptop (work notebook)
    → Python PingService runs on laptop, pings camera IP
    → after 3 failed pings: marks camera offline in DB
    → frontend shows red status on floor plan and topology
    → Discord webhook fires with alert message
    → unplug/replug camera → status recovers → Discord recovery message
```

**PingService status:** Python script exists in backend. Discord webhook config exists.
The end-to-end test above has not been run yet — hardware test is planned.

**Alert triage (future tool):** After the end-to-end test works, a companion tool (AI-based
or rule-based) would read the alert + topology context and suggest root cause:
"3 cameras on the same switch port cluster went offline → likely PoE budget exceeded or
upstream switch issue." This is separate from the PingService — it is a diagnosis layer.

### 4E. Two-Team Coordination (Recurring Problem)

Throughout F9, frontend repeatedly blocked on backend not returning fields that were
already in the DB (position_x/y, lat/lng). Backend didn't know frontend needed them.

**Root cause pattern:** Neither team defines a full response contract before building.
Backend returns what it stores; frontend assumes fields will be there.

**Proposed fix:** Before any new feature, write a one-page API contract specifying:
- Exact request shape (method, URL, headers, body)
- Exact response shape (all fields, types, nullable or not)
- Which fields frontend reads vs ignores
- What frontend falls back to if a field is null

Both teams sign off on the contract before either team writes code.

---

## 5. Known Technical Debt

| Item | Risk | Fix |
|---|---|---|
| Floor plan positions in localStorage only | Low — survives reload, breaks on new machine | Backend fix: return position_x/y from GET /api/cameras |
| Topology positions require SQL migration | Medium — Topology PATCH fails silently | Run ALTER TABLE on SSMS |
| Building Map has no lat/lng data | Low — map renders, just no markers | Backend team fills coordinates |
| CRUD modals are local-only | High — feels broken to users | Wire all mutation calls to API |
| HQ node in topology has no Site_ID | Low — uses localStorage separately | Design decision: add HQ as a real site, or keep as UI-only |

---

## 6. Files and Folder Structure

```
network-intel-assistant/
├── src/
│   ├── pages/          ← 1 file per route (19 pages)
│   ├── api/            ← types.ts, client.ts, hierarchy.ts, cameras.ts, etc.
│   ├── components/     ← Sidebar, Topbar, layout components
│   ├── stores/         ← authStore.ts (Zustand), themeStore.ts
│   └── styles/         ← CSS files per concern (tokens, floor, rack, topology…)
├── F9/                 ← frontend ↔ backend coordination log (markdown)
├── docs/
│   ├── me/ABOUT_ME.md
│   ├── plan/ROADMAP.md (outdated — being rewritten)
│   ├── log/LEARNING_LOG.md
│   └── sessions/       ← session logs 2026-05-29, 30, 31
├── DEV.md              ← quick-start guide, current status
├── BACKLOG.md          ← future features list
└── CLAUDE.md           ← AI assistant context file
```

**Backend branch** (`backend`): ASP.NET Core source at
`C:\ai-playground\API\BNO_Survei_MonitorAPI\`

---

## 7. Immediate Priority — Audit Use Case (MVP Scope)

Before any of the advanced features above, the project has one concrete near-term use case:

> **Auditors visit the company and need to verify every CCTV camera is working.**
> They open the web app, browse by site/building/floor, and check camera status
> (online = green, offline = red) for every camera in the company.
> That's it. That's the job right now.

This means the minimum viable version of the web app needs to do exactly this reliably:

| Requirement | Current state |
|---|---|
| Login and see all sites/buildings/floors | ✅ works |
| Drill down: Site → Building → Floor → camera list | ✅ works |
| See each camera's online/offline status | ✅ works (PingService updates DB) |
| Status shown clearly on floor plan (green dot / red dot) | ⚠️ icon + indicator misaligned (P1) |
| Camera positions persist on floor plan across reloads | ⚠️ localStorage fallback only (P5) |
| Auditor can verify every camera without touching code | ✅ mostly yes |

**What this means for priorities:**
- Fix P1 (camera icon misalignment) first — auditors literally look at the dots
- Fix P5 (position persistence via API) second — positions must survive reload
- Run the SQL migration (P6) so topology works properly
- CRUD features, satellite map, rack U-position = later, after audit use case is solid

Everything else in Section 4 is post-audit expansion. The system is designed to grow
(the hierarchy model supports it), but the team is not blocked on those features for
the audit use case.

---

## 8. What I Need from This Review

1. **Audit MVP — what to fix first?**
   Given that the immediate goal is auditors checking camera status, rank the fixes in
   Section 3 (P1–P6) by impact on the audit experience. What should be done this week?

2. **System optimization recommendations** — looking at the full stack (React frontend,
   ASP.NET Core backend, SQL Server, Python PingService, Discord webhook), where are the
   weak points that will hurt as the system grows? What should be refactored or hardened
   now before adding more features on top?

3. **Build order for post-audit features** — given CRUD, satellite map, rack U-position,
   and the alert end-to-end hardware test, what order minimizes rework? Which backend
   endpoints must exist before frontend can start each feature?

4. **API contract template** — suggest a short standard format both teams use before
   starting any new feature, so fields are never missing from API responses and the
   "frontend waits on backend" problem stops recurring.

5. **Alert architecture** — the PingService exists but has never been tested end-to-end
   with real hardware. What should the test sequence look like? What are the failure modes
   to watch for (network timeout vs camera truly down vs switch port down)?

6. **Rack U-position design** — is the current data model (u_position field on devices)
   enough to support a U-slot rack diagram UI, or does the schema need changes before
   frontend builds it?

---

*Compiled by Claude Sonnet 4.6 from all project files | 2026-05-31*
