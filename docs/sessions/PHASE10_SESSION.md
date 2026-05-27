# Phase 10 Session Log — 2026-05-27

**Branch:** `backend`  
**Commits:** `177028c` (Phase 10 test collection) → `ffced44` (Phase 10 full RBAC implementation)  
**Engineer:** Ran (Reviewer) + Claude (Builder)

---

## What Was Done

### 1. Full Write RBAC Tightened to Admin-Only

**Problem:** Phase 9 implemented RBAC for write endpoints but used `admin + user` on infrastructure controllers (sites, buildings, floors, rooms, racks, nvrs, poe_switches). The confirmed ROLE_MATRIX (committed at end of Phase 9) requires **all write endpoints to be admin-only**.

**Fix:** Changed the role check pattern from:
```csharp
if (!RequestContext.Principal.IsInRole("admin") &&
    !RequestContext.Principal.IsInRole("user"))
    return StatusCode(System.Net.HttpStatusCode.Forbidden);
```
to:
```csharp
if (!RequestContext.Principal.IsInRole("admin"))
    return StatusCode(System.Net.HttpStatusCode.Forbidden);
```

**Controllers changed:** sites, buildings, floors, rooms, racks, nvrs, poe_switches (3 each: Save, Update, Delete)

**Method:** PowerShell batch replace with CRLF-aware `[System.IO.File]::ReadAllText` / `.Replace()` / `.WriteAllText()`.

**Why CRLF matters:** The first attempt using PowerShell string literals failed because Windows files have CRLF line endings but the replacement string used LF only. Must use `` `r`n `` explicitly in PowerShell string interpolation.

---

### 2. Missing Role Checks Added to camerasController

**Problem:** `Savecameras` and `Deletecameras` had **zero** role checks — any authenticated user (viewer, user, admin) could insert or delete camera records. Also `Updatecameras` and `PatchPosition` were still admin+user.

**Fix:**
- Added `if (!IsInRole("admin")) return 403;` to `Savecameras` (before body validation)
- Added `if (!IsInRole("admin")) return 403;` to `Deletecameras` (before try block)
- Changed `Updatecameras` and `PatchPosition` from admin+user → admin only

**How discovered:** The write RBAC audit counted `IsInRole("user")` occurrences per file. camerasController showed `2` (only Update and PATCH had checks) while the expected count for a fully protected controller with 4 write endpoints is `0`.

---

### 3. GET RBAC Added — All Controllers

**Problem:** All GET endpoints had zero role checks. Any authenticated user (even viewer) could call `GET /api/cameras` and receive IP addresses, serial numbers, MAC addresses.

**Fix per role matrix:**

| GET Endpoint | Access | Check Added |
|---|---|---|
| /api/sites, /api/buildings, /api/floors, /api/floor-plans | All roles | None (stays open) |
| /api/rooms, /api/racks | admin + user | Block viewer: `!IsInRole("admin") && !IsInRole("user")` |
| /api/cameras, /api/nvrs, /api/poe-switches | admin only | `!IsInRole("admin")` |
| /api/devices | admin only | `!IsInRole("admin")` |
| /api/alert-logs, /api/audit-logs, /api/ping-logs, /api/sync-logs | admin only | `!IsInRole("admin")` |
| /api/users | admin only | `!IsInRole("admin")` |

**Method:** PowerShell batch replace targeting the `{\r\n            List<` pattern at the start of each GET method body. devicesController uses `var types` not `List<` on its first line, so it was handled separately with Edit.

---

### 4. Bruno Test Collection Updated

**RBAC05 changed:** Was `user POST /api/sites → 200 (user allowed)`. Changed to `403` because the confirmed matrix says all writes are admin-only.

**Added RBAC12-17:**

| Test | Endpoint | Role | Expected |
|---|---|---|---|
| RBAC12 | GET /api/rooms | viewer | 403 |
| RBAC13 | GET /api/rooms | user | 200 |
| RBAC14 | GET /api/cameras | viewer | 403 |
| RBAC15 | GET /api/cameras | user | 403 |
| RBAC16 | GET /api/racks | viewer | 403 |
| RBAC17 | GET /api/cameras | admin | 200 |

---

## Problems Hit

| Problem | Root cause | Fix |
|---|---|---|
| PowerShell `.Replace()` didn't match | CRLF in file vs LF in replacement string | Used `` `r`n `` in replacement pattern; read/write with `[System.IO.File]` |
| camerasController Save + Delete unprotected | Phase 9 script missed these (no `IsInRole` pattern to match) | Added check manually with Edit tool |
| devicesController GET pattern different | Starts with `var types = ...` not `List<` | Used Edit tool targeted at method signature |
| RBAC05 test contradicted confirmed matrix | Test was written before matrix was finalized | Renamed file and updated expected status to 403 |

---

## Phase 10 Final RBAC Audit

| Controller | Write (all admin-only) | GET check |
|---|---|---|
| sitesController | ✅ | open — all roles |
| buildingsController | ✅ | open — all roles |
| floorsController | ✅ | open — all roles |
| floorPlansController | ✅ | open — all roles |
| roomsController | ✅ | admin+user (viewer blocked) |
| racksController | ✅ | admin+user (viewer blocked) |
| camerasController | ✅ (Save+Delete fixed) | admin only |
| nvrsController | ✅ | admin only |
| poeSwitchesController | ✅ | admin only |
| devicesController | read-only | admin only |
| alertLogsController | ✅ | admin only |
| auditLogsController | ✅ | admin only |
| pingLogsController | ✅ | admin only |
| syncLogsController | ✅ | admin only |
| usersController | ✅ | admin only |
| hierarchyController | read-only | open (TBD scope) |

---

## Phase 11 Backlog

| Item | Priority | Notes |
|---|---|---|
| Build + run Bruno RBAC01-17 tests | High | Need live server — run with all 3 role tokens |
| Adversarial review of Phase 9+10 | Medium | Challenger position: is admin-only on infrastructure too strict? |
| Refresh token endpoint | Low | Not needed unless frontend reports UX issue with 8h expiry |
| Pagination | Low | Only needed if device count exceeds 500 |
| Webhook delivery for alert_logs.webhook_sent | Low | Column exists, no delivery logic yet |
| GET /api/hierarchy/tree — scope TBD | Low | What should viewer see vs user in the tree? |

---

*Generated 2026-05-27. Backend: Ran. Builder: Claude Sonnet 4.6.*
