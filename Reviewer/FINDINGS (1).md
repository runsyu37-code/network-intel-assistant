# SSM Network Monitor — Frontend Review Session

> **Verdict:** No-Go ❌
> **Date:** 2026-05-29
> **Reviewer:** Claude Sonnet 4.6
> **Prepared for:** Owner / Frontend Team / Backend Team

---

## Verdict

**No-Go. 6 critical blockers, all confirmed from code — not inferred.**

The single most important thing to understand: the Role Access Matrix in the brief describes what the system *should* do. It does not describe what it *does*. There is no frontend role enforcement beyond a sidebar navigation hint. Every page is reachable by every authenticated user by typing the URL directly. Fix that first — everything else follows.

---

## Findings Summary

| Severity | Count |
|---|---|
| 🔴 Critical — blockers | 6 |
| 🟡 Needs Improvement | 4 |
| 🟢 Acceptable | 3 |

---

## Recommended Fix Sequence

1. **[First]** Add a route guard HOC or wrapper component that reads role from Zustand and redirects to a 403 page. Apply it to every restricted route in `DashboardPage`. That one change closes the most critical finding and unblocks everything else.
2. **[First]** Add role check to `FloorPlanPage` — import `useAuthStore`, hide the Edit button for non-admin.
3. **[Second]** Fix drag save `.catch(() => {})` — replace with a toast and position state revert on failure.
4. **[Second]** Add `isError` and `isPending` handling to all data pages — show error state and loading skeleton instead of fallback data.
5. **[Second]** Fix site filter — normalize `Site_ID` to display name in `mapCamera`, or build the dropdown from API data.
6. **[Third]** Handle 403 in the Axios interceptor — show an "Access Denied" state instead of silent fallback data.
7. **[Third]** Move floor plan images behind an auth-gated API endpoint, or formally accept the open-access risk given intranet deployment.

---

## 🔴 Critical — Blockers

### 1. No page-level route guards anywhere in the application

`useAuthStore` is not imported in any page component except `UsersPage`, where `isAdmin` is read but never acted on — no conditional return, no redirect, the value is unused. The only role enforcement in the entire frontend is the sidebar hiding the Admin nav section for non-admin users. That is a navigation hint, not a guard.

**Consequence:** Any authenticated user — including `viewer_test` — can navigate directly to `/dashboard/cameras`, `/dashboard/users`, or any restricted page by typing the URL. The page renders, the API call fires with the user's JWT, and either real data loads or fallback data shows. There is no blocked state, no redirect, no 403 page.

**The Role Access Matrix in the brief is aspirational. It is not implemented in the frontend.**

**Fix:**
```tsx
// RouteGuard.tsx
import { Navigate } from 'react-router-dom'
import { useAuthStore } from '../store/authStore'

type Props = { allowed: string[]; children: React.ReactNode }

export function RouteGuard({ allowed, children }: Props) {
  const role = useAuthStore(s => s.user?.role)
  if (!role || !allowed.includes(role)) return <Navigate to="/403" replace />
  return <>{children}</>
}

// DashboardPage.tsx — wrap restricted routes
<Route path="cameras" element={
  <RouteGuard allowed={['admin']}>
    <CamerasPage />
  </RouteGuard>
} />
```

---

### 2. Floor plan edit mode has no role guard — "admin only drag" not implemented

`useAuthStore` is never imported in `FloorPlanPage.tsx`. The Edit/View mode toggle renders unconditionally for every authenticated user. Every role can click Edit, enter drag mode, and fire `PATCH /api/cameras/{id}/position`. The brief explicitly states this is admin-only. It is not implemented.

**Fix:**
```tsx
import { useAuthStore } from '../store/authStore'
const isAdmin = useAuthStore(s => s.user?.role === 'admin')

// Guard the mode toggle render:
{isAdmin && ['view', 'edit'].map(m => (
  <button key={m} onClick={() => setMode(m as Mode)}>...</button>
))}
```

---

### 3. Drag save failure is silent — deferred data loss

`patchCameraPosition()` is called with `.catch(() => {})`. The error is completely swallowed.

**Sequence:**
1. User drags pin → pin moves visually in local state
2. PATCH fires → PATCH fails (network error, 403, 500)
3. `.catch(() => {})` swallows the error
4. Pin stays in new position — no toast, no alert, no visual change
5. User navigates away and returns
6. `useEffect` fires with fresh API data → pin snaps back to old position
7. User has no explanation

Silent data loss with a deferred symptom. The user won't notice until they come back.

**Fix:**
```tsx
const origPos = positionsRef.current[id]  // capture before clearing
dragging.current = null
patchCameraPosition(camId, parseFloat(pos.left), parseFloat(pos.top))
  .catch(() => {
    if (origPos) setPositions(prev => ({ ...prev, [id]: origPos }))
    message.error('Failed to save camera position. Please try again.')
  })
```

> `originalPosition` is not in scope at the catch site — `dragging.current` (which held the pre-drag position) is set to `null` on line 289 before the catch fires. The position must be captured into a local variable before `dragging.current` is cleared.

---

### 4. Mock/fallback data renders on API failure and empty responses

Both `CamerasPage` and `FloorPlanPage` initialize state with hardcoded fallback data (`FALLBACK_CAMERAS`). The React Query `isError` flag is never destructured or consumed. The `useEffect` condition `if (data?.length)` is falsy for both a failed request (`data` is `undefined`) and an empty response (`data` is `[]`). In both cases, `FALLBACK_CAMERAS` stays on screen indefinitely.

**Consequence:** An admin cannot tell whether they are looking at real data, placeholder data, or a broken API. On a 500 error, React Query retries 3 times with no visible change — the fallback stays on screen throughout. This is a systemic pattern confirmed across two pages.

**Fix:**
```tsx
const { data, isPending, isError } = useQuery({
  queryKey: ['cameras'],
  queryFn: getCameras
})

if (isPending) return <Skeleton />
if (isError)   return <Alert type="error" message="Failed to load cameras" />

const cameras = data?.map(mapCamera) ?? []
// Remove FALLBACK_CAMERAS entirely
```

---

### 5. Site filter has never worked against real API data

`mapCamera` passes `Site_ID` raw (e.g. `"S01"`) into `c.site`. The `SITES` array is hardcoded Thai display names (`'สำนักงานใหญ่'`, `'สาขาสีลม'`, etc.) and populates the filter dropdown. The filter compares `c.site !== siteFilter` — these two value sets can never match. Selecting any site on real data always returns zero results. This filter has never worked with live data.

**Fix — normalize in `mapCamera`:**
```tsx
const SITE_NAMES: Record<string, string> = {
  'S01': 'สำนักงานใหญ่',
  'S02': 'สาขาสีลม',
  // ...
}
// In mapCamera:
site: SITE_NAMES[a.Site_ID] ?? a.Site_ID,
```

Or build the dropdown dynamically from `GET /api/sites` and filter against `Site_ID` directly.

---

### 6. Floor plan images served as unauthenticated public static files

Floor plan images are served from Vite's `/public` directory via plain `<img src="/floorplans/{floorId}.jpg">` — no Axios call, no auth header. Any user who knows or guesses the URL pattern can access building layout images without authenticating. The brief implied these were auth-gated API responses. They are not.

For an intranet deployment this may be an acceptable risk — but it must be a documented decision, not an oversight.

---

## 🟡 Needs Improvement

### 7. Mid-session JWT expiry causes hard redirect with no warning

The Axios response interceptor catches 401s with `window.location.href = '/login'` — a full page navigation. Any unsaved state (form input, in-progress camera drag) is lost with no warning. There is no "session expiring soon" notification. Accepted as a timeline decision, but the floor plan drag scenario makes this materially worse — a drag in progress at hour 8 results in a redirect mid-action, losing the save silently.

### 8. No loading states on data pages — fallback renders immediately

Neither `CamerasPage` nor `FloorPlanPage` consume `isPending` or `isLoading` from React Query. Both show hardcoded data the moment the component mounts. This is a systemic pattern likely present on other data pages not reviewed in this session. Fix is part of item #4 above.

### 9. Role in localStorage is tamper-accessible

Role is stored in `localStorage` as part of the user object and rehydrated into Zustand on load. A user who edits `localStorage.user.role` to `"admin"` will see the admin sidebar and (after item #1 is fixed) will be blocked by route guards. Before item #1 is fixed, they can navigate anywhere freely. The real guard is the backend JWT — but read endpoints need to be confirmed as protected (see open questions below).

### 10. 403 responses are unhandled

The Axios interceptor catches 401 and redirects to login. A 403 from the backend falls through as an unhandled rejection. Since `isError` is not consumed on data pages, the user sees fallback data with no indication that access was denied. A viewer hitting a backend-protected endpoint sees 5 mock cameras — not an error.

---

## 🟢 Acceptable

### Floor plan SVG fallback — works correctly
The extension-walking fallback (jpg → jpeg → png → svg → webp) handles 404 correctly via `onError`. When no image exists for a floor, the inline SVG renders. Behaves as intended.

### Camera position read path — works correctly
`GET /api/cameras` returns `position_x` and `position_y`. `mapApiCamera` reads them and renders pins at saved positions as percentage strings. Null positions fall back to a 4-column grid layout. The read path is correct — reliability depends on the PATCH save path, which has the silent failure issue in item #3.

### Auth flow mechanics — correct
Token storage, JWT decode, Zustand hydration, and post-login redirect are all mechanically sound. The flow from login to dashboard works as described. The localStorage role tamper issue is logged separately as item #9.

---

## Acknowledged Scope — Intentional, Not Bugs

| Item | Decision |
|---|---|
| Desktop only | Intentional intranet constraint — not reviewed for mobile |
| Polling (30s), not realtime | Intentional scope decision |
| No Swagger / API docs in UI | Contract in `FRONTEND_HANDOFF.md` |
| JWT only, no refresh token | 8-hour expiry with hard redirect — accepted for timeline |
| No floor plan editor | Admin drags pins only, SVG uploaded separately |

> Note on the last item: the scope decision (no editor) is accepted. The missing role guard on the drag action is a blocker — the brief explicitly promises admin-only drag and it was never implemented.

---

## Open Questions for Backend Team

These must be answered before the frontend fixes alone can be considered complete.

1. Is `PATCH /api/cameras/{id}/position` protected by `JwtAuthFilter`? If not, a viewer can permanently relocate cameras even after the frontend guard is added (they can bypass it via direct API call or localStorage tamper).
2. Are `GET /api/cameras`, `GET /api/nvrs`, `GET /api/switches`, and `GET /api/users` role-gated on the backend? If not, a user who edits their localStorage role to `"admin"` will receive real data even after frontend guards are in place.
3. Is the role value in `res.role` (login response body) set server-side from the database, or is it derived from the JWT claims? If the backend echoes back a role from the request body, that is a separate and more serious problem.

---

*SSM Network Monitor — Frontend Review | 2026-05-29 | Reviewer: Claude Sonnet 4.6*
