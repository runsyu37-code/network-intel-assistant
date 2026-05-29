# SSM Frontend — Fix Plan

> **Based on:** FINDINGS.md (Review 2026-05-29)
> **Status:** Pending
> **Owner:** Frontend Team

---

## Phase 1 — Critical Role Guards (Do First)

These two fixes must land together. Neither is complete without the other.

### F1-1: Add `RouteGuard` component and apply to all restricted routes

**File to create:** `src/components/RouteGuard.tsx`

```tsx
import { Navigate } from 'react-router-dom'
import { useAuthStore } from '../stores/authStore'

type Props = { allowed: ('admin' | 'user' | 'viewer')[]; children: React.ReactNode }

export function RouteGuard({ allowed, children }: Props) {
  const role = useAuthStore(s => s.user?.role)
  if (!role || !allowed.includes(role)) return <Navigate to="/403" replace />
  return <>{children}</>
}
```

**File to edit:** `src/pages/DashboardPage.tsx`

Apply `RouteGuard` per the Role Access Matrix:

| Route | Allowed roles |
|---|---|
| `cameras`, `cameras/:cameraId` | `admin` |
| `nvrs`, `nvrs/:nvrId` | `admin` |
| `switches`, `switches/:switchId` | `admin` |
| `users` | `admin` |
| `racks`, `racks/:rackId` | `admin`, `user` |
| `sites` (CRUD) | `admin` |
| All others | `admin`, `user`, `viewer` |

**File to create:** `src/pages/NotAuthorizedPage.tsx`

Simple 403 page — show role, explain access is denied, offer link back to `/dashboard`.

---

### F1-2: Add role guard to `FloorPlanPage` edit mode

**File to edit:** `src/pages/FloorPlanPage.tsx`

```tsx
// Add import at top
import { useAuthStore } from '../stores/authStore'

// Inside component
const isAdmin = useAuthStore(s => s.user?.role === 'admin')

// Guard the mode toggle — only render for admin
{isAdmin && (
  <div style={{ display: 'flex', background: '...', ... }}>
    {(['view', 'edit'] as const).map(m => (
      <button key={m} onClick={() => setMode(m)} ...>
        ...
      </button>
    ))}
  </div>
)}

// Non-admin: force view mode on mount
useEffect(() => {
  if (!isAdmin) setMode('view')
}, [isAdmin])
```

---

## Phase 2 — Data Integrity Fixes

### F2-1: Fix drag save silent failure in `FloorPlanPage`

**File to edit:** `src/pages/FloorPlanPage.tsx`

In `stopDrag()` — capture position before clearing `dragging.current`, revert on failure:

```tsx
function stopDrag() {
  if (dragging.current && wasDragged.current) {
    const { id } = dragging.current
    const pos = positionsRef.current[id]
    const origPos = positionsRef.current[id]  // capture before null
    dragging.current = null                    // clear ref

    if (pos) {
      const camId = parseInt(id)
      if (!isNaN(camId)) {
        patchCameraPosition(camId, parseFloat(pos.left), parseFloat(pos.top))
          .catch(() => {
            if (origPos) setPositions(prev => ({ ...prev, [id]: origPos }))
            message.error('Failed to save camera position. Please try again.')
          })
      }
    }
  } else {
    dragging.current = null
  }
}
```

Note: requires `App.useApp()` to be available — add `const { message } = App.useApp()` if not present.

---

### F2-2: Replace fallback data pattern on `CamerasPage` and `FloorPlanPage`

**Pattern to apply to both pages:**

```tsx
// Replace:
const { data } = useQuery({ ... })
const [cameras, setCameras] = useState<Camera[]>(FALLBACK_CAMERAS)
useEffect(() => { if (data?.length) setCameras(data.map(mapCamera)) }, [data])

// With:
const { data, isPending, isError } = useQuery({ ... })

if (isPending) return <div className="page-loading"><Spin /></div>
if (isError)   return <Alert type="error" message="Failed to load data. Please refresh." />

const cameras = data?.map(mapCamera) ?? []
```

Remove `FALLBACK_CAMERAS` entirely from both files. If real empty state is a valid scenario, show a proper empty state component instead.

Apply the same pattern to **all other data pages** — NVRsPage, SwitchesPage, RacksListPage, RackDetailPage, etc. This is a systemic pattern.

---

### F2-3: Fix site filter in `CamerasPage`

**Option A — hardcoded map (quick fix):**

```tsx
const SITE_NAMES: Record<string, string> = {
  'S01': 'สำนักงานใหญ่',
  'S02': 'สาขาสีลม',
  'S03': 'สาขาลาดพร้าว',
  'S04': 'สาขาบางนา',
  'S05': 'คลังสินค้า',
}

// In mapCamera:
site: SITE_NAMES[a.Site_ID] ?? a.Site_ID,
```

And update `SITES` array to match the mapped display names.

**Option B — dynamic (correct fix):**

Fetch `GET /api/sites` → build the dropdown from real site names → filter against `Site_ID` directly. Requires the sites endpoint to exist.

---

## Phase 3 — Security & UX Polish

### F3-1: Handle 403 in Axios interceptor

**File to edit:** `src/api/client.ts`

```tsx
client.interceptors.response.use(
  (res) => res,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token')
      window.location.href = '/login'
    }
    if (error.response?.status === 403) {
      // Don't redirect — let the page handle it via isError
      // But flag it so pages can show AccessDenied instead of generic error
      error.isForbidden = true
    }
    return Promise.reject(error)
  },
)
```

On data pages, check `error?.isForbidden` to show an "Access Denied" state rather than a generic error.

---

### F3-2: Floor plan images — decide and document

Two options:

**Option A — Accept open access (low effort):**
Add a comment in `FloorPlanBackground` and a note in `FRONTEND_HANDOFF.md` explicitly documenting that floor plans are public static files. Acceptable for intranet deployment if building layouts are not considered sensitive.

**Option B — Move behind auth-gated endpoint (correct fix):**
Move images from `public/floorplans/` to the backend. Frontend fetches via:
```tsx
const res = await client.get(`/floors/${floorId}/floor-plan/image`, { responseType: 'blob' })
const url = URL.createObjectURL(res.data)
```
Requires backend to expose `GET /api/floors/{id}/floor-plan/image` with `JwtAuthFilter`.

---

## Open Questions (Backend must answer before Phase 3 is complete)

| # | Question | Blocks |
|---|---|---|
| 1 | Is `PATCH /api/cameras/{id}/position` protected by `JwtAuthFilter`? | F1-2 completeness |
| 2 | Are read endpoints (`GET /api/cameras`, `/nvrs`, `/switches`, `/users`) role-gated? | F1-1 completeness |
| 3 | Is `res.role` in login response set from DB or echoed from request body? | Auth flow integrity |

---

## Fix Progress Tracker

| Fix | Phase | Status |
|---|---|---|
| F1-1: RouteGuard component + DashboardPage routes | 1 | Pending |
| F1-1: NotAuthorizedPage (403) | 1 | Pending |
| F1-2: FloorPlanPage edit mode role guard | 1 | Pending |
| F2-1: Drag save revert on failure + toast | 2 | Pending |
| F2-2: Remove fallback data — CamerasPage | 2 | Pending |
| F2-2: Remove fallback data — FloorPlanPage | 2 | Pending |
| F2-2: Remove fallback data — other pages | 2 | Pending |
| F2-3: Fix site filter | 2 | Pending |
| F3-1: Handle 403 in Axios interceptor | 3 | Pending |
| F3-2: Floor plan image decision + document | 3 | Pending |

---

*SSM Frontend Fix Plan — Created 2026-05-29 | Based on review findings*
