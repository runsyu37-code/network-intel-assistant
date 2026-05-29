# Frontend Review Session — 2026-05-29

> **Prepared for:** Backend Team
> **Date:** 2026-05-29
> **Participants:** Frontend Builder (Claude Sonnet 4.6) · Reviewer (Claude Sonnet 4.6) · Owner (Ran)
> **Full findings:** `C:\ai-playground\Frontend\review\FINDINGS.md`

---

## Purpose

This document captures the key technical exchanges from the live review session so the backend team has full context on what was found, how, and what questions are still open for them.

---

## Session Scope

The reviewer examined three areas from code — not from the brief:

1. **Auth flow** — token storage, role extraction, JWT decode, expiry handling
2. **CamerasPage** — data loading, filtering, error states, fallback behavior
3. **FloorPlanPage** — image loading, camera pins, drag-save, role guards

---

## Key Exchanges

### Auth Flow

**Reviewer asked:** Full mechanical sequence from first visit to post-login state.

**What was confirmed from code:**

- `App.tsx` has one guard: unauthenticated users (no token) → redirect to `/login`. No role check at the route level.
- `LoginPage` calls `POST /api/auth/login`. On success, `extractJwtUser(res.token)` decodes the JWT **client-side** via `atob()`. No `/me` call.
- Role source: `res.role` from the response body is the primary value used. JWT decode is used only for `id` and `username`.
- Both token and user object (including role) are written to `localStorage` and Zustand simultaneously.
- Post-login: `navigate('/dashboard')` — unconditional for every role. No role-to-route mapping.
- Expiry: Axios interceptor catches 401 → `localStorage.removeItem('token')` → `window.location.href = '/login'`. Hard redirect, no warning, any unsaved state is lost.

**Backend team question raised:** Is `res.role` set server-side from the DB, or derived from the JWT claims? If the backend echoes a role from the request body, that is a separate and more serious problem. **This is Open Question #3 in FINDINGS.md.**

---

### CamerasPage

**Reviewer asked:** Mount sequence, loading states, filter behavior, empty/500 handling.

**What was confirmed from code:**

- `useState` initializes with `FALLBACK_CAMERAS` (5 hardcoded cameras) before first render.
- `useQuery` fires `GET /api/cameras` (no params) simultaneously. Only `{ data }` is destructured — `isPending`, `isError` are never read.
- `useEffect` condition: `if (data?.length)` — falsy for both `undefined` (API error) and `[]` (empty response). Fallback stays on screen in both cases. Silent failure.
- **Site filter is broken against real data.** `mapCamera` passes raw `Site_ID` (e.g. `"S01"`). Filter dropdown uses hardcoded Thai names (`'สำนักงานใหญ่'`). These never match. Filter has never worked with live data.
- On 500: React Query swallows the error, retries 3 times, user sees mock cameras throughout with no indication of failure.

---

### FloorPlanPage

**Reviewer asked:** Mount sequence, image fallback, pin positions, drag-save, role guard.

**What was confirmed from code:**

- Floor plan images are served from Vite's `/public/floorplans/` directory as static files. **No auth header. No API call.** Any unauthenticated user who knows the URL pattern (`/floorplans/{floorId}.jpg`) can access building layout images.
- The brief stated these were fetched via `axios.get(..., { responseType: 'blob' })` with an `Authorization` header. **This is not implemented.** The brief was wrong.
- Camera pin positions: `GET /api/cameras?Floor_ID={floorId}` returns `position_x` and `position_y`. `mapApiCamera` reads them as percentage values (0–100). Null positions fall back to a 4-column grid. **Read path works correctly.**
- **Drag save is fire-and-forget.** `patchCameraPosition()` is called with `.catch(() => {})`. On failure: pin stays in new position visually, user sees no error, navigates away, returns, `useEffect` fires with fresh API data, pin snaps back to old position. Silent data loss with deferred symptom.
- **No role guard exists on this page.** `useAuthStore` is never imported. Every authenticated user — including `viewer_test` — sees the Edit button and can enter drag mode.

---

### Role Guards

**Reviewer asked:** What does a user/viewer see at `/dashboard/racks` vs `/dashboard/cameras`? Exact mechanism.

**What was confirmed from code:**

- `DashboardPage.tsx` registers all routes unconditionally. No `RouteGuard`, no HOC, no role check.
- `AppLayout.tsx` has no role check.
- `Sidebar.tsx` has one role check: `{user?.role === 'admin' && ...}` hides the Admin nav section (Users link only) for non-admin. That is the **only** role enforcement in the entire frontend.
- Every other nav item (Cameras, NVRs, Switches, Racks, Sites, Topology) is visible to all roles.
- Direct URL navigation bypasses the sidebar entirely. Any authenticated user can reach any route.
- `UsersPage` imports `useAuthStore` and reads `isAdmin` — but that value is never used in any conditional. No guard exists even on the most sensitive page.

**The Role Access Matrix in REVIEW_BRIEF.md describes intended behavior. It is not implemented.**

---

## Open Questions — Answered by Backend Team (2026-05-29)

| # | Question | Answer |
|---|---|---|
| 1 | Is `PATCH /api/cameras/{id}/position` protected by `JwtAuthFilter`? | ✅ Yes — `[RequireRole("admin")]` at `camerasController.cs:271`. Viewer is blocked at the backend. |
| 2 | Are `GET /api/cameras`, `/nvrs`, `/switches`, `/users` role-gated? | ✅ Yes — all admin-only. `/racks` and `/rooms` are admin+user. Matches ROLE_MATRIX exactly. |
| 3 | Is `res.role` from DB or echoed from request body? | ✅ From DB — `authController.cs:85` reads from `users` table. `LoginRequest` has no role field. |

**Conclusion from backend team:** Role enforcement is complete on the backend. JWT claims are generated from DB values, not client input. Frontend fixes are self-contained.

---

## Additional Flag from Backend Team

Backend flagged that the `SELECT` statement for `GET /api/cameras` may **not** return `position_x` / `position_y`. If confirmed, `mapApiCamera` always receives `null` for both fields — camera pins always fall back to grid layout, and drag-save PATCH writes data that is never read back.

**Frontend action:** Fire a real `GET /api/cameras` and inspect the response JSON before implementing the drag-save fix. If the fields are absent, this is a backend SELECT bug that must be fixed first.

---

## Verdict

**No-Go.** Full findings and fix code in `C:\ai-playground\Frontend\review\FINDINGS.md`.

---

*Frontend Review Session — 2026-05-29 | Claude Sonnet 4.6*
