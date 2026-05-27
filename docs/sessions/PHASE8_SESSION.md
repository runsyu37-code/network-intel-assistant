# Phase 8 — Session Log 2026-05-26

**Scope:** Post-debate fixes before React team integration  
**Branch:** `backend`  
**Source:** Builder vs Adversarial Reviewer debate (Phase 8 debate transcript)

---

## Fix List (agreed in debate)

| # | Priority | Fix | Files |
|---|----------|-----|-------|
| 1 | Before integrate | `InternalServerError(ex)` → sanitized message in all Update/Delete | 14 controllers |
| 2 | Before integrate | Garbled Thai strings → English across all controllers | 11 controllers |
| 3 | Before integrate | `Updatecameras` — add admin+user role check | `camerasController.cs` |
| 4 | Before integrate | `ResolveOpenAlerts` — `GETDATE()` → `DateTime.UtcNow` | `PingService.cs` |
| 5 | Low urgency | `SaveUsers` + `UpdateUsers` — `ValidRoles` whitelist | `usersController.cs` |

---

## Fix 1 — InternalServerError(ex) Scope

28 instances across 14 controllers — all Update, Delete, and some GET methods.

**Pattern replaced:**
```csharp
// Before
catch (Exception ex) { return InternalServerError(ex); }

// After
catch (Exception) { return InternalServerError(new Exception("An internal error occurred")); }
```

Note: Save methods were already fixed in Phase 7 with a SqlException+Exception split.
Update/Delete methods got the minimal security fix — raw `ex` no longer serialized to client.

---

## Fix 2 — Garbled Thai Strings Scope

35 instances across 11 controllers. Source files saved with encoding mismatch —
Thai UTF-8 characters rendered as garbled Latin-1 bytes.

**Decision (from debate):** Replace with English. Re-saving with BOM does not prevent recurrence.

Pattern mapping:
| Garbled (Thai intent) | English replacement |
|----------------------|---------------------|
| `"ไม่มีข้อมูลส่งมา"` | `"No data provided"` |
| `"ห้ามว่าง Null"` | `"Value cannot be null"` |
| `"{Field} ห้ามว่าง"` | `"{Field} is required"` |
| `"action และ table_name ห้ามว่าง"` | `"action and table_name are required"` |
| `"device_type และ device_id ห้ามว่าง"` | `"device_type and device_id are required"` |

---

## Fix 3 — Updatecameras Role Check

**Reason (from debate):** `floor_id` is included in the UPDATE — viewer reassigning a camera
to a different floor corrupts floor plan rendering from day one of React integration.
Level 1 fix (role check at method entry) accepted. Level 2 (split endpoints) deferred post-v1.

```csharp
if (!RequestContext.Principal.IsInRole("admin") &&
    !RequestContext.Principal.IsInRole("user"))
    return StatusCode(System.Net.HttpStatusCode.Forbidden);
```

---

## Fix 4 — PingService Timezone

**Reason (from debate):** `last_seen` stores UTC (`DateTime.UtcNow`), `resolved_at` stores
SQL Server local time (`GETDATE()`). Any query computing duration between the two columns
is wrong by timezone offset. Historical data is unrecoverable once accumulated.

```csharp
// ResolveOpenAlerts — replace GETDATE() inline with parameterized UTC
cmd.Parameters.Add("@resolvedAt", SqlDbType.DateTime2).Value = DateTime.UtcNow;
// SET resolved_at = @resolvedAt
```

---

## Fix 5 — ValidRoles Whitelist (low urgency)

**Reason (from debate):** Root cause of Bug E is in the write path, not in `Me()` ternary.
If `SaveUsers`/`UpdateUsers` accept any role string, a typo creates an account
that silently gets `viewer` access with no error.

```csharp
private static readonly HashSet<string> ValidRoles =
    new HashSet<string> { "admin", "user", "viewer" };
// Throw ArgumentException if role not in set
```

---

## Phase 9 Backlog (not in this session)

**Rate Limiting on /api/auth/login** — minimum viable spec:
- 10 failed attempts / 5 min per IP → 429 Too Many Requests
- 15-minute lockout
- Log every lockout event to `audit_logs`
- **Must** log `COUNTER_RESET` on `Application_Start` (IIS pool recycle clears in-memory counters)

---

## What Was Defended (Builder held position)

| Issue | Reviewer conceded |
|-------|-------------------|
| VLAN poisoning | `vlan_id` is documentation metadata — not a network command |
| Firmware spoofing | `firmware_version` is a free-text field — no enforcement mechanism |
| DST drift | Thailand UTC+7 fixed — valid for this deployment |
| Bug E fix location | Fix write path (`SaveUsers`), not read path (`Me()`) |
| Rate limiting | Audit log provides reactive visibility; BCrypt delay sufficient for LAN |

*Session 2026-05-26. Debate closed.*
