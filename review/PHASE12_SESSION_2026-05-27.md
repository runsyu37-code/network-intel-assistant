# Phase 12 Session Log — 2026-05-27

**Branch:** `backend`  
**Engineer:** Ran (Reviewer) + Claude (Builder)

---

## What Was Done

### 1. RequireRoleAttribute — Replace All Inline IsInRole

**New file:** `Filters/RequireRoleAttribute.cs`

`AuthorizationFilterAttribute` that accepts variadic role list. Runs after `JwtAuthFilter` (global) has validated the token and set `RequestContext.Principal`. Returns 403 Forbidden if the caller's role is not in the allowed list.

```csharp
[RequireRole("admin")]                  // admin only
[RequireRole("admin", "user")]           // admin or user
[RequireRole("admin", "user", "viewer")] // any authenticated role
```

**All 16 controllers migrated** — every inline `IsInRole` check replaced with attribute:

| Controller | Methods Changed |
|---|---|
| alertLogsController | Get, Save, Update, Delete |
| auditLogsController | Get, Save, Update, Delete |
| buildingsController | Save, Update, Delete |
| camerasController | Get, Save, Update, Delete, PatchPosition |
| dashboardController | GetSummary |
| devicesController | GetDevices (multi-line sig — handled separately) |
| floorPlansController | UploadFloorPlan (async), DeleteFloorPlan |
| floorsController | Save, Update, Delete |
| nvrsController | Get, Save, Update, Delete |
| pingLogsController | Get, Save, Update, Delete |
| poeSwitchesController | Get, Save, Update, Delete |
| racksController | Get (admin+user), Save, Update, Delete |
| roomsController | Get (admin+user), Save, Update, Delete |
| sitesController | Save, Update, Delete |
| syncLogsController | Get, Save, Update, Delete |
| usersController | Get, Save, Update, Delete |

**Bonus fix:** Pre-existing Phase 10 indentation bugs in log controller Save/Update/Delete methods were corrected at the same time (24-space → 12-space indent on inline checks; 0-space → 12-space on first validation line after check).

Only remaining `IsInRole` usage: `authController.cs` `Me()` endpoint — this reads the role to return it, it is NOT an authorization gate. Left as-is.

---

### 2. Per-Username Lockout

**authController:** lockout key changed from IP address → username.

| Before | After |
|---|---|
| `_attempts[ip]` | `_attempts[key]` where `key = req.username.Trim()` |
| `StringComparer.Ordinal` | `StringComparer.OrdinalIgnoreCase` |

**Why:** Shared-NAT attack — an attacker on the same NAT as a victim could exhaust the IP counter and lock the victim out. Per-username means only requests for a specific username count toward that username's lockout. IP is still recorded in the audit log for forensics.

---

### 3. Stale Record Eviction in Rate Limiter

`EvictStaleEntries()` added to authController — removes entries from `_attempts` where both:
- Lock has expired (or no lock)
- Window has expired (`WindowStart` > 5 minutes ago)

Called every 200 requests (lazy eviction via `Interlocked.Increment`). No background thread needed. Prevents unbounded dictionary growth over the app's lifetime.

---

### 4. Windows Event Log on Audit Write Failure

`LogLockout` catch block now:
1. Catches `Exception ex` (was bare `catch {}`)
2. Tries to write to Windows Application Event Log (source: `"Application"`, EventId: `1001`, type: Warning)
3. Outer try-catch around EventLog call handles the case where Event Log is also unavailable

Lockout events are never silently lost. At worst they appear in the Windows Event Viewer if the DB is down.

---

### 5. Role Optional on Update (usersController)

`PUT /api/users/{User_ID}` — role field is now optional:

```sql
role = CASE WHEN @role IS NULL THEN role ELSE @role END,
```

- Omit `role` in the request body → existing role preserved
- Provide `role` → validated against `{ "admin", "user", "viewer" }` and updated
- Invalid role value still rejected with `400 Bad Request`

Previously: `role` was **required** on every update, even when only changing password or display_name.

---

## Phase 12 Backlog — All Items Closed

| # | Fix | Status |
|---|---|---|
| 1 | RequireRoleAttribute | ✅ Done |
| 2 | Per-username lockout | ✅ Done |
| 3 | CASE WHEN for role on Update | ✅ Done |
| 4 | Windows Event Log on audit failure | ✅ Done |
| 5 | Stale record eviction | ✅ Done |

Phase 12 backlog is fully cleared.

---

## Files Changed

```
Filters/RequireRoleAttribute.cs                 (new)
Controllers/alertLogsController.cs
Controllers/auditLogsController.cs
Controllers/authController.cs
Controllers/buildingsController.cs
Controllers/camerasController.cs
Controllers/dashboardController.cs
Controllers/devicesController.cs
Controllers/floorPlansController.cs
Controllers/floorsController.cs
Controllers/hierarchyController.cs
Controllers/nvrsController.cs
Controllers/pingLogsController.cs
Controllers/poeSwitchesController.cs
Controllers/racksController.cs
Controllers/roomsController.cs
Controllers/sitesController.cs
Controllers/syncLogsController.cs
Controllers/usersController.cs
```

---

*Generated 2026-05-27. Backend: Ran. Builder: Claude Sonnet 4.6.*
