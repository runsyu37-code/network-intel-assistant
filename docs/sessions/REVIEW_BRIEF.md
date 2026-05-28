# SSM Network Monitor — Review Brief

> **For:** External Reviewer
> **Date:** 2026-05-28
> **Prepared by:** Frontend Team (Ran / Claude Sonnet 4.6)

---

## What Is This System?

**SSM Network Monitor** is an internal web dashboard for monitoring surveillance infrastructure across multiple buildings. It shows which CCTV cameras, NVRs, and PoE switches are online/offline, where they are physically located, and lets admins manage devices and users.

Audience: ~30 intranet users (network engineers, building managers). Not a public-facing product.

---

## Prerequisites to Run

**Backend must be running first:**

1. Open Visual Studio
2. Open: `C:\ai-playground\API\BNO_Survei_MonitorAPI\BNO_Survei_MonitorAPI.slnx`
3. Press `Ctrl+F5` — server starts at `http://localhost:50680`
4. If server fails to start → see `docs/sessions/CROSSMACHINE_FIX_2026-05-28.md`

**Then run the frontend:**

```bash
cd C:\ai-playground\Frontend
npm install      # first time only
npm run dev      # starts at http://localhost:3001
```

Open `http://localhost:3001` in browser.

---

## Test Accounts

| Username | Password | Role | What You Can See |
|---|---|---|---|
| `admin_test` | `Test@1234` | admin | Everything — all pages, all data, edit/delete |
| `user_test` | `Test@1234` | user | Sites, buildings, floors, rooms, racks — no cameras/NVRs/logs |
| `viewer_test` | `Test@1234` | viewer | Sites, buildings, floors only — read-only |

> Sign in with each account to verify that restricted pages block correctly.

---

## Page Tour

Login first as `admin_test`, then navigate via the left sidebar.

| Route | Page | What It Shows |
|---|---|---|
| `/dashboard` | Overview | Live device status summary — online/offline counts per site, alert feed |
| `/dashboard/topology` | Topology | Collapsible Site → Building → Floor tree with per-floor camera counts |
| `/dashboard/sites` | Sites CRUD | Admin: create/edit/delete sites |
| `/dashboard/sites/:siteId` | Site Detail | Building cards for one site — camera + NVR counts per building |
| `/dashboard/buildings/:buildingId` | Building Detail | Floors list + device counts |
| `/dashboard/floors/:floorId` | Floor Plan | SVG floor plan with draggable camera pins (admin only drag) |
| `/dashboard/racks` | Racks List | All racks across sites — filter by site, status summary |
| `/dashboard/racks/:rackId` | Rack Detail | Devices and active alerts inside one rack |
| `/dashboard/cameras` | Cameras | Full camera inventory — filter by site, floor, status |
| `/dashboard/cameras/:cameraId` | Camera Detail | Single camera — info, status, location breadcrumb |
| `/dashboard/nvrs` | NVRs | NVR list — filter by site, rack |
| `/dashboard/nvrs/:nvrId` | NVR Detail | Single NVR — channels, status, rack location |
| `/dashboard/switches` | Switches | PoE switch list — filter by site, rack |
| `/dashboard/switches/:switchId` | Switch Detail | Single switch — port count, power usage |
| `/dashboard/users` | Users | Admin: manage user accounts and roles |

---

## Role Access Matrix

| Page / Action | admin | user | viewer |
|---|---|---|---|
| Overview, Topology | YES | YES | YES |
| Sites (read) | YES | YES | YES |
| Buildings, Floors, Floor Plan (read) | YES | YES | YES |
| Rooms, Racks (read) | YES | YES | NO |
| Cameras, NVRs, Switches (read) | YES | NO | NO |
| Sites CRUD, Users | YES | NO | NO |
| Any edit / delete / drag action | YES | NO | NO |

> Restricted pages should show a 403 / "Access Denied" state, not a broken page.

---

## Scope Decisions (Known Limitations)

These are intentional — not bugs:

- **Desktop only** — not optimized for mobile (intranet use case)
- **Polling, not real-time** — device status refreshes every 30 seconds via API
- **No floor plan editor** — admin can drag camera pins, but floor plan SVG is uploaded separately
- **JWT only, no refresh token** — session expires after 8 hours, user must re-login
- **No Swagger / API docs in UI** — backend API contract is in `docs/FRONTEND_HANDOFF.md`

---

## What to Focus On in the Review

1. **Role guards** — does each role see exactly what it should? Test with all 3 accounts.
2. **Empty / error states** — what happens when API returns empty data or 500?
3. **Floor Plan page** — drag pin saves position, reloads on next visit
4. **Navigation consistency** — breadcrumbs, back buttons, active sidebar item
5. **Loading states** — are there spinners/skeletons while data loads?
6. **Theme** — light and dark mode (toggle in top bar)

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | React 18 + Vite + TypeScript |
| UI Library | Ant Design (antd) — Buono purple theme |
| State | Zustand |
| Routing | React Router DOM v6 |
| HTTP | Axios — proxied to `localhost:50680` via Vite config |
| Auth | JWT stored in localStorage |

---

*Prepared by: Frontend Team — Claude Sonnet 4.6 | 2026-05-28*
