# SSM Frontend — Session Log
**Date:** 2026-05-29  
**Branch:** `frontend`  
**Participants:** Frontend team (builder), Reviewer (Claude Sonnet 4.6), Backend team  

---

## Session Overview

Full review-and-fix session on presentation day. Started with a formal code review, received a No-Go verdict with 6 critical blockers, negotiated with backend team to confirm open questions, then implemented all fixes across 3 phases. All 6 blockers resolved before presentation.

---

## State at Start of Session

- All pages wired to real API with mock fallbacks (from previous session)
- No role enforcement beyond sidebar navigation hints
- 5 hardcoded fallback arrays showing fake data on API failure
- Drag save silently swallowed errors
- Site filter dropdown never worked against real API data
- No 403 handling in Axios

---

## Review Findings

> Full report: `FINDINGS (1).md`  
> Fix plan: `FIX_PLAN.md`

**Verdict:** No-Go — 6 critical blockers, 4 needs-improvement, 3 acceptable.

### 6 Critical Blockers

| # | Finding | Impact |
|---|---|---|
| 1 | No page-level route guards — any authenticated user could reach any page by typing the URL | Security |
| 2 | FloorPlan edit mode has no role check — all roles could drag camera pins | Security |
| 3 | Drag save failure was silent — `patchCameraPosition().catch(() => {})` swallowed errors, pin snapped back on next load with no explanation | Data loss |
| 4 | Fallback data rendered on API failure — `isError` never consumed, hardcoded mocks stayed on screen indefinitely | Data integrity |
| 5 | Site filter never worked against real data — `mapCamera` stored raw `Site_ID` (`"S01"`) but dropdown compared against Thai display names | Broken feature |
| 6 | Floor plan images served as unauthenticated static files from `/public` | Security (documented as accepted) |

### Open Questions — Answered by Backend

| Question | Answer |
|---|---|
| Is `PATCH /api/cameras/{id}/position` protected? | ✅ `[RequireRole("admin")]` at `camerasController.cs:271` |
| Are GET endpoints role-gated? | ✅ Cameras/NVRs/Switches/Users = admin only. Racks/Rooms = admin+user. |
| Is `res.role` from DB or request body? | ✅ From DB — `authController.cs:85`. Cannot be injected. |

Backend also confirmed: `position_x` and `position_y` added to `SELECT` for `GET /api/cameras`. PATCH validates 0–100 range.

---

## Fixes Implemented

### Phase 1 — Role Guards (commit `ee47c54`)

**`src/components/RouteGuard.tsx`** — new file  
HOC that reads role from Zustand. Redirects to `/403` if role not in `allowed` list.

```tsx
export function RouteGuard({ allowed, children }: Props) {
  const role = useAuthStore(s => s.user?.role)
  if (!role || !allowed.includes(role)) return <Navigate to="/403" replace />
  return <>{children}</>
}
```

**`src/pages/DashboardPage.tsx`** — applied RouteGuard to all restricted routes:

| Route | Allowed |
|---|---|
| cameras, nvrs, switches, users | `['admin']` |
| racks, racks/:rackId | `['admin', 'user']` |
| sites (CRUD) | `['admin']` |

**`src/pages/NotAuthorizedPage.tsx`** — new file  
403 page: shows current role, explains access denied, links back to `/dashboard`.

**`src/pages/FloorPlanPage.tsx`** — role guard on edit mode  
`isAdmin` from Zustand → mode toggle hidden for non-admin, `useEffect` forces `view` mode on mount if non-admin.

---

### Phase 2 — Data Integrity (commits `b3d83f7`, `1c648a9`)

**F2-1 — Drag save revert** (`src/pages/FloorPlanPage.tsx`)  
Extended `dragging` ref to store `origLeftPct` and `origTopPct` at drag start. On PATCH failure: revert positions state to stored originals + `message.error(...)`.

Key detail: `origLeftPct`/`origTopPct` captured into the ref *before* `dragging.current = null` — the old code had `dragging.current` set to null before the `.catch()` fired, making the original position inaccessible at catch site.

**F2-2 — Remove fallback data** (CamerasPage, NVRsPage, SwitchesPage, RacksListPage)  
- Deleted all `FALLBACK_*` arrays
- `useState<T[]>(FALLBACK)` → `useState<T[]>([])`
- `const { data }` → `const { data, isPending, isError }`
- `if (data?.length)` → `if (data !== undefined)` in useEffect
- Added loading / error / empty states in table bodies and canvas area

**F2-3 — Fix site filter** (same 4 pages)  
Replaced static `SITES` constant with dynamic dropdown built from loaded data:
```tsx
const filterSites = useMemo(() => [...new Set(items.map(x => x.site))].sort(), [items])
```
Filter dropdown now compares against values that actually exist in the data.

---

### Phase 3 — Security & UX (commit `429b16b`)

**F3-1 — 403 handling** (`src/api/client.ts`)  
Axios response interceptor now sets `error.isForbidden = true` on 403 responses. Data pages check `(error as any)?.isForbidden` to show `'ไม่มีสิทธิ์เข้าถึงข้อมูลนี้'` instead of the generic retry prompt.

**F3-2 — Floor plan images** (`src/pages/FloorPlanPage.tsx`)  
Accepted Option A (open access) for intranet deployment. Added comment at `FloorPlanBackground` documenting the decision and the migration path to auth-gated blob fetch if the system ever becomes internet-facing.

---

### Finding #7 — JWT Expiry Warning (commit `a8c6948`)

**`src/components/SessionWatcher.tsx`** — new file  
Mounted inside `<AntApp>` in `App.tsx`. On token change:
1. Decodes `exp` claim from JWT via `atob(payload)`
2. Calculates `msUntilWarn = exp * 1000 - Date.now() - 5min`
3. Sets `setTimeout` to fire antd `notification.warning` at T-5min
4. Timer cleared and notification dismissed on logout or token change

Mock tokens (`demo-token`, `guest-token`) are not valid JWTs — `decodeExp` returns null and the watcher is a no-op. Only fires with a real backend JWT.

---

## Commits This Session

| Commit | Description |
|---|---|
| `b3d83f7` | fix(FloorPlanPage): revert pin position and show error toast on PATCH failure |
| `ee47c54` | feat(auth): add RouteGuard and enforce role-based page access |
| `1c648a9` | fix(F2-2,F2-3): remove fallback data and fix dynamic site filter on list pages |
| `429b16b` | fix(F3-1,F3-2): handle 403 in Axios interceptor, document floor plan open-access decision |
| `a8c6948` | feat(F7): JWT expiry warning 5 minutes before session expires |

---

## Files Created or Modified

| File | Change |
|---|---|
| `src/components/RouteGuard.tsx` | **Created** — role-based route guard HOC |
| `src/components/SessionWatcher.tsx` | **Created** — JWT expiry timer, antd warning at T-5min |
| `src/pages/NotAuthorizedPage.tsx` | **Created** — 403 page with role display and back link |
| `src/pages/DashboardPage.tsx` | Modified — RouteGuard applied to all restricted routes |
| `src/pages/FloorPlanPage.tsx` | Modified — role guard on edit mode, drag revert on failure, open-access comment |
| `src/pages/CamerasPage.tsx` | Modified — fallback removed, dynamic filter, isPending/isError, 403 message |
| `src/pages/NVRsPage.tsx` | Modified — same as CamerasPage |
| `src/pages/SwitchesPage.tsx` | Modified — same as CamerasPage |
| `src/pages/RacksListPage.tsx` | Modified — same as CamerasPage (canvas area, not table) |
| `src/api/client.ts` | Modified — 403 sets `error.isForbidden = true` |
| `src/App.tsx` | Modified — `<SessionWatcher />` added inside `<AntApp>` |

---

## Remaining / Out of Scope

| Item | Decision |
|---|---|
| F3-2 floor plan images behind auth endpoint | Deferred — open access accepted for intranet. Migration path documented in code. |
| OverviewPage MOCK_STATS / MOCK_ALERTS | Out of scope — dashboard summary page, not a CRUD data page. Fallbacks are cosmetic placeholders, not masked device data. |
| localStorage role tamper | Accepted — backend role-gates all endpoints. A tampered localStorage role is blocked server-side. |
| No test suite | Accepted for timeline. Recommend Vitest + React Testing Library for RouteGuard and mapCamera unit tests in next sprint. |
| Mid-session JWT expiry state loss | Finding #7 addressed the warning. The hard redirect on 401 (losing unsaved form state) is accepted for this release. |

---

## Notes for Future Sessions

- `RouteGuard` uses `as const` arrays for `allowed` — prop type is `readonly Role[]`, not `Role[]`
- `FloorPlanPage` drag positions are stored as percentage strings (`"23.5%"`) in `positionsRef` and state — keep consistent when reading/writing
- `mapCamera` now stores `Site_ID` raw in `site` field (e.g. `"S01"`) — filter dropdown is built dynamically from this, so it always matches. Do not add a `SITE_NAMES` map unless you also update the filter comparison
- `SessionWatcher` is a no-op with mock tokens — test JWT warning only with a real backend login
- All CRUD pages use optimistic update pattern: update local state first, fire API, revert + show toast on failure

---

*SSM Frontend — Session Log | 2026-05-29 | Branch: frontend*
