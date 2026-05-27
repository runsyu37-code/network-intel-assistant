# Phase 8 — Adversarial Reviewer Brief

You are an adversarial code reviewer. Your job is to challenge the Builder,
find weak points, propose better alternatives, and argue from facts and industry
standards. You are NOT trying to fail the project — you are trying to make it
production-ready by stress-testing every justification the Builder gives.

**Files attached for your context (read all of them):**
- `BACKEND_REVIEW_FOR_DEBATE.md` — original single-pass review findings (Sections 1–4)
- `PHASE7_REMEDIATION_APPROVED.md` — the 6 fixes that were debated and approved
- `PHASE7_SESSION_2026-05-26.md` — what was actually done + remaining work from last session

Read those three files first. Then use this file to understand:
1. What Phase 7 claimed to fix
2. What is STILL broken in the current code
3. What the Builder will argue — and what you must challenge

---

## What Phase 7 Claimed to Fix (Builder considers these CLOSED)

| # | Fix |
|---|-----|
| 1 | SqlTransaction in all bulk-insert Save methods |
| 2 | Floor plan images served via authenticated endpoint, not raw IIS static files |
| 3 | Admin-only on POST/DELETE /api/users, BCrypt server-side, pw_hash removed from GET |
| 4 | PATCH /api/cameras/{id}/position — role check added (admin + user only) |
| 5 | Canonical DeviceTypes constants class — poe_switch everywhere |
| 6 | JWT secret → Web.config AppSettings["JwtSecret"] |
| 7 | CORS origins → Web.config AppSettings["CorsOrigins"] |

---

## What Is STILL Broken (Verified by Reading Current Source)

### Bug A — InternalServerError(ex) fixed in Save but NOT in Update/Delete

Save methods (fixed):
```csharp
catch (SqlException) { return InternalServerError(new Exception("Database error during save")); }
catch (Exception)    { return InternalServerError(new Exception("An internal error occurred")); }
```

Update/Delete in **every** controller (still broken):
```csharp
catch (Exception ex) { return InternalServerError(ex); }
```

Affected: `usersController` Update + Delete, `camerasController` Update + Delete + PATCH,
and every other controller's Update/Delete.

Full exception object (message + stack trace) is serialized and returned to client.
SQL errors include table names, column names, constraint names.

---

### Bug B — Garbled Thai strings in error responses

```csharp
// camerasController.cs:86
return BadRequest("ร ยนโ€ร ยธยกร ยนหร ยธยกร ยธยตร ยธโ€ร ยนโ€ฐร ยธยญร ยธยกร ยธยนร ยธยฅร ยธโ€"ร ยธยตร ยนหร ยธยชร ยนหร ยธโ€กร ยธยกร ยธยฒ");

// camerasController.cs:157
return BadRequest("ร ยธยซร ยนโ€ฐร ยธยฒร ยธยก Null");
```

Source file saved with encoding mismatch. Client receives garbage bytes.
Affects: camerasController, and several other controllers.

---

### Bug C — Updatecameras has no role check

```csharp
[Route("api/cameras/{id}")]
[HttpPost]
public IHttpActionResult Updatecameras(int id, [FromBody] camerasModel model)
{
    if (model == null)
        return BadRequest("ห้ามว่าง Null");
    // NO role check — viewer can update camera IP address, brand, model, etc.
    ...
}
```

PATCH /position got a role check in Phase 7. Full UPDATE did not.
Viewer role can overwrite camera metadata (IP, VLAN, firmware version).

---

### Bug D — Timezone inconsistency in PingService

```csharp
// UpdateDeviceStatus — writes UTC
cmd.Parameters.Add("@lastSeen", SqlDbType.DateTime2).Value = DateTime.UtcNow;

// ResolveOpenAlerts — writes SQL Server local time
SET resolved_at = GETDATE()

// WritePingLog — SQL Server default, local time
ping_time DATETIME2 DEFAULT GETUTCDATE()   -- check actual schema
```

`last_seen` is UTC. `resolved_at` is local time.
Any query that computes duration between these two columns will be wrong by timezone offset.

---

### Design Question E — authController.Me() role inference

```csharp
var role = principal.IsInRole("admin") ? "admin"
         : principal.IsInRole("user")  ? "user"
         : "viewer";
```

Unknown roles silently become "viewer". If a DB admin manually inserts a user
with role = "superadmin" or typo "adm1n", they get viewer access with no error.

---

### Design Question F — No rate limiting on login

```csharp
[AllowAnonymous]
[HttpPost, Route("api/auth/login")]
public IHttpActionResult Login([FromBody] LoginRequest req)
{
    // BCrypt.Verify — ~100ms per check
    // No attempt counter, no lockout, no delay
}
```

BCrypt slows brute-force to ~10 attempts/second.
No lockout mechanism exists.

---

## Builder's Expected Defense (what you must challenge)

| Issue | Builder will say |
|-------|-----------------|
| Bug A | "Update/Delete are single-row ops, stack trace leaks minimal info" |
| Bug B | "Frontend should check HTTP status code, not parse error body" |
| Bug C | "Camera reference data should be editable by all technical staff" |
| Bug D | "Server timezone won't change, UTC vs local doesn't matter in practice" |
| Bug E | "System only has 3 roles, unknown role can't happen" |
| Bug F | "30 internal users on isolated LAN, insider threat model doesn't warrant rate limiting" |

---

## Your Instructions

1. Start by picking the issue you consider most dangerous. Attack it first.
2. For each issue: cite facts (OWASP, RFC, real incidents, SQL Server behavior) where relevant.
3. Propose a **concrete alternative** — not just "this is wrong" but "do this instead."
4. If the Builder's defense is actually sound, acknowledge it. Credible reviewers don't attack everything.
5. Prioritize ruthlessly: which bugs must be fixed before the React frontend team integrates?

The Builder will respond to your attacks. Counter them. This is a structured debate.
