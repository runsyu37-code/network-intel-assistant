# Backend Ready Notes — Frontend Integration Checklist

> Read this before writing any React Query hook or Axios call.
> The backend API is **not yet ready**. See Section 3 for the blocker list.

---

## 1. Images — Never Use a Path Directly as `src`

The backend stores images as binary blobs, not file paths.
Every model that has image data uses two fields:

```
image_data  : string   // base64-encoded binary content
image_type  : string   // MIME type, e.g. "image/jpeg", "image/png"
```

Models confirmed: `floorsModel`, `buildingsModel`, `racksModel`.

**Do not** construct an image URL from any field:
```tsx
// WRONG — never do this
<img src={`${BASE_URL}/uploads/${floor.image_data}`} />
<img src={floor.imagePath} />
```

**Do** request the image through the authenticated endpoint once it ships:
```tsx
// CORRECT — call the image endpoint; attach token via Axios interceptor
const imgSrc = `${BASE_URL}/api/floors/${floorId}/image`
// Never embed the token in the URL — header only
```

For the Floor Plan page: the current code auto-detects images from
`public/floorplans/<floorId>.<ext>` (dev fallback only). Replace with the
API endpoint call when the backend fix ships.

---

## 2. Device Type Canonical String — `poe_switch`

The canonical string for a PoE switch is **`poe_switch`** (lowercase, underscore).

```tsx
// WRONG
device.switch_type === 'PoE Switch'
device.switch_type === 'poe switch'
device.switch_type === 'POE_SWITCH'

// CORRECT
device.switch_type === 'poe_switch'
```

Applies to: `poeSwitchesModel.switch_type` and any shared device-type
discriminator used in search, filter, and grouping logic.

Also: `usersModel` contains a `pw_hash` field. **Never read, display, or
forward this field.** The backend must scrub it before the response leaves
the server — but add a defensive guard on the frontend anyway:

```tsx
const { pw_hash, ...safeUser } = rawUser  // drop it even if it arrives
```

---

## 3. Backend Not Ready — 5 Fixes Must Ship First

Do not wire up React Query hooks against `localhost:44342` until all five are done.

| # | Fix | Why frontend is blocked |
|---|-----|------------------------|
| 1 | **SQL Transactions** — bulk inserts wrapped atomically | Partial saves cause ghost devices in the UI |
| 2 | **Secure Image Serving** — `/uploads/` blocked, images via auth endpoint | Section 1 endpoint must exist before FloorPlan / Building pages load real images |
| 3 | **Identity & RBAC** — BCrypt server-side, `pw_hash` scrubbed, admin-only POST/DELETE | `UsersPage` must not receive `pw_hash`; write operations need role guard |
| 4 | **Canonical Strings** — `DeviceTypes` class enforced across all controllers | Section 2 — `poe_switch` must be consistent or filters silently break |
| 5 | **JWT Secret** — moved to `appsettings.json`, rotated | Token the frontend stores must not be signed with a placeholder secret |

**When all 5 are confirmed done:** replace mock arrays with `useQuery` hooks
starting with read-only GET endpoints (cameras, sites) before enabling writes.
