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

### 4. File Log Fallback on Audit Write Failure

`LogLockout` catch block — three-tier fallback (close condition applied after adversarial review):

1. **Primary:** DB `audit_logs` insert (existing behavior)
2. **Fallback 1:** File log at `App_Data/security.log` with 10 MB rotation  
   - No admin privileges needed (IIS has write access to App_Data by default)  
   - Grep-able structured format: `{timestamp} LOCKOUT_AUDIT_FAIL user={u} ip={ip} err={msg}`  
   - Rotates to `.{timestamp}.bak` when over 10 MB, so file never grows unbounded
3. **Fallback 2:** `System.Diagnostics.Trace.TraceError(...)` — always available in IIS, no setup required, appears in IIS trace log

**Why file log over Windows Event Log:** Event Log requires admin/elevated privileges to create a new source — not available in standard IIS App Pool identity. File log works under normal IIS permissions.

Lockout events are never silently lost. At worst they appear in the IIS trace log.

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

## Adversarial Review (Builder vs Reviewer)

**Score: Builder 4 — Reviewer 2 — Draw 2**

| Challenge | Result | Resolution |
|---|---|---|
| Race condition in EvictStaleEntries | Builder wins | `EvictStaleEntries` holds same `_lock` as `HandleFailedAttempt` — no window for concurrent mutation |
| `int` overflow on `_requestCount` | Reviewer wins | Changed `int` → `long` (2^63 requests to overflow vs 2^31) |
| Case C: empty string `role=""` | Builder wins | `string.IsNullOrWhiteSpace("")` = true → DBNull → CASE WHEN preserves existing role |
| Scenario A: `[AllowAnonymous]` + `[RequireRole]` double-decoration | Draw | Safe behavior (403), but semantics are confusing — documented gap, not fixed |
| Event Log vs file log for fallback | Draw | Event Log requires admin privileges in IIS → switched to file log (App_Data/security.log) |
| Zero `IsInRole` in controllers | Builder wins | `Select-String` scan confirmed 0 matches across all Controllers/*.cs |
| Scenario B structural gap | Reviewer wins | `RequireRoleAttribute` does not re-read `AllowAnonymous` — acknowledged, documented, acceptable for v1 intranet |

### Close Conditions Applied

1. **`int` → `long`**: `_requestCount` changed to `long` to prevent overflow at high request volume  
2. **File log fallback**: Windows Event Log replaced with `App_Data/security.log` + `Trace.TraceError` (no admin privileges required)  
3. **Scenario A/B gap documented**: `[AllowAnonymous]` + `[RequireRole]` interaction added to code comments in `RequireRoleAttribute.cs`

---

## Bruno Tests Added

| File | What It Tests |
|---|---|
| `RBAC18_lockout_per_username_429.yml` | Per-username lockout → 429 after 10 fails; other usernames unaffected |
| `RBAC19_user_update_role_optional_200.yml` | PUT without `role` field → 200, existing role preserved |
| `RBAC20_user_update_empty_role_preserves.yml` | PUT with `role: ""` → 200, existing role preserved (Case C) |

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
