# SSM Backend — Full Code Review for Debate

**Reviewer:** Claude (claude-sonnet-4-6), single-pass read of source  
**Scope:** All backend C# files on branch `backend` vs `master`  
**Purpose:** Factual list of decisions + issues — bring this to an adversarial second reviewer (Gemini / separate Claude session) for debate. Not a verdict, just the facts.

---

## Section 1 — What Was Built (Decisions + Rationale)

| # | What | Technique Used | Why This Was Chosen |
|---|------|---------------|---------------------|
| 1 | Framework | ASP.NET Web API 5.x on .NET Framework 4.8 | Existing codebase constraint, no migration budget |
| 2 | Auth | JWT HS256, 8h expiry, BCrypt password hash | Industry standard for internal API; BCrypt for passwords |
| 3 | JWT secret | Hardcoded string in `JwtHelper.cs` | Flagged as temporary; "change in production" comment exists |
| 4 | No refresh token | Single 8h token per login | Simplicity; 30 internal users on 8-hour shifts |
| 5 | Global JWT filter | `config.Filters.Add(new JwtAuthFilter())` in `WebApiConfig` | All endpoints protected by default; `[AllowAnonymous]` overrides |
| 6 | Hierarchy tree | 3 flat SQL queries + in-memory LINQ `GroupBy` nesting | Chosen over recursive CTE for debuggability; dataset expected < 500 rows total |
| 7 | Camera position | `DECIMAL(10,4)` percentage (0.0–1.0), not pixels | Resolution-independent when floor plan images resize |
| 8 | Floor plan versioning | Separate `floor_plans` table, soft deactivation (`is_active=0`) | Keeps version history; unique filtered index ensures 1 active plan per floor |
| 9 | File upload validation | 6 layers: JWT → admin role → floor exists → extension → MIME → magic bytes | Defense-in-depth after V2.1 security review |
| 10 | TOCTOU mitigation | Write to `.tmp` first, then `File.Move()` atomically | Prevents partial file being served during upload |
| 11 | PingService | `static class` + `System.Threading.Timer`, started in `Application_Start` | Background monitoring without IHostedService (not available in .NET Framework 4.8) |
| 12 | Per-device exception isolation | Try/catch per device in `RunCycle()`, errors written to `ping_logs` | One bad IP doesn't block the rest of the cycle |
| 13 | Interlocked cycle guard | `Interlocked.CompareExchange(ref _running, 1, 0)` | Prevents overlapping cycles if a cycle takes > 30s |
| 14 | HTTP methods for CRUD | All mutations use `HttpPost` (including update/delete) | Team convention; non-RESTful by design choice |
| 15 | Delete route pattern | `POST /api/{entity}/delete/{id}` | Avoids `HttpDelete` which some proxies block |
| 16 | CORS | `EnableCorsAttribute` with explicit origins in `WebApiConfig` | Only React dev origins whitelisted; no wildcard |
| 17 | Connection string | `ConfigurationManager.ConnectionStrings["CN"]` from `connectionStrings.config` (gitignored) | Secret externalized from source code |
| 18 | Unified device search | `GET /api/devices` with `UNION ALL` across cameras/nvrs/poe_switches | Single endpoint for search-across-device-types feature |
| 19 | Image dimension parsing | Manual byte-parsing of PNG header + JPEG SOF0/SOF2 markers | Avoids `System.Drawing` (deprecated on server) and third-party library dependency |
| 20 | Dashboard summary | `SELECT * FROM vw_dashboard_summary` SQL view | Aggregate counts computed in DB, not application layer |

---

## Section 2 — Issues Found (by Severity)

### CRITICAL — Fix Before Frontend Goes Live

**C1. JWT secret is in git history forever**
- File: `JwtHelper.cs:13`
- Code: `public const string SecretKey = "SSM_JWT_SECRET_KEY_CHANGE_IN_PRODUCTION_2026";`
- Problem: Committed to git. Even if replaced in production `Web.config`, this string is now permanently in `git log`. Anyone who clones the repo has the HS256 signing key and can forge valid tokens for any user/role.
- What was done: Left with a comment saying "change in production"
- What should be done: Read from `ConfigurationManager.AppSettings["JwtSecret"]`. Rotate immediately.

**C2. `GET /api/users` returns `pw_hash` to all authenticated users**
- File: `usersController.cs:27–28`
- Code: `SELECT [User_ID],[username],[pw_hash],...`
- Problem: BCrypt hashes are exposed over the wire to any authenticated caller (not admin-only). An attacker with any valid JWT can harvest all bcrypt hashes and run offline cracking.
- What was done: No field filtering, no role check on GET
- What should be done: Exclude `pw_hash` from GET response; add admin-only role check

**C3. `POST /api/users` (create user) accepts `pw_hash` from request body with no role check**
- File: `usersController.cs:56–91`
- Problem 1: Any authenticated user (viewer, user role) can create a new user account, including role = "admin"
- Problem 2: `pw_hash` is taken directly from request body without any hashing — caller controls the hash. No BCrypt is performed in this endpoint (unlike `authController.Login` which uses `BCrypt.Verify`)
- What was done: Basic null/empty validation only
- What should be done: Admin-only restriction; perform `BCrypt.HashPassword()` on incoming plaintext password

**C4. `DELETE /api/users` has no role check**
- File: `usersController.cs:149–169`
- Problem: Any authenticated user can delete any user including admins
- What was done: No role check whatsoever

**C5. `PATCH /api/cameras/{id}/position` has no role check**
- File: `camerasController.cs:261–296`
- Problem: Viewer role can drag camera pins on floor plan. "viewer" implies read-only.
- Note: `floorPlansController.UploadFloorPlan()` has admin check; this endpoint is inconsistent
- What was done: Reads identity to record `position_set_by`, but never checks the role

---

### HIGH — Security / Data Integrity Risk

**H1. `InternalServerError(ex)` returns full exception stack to client**
- Pattern found in: Every controller catch block (`camerasController`, `nvrsController`, `usersController`, `devicesController`, etc.)
- Code: `catch (Exception ex) { return InternalServerError(ex); }`
- Problem: On SQL error, client receives full exception message including SQL syntax, table names, column names. On connection error, may reveal connection string fragments.
- What was done: Direct pass-through of exception object
- What should be done: Log internally, return generic `"An internal error occurred"` to client

**H2. Floor plan images served without authentication**
- File: `floorPlansController.cs:124`, `WebApiConfig.cs`
- Code: `HttpContext.Current.Server.MapPath("~/uploads/floor-plans")`
- Problem: Files saved inside the web app folder. IIS serves `~/uploads/` statically without passing through JWT filter. Anyone who knows (or guesses) the URL `http://server/uploads/floor-plans/{floorId}_{timestamp}.jpg` can download floor plans without a token.
- The filename pattern is: `{floorId}_{yyyyMMddHHmmssffff}.jpg` — guessable if attacker knows a floorId
- What was done: 6-layer upload validation, but no download protection
- What should be done: Move uploads outside web root, or add `web.config` rule to deny direct access and serve via API endpoint with JWT check

**H3. No rate limiting on login endpoint**
- File: `authController.cs:18–68`
- Problem: Unlimited login attempts. No lockout, no delay, no CAPTCHA. LAN attacker can brute-force any account.
- What was done: Input validation only (`null`/`whitespace` check)
- What should be done: Minimum: in-memory per-username attempt counter + exponential backoff

**H4. Bulk inserts without transaction**
- Pattern in: `camerasController.Savecameras`, `usersController.Saveusers`, and all other CRUD controllers
- Code: `foreach (var item in modelList) { cmd.ExecuteNonQuery(); }`
- Problem: If inserting 10 items and item 7 fails, items 1–6 are committed. No rollback. Frontend retry will create duplicates.
- What was done: No transaction wrapping the loop
- What should be done: Wrap in `SqlTransaction`, rollback on any failure

---

### MEDIUM — Correctness / Design Problems

**M1. Garbled Thai encoding in error messages**
- Files: `camerasController.cs:86,89,111,153`, `usersController.cs:62,65,87,110`, and other controllers
- Code: `return BadRequest("à¹„à¸¡à¹ˆà¸¡à¸µ...");`
- Problem: Source file saved with wrong encoding. Client receives garbage bytes as error message. If frontend parses error strings for display, it will crash or show unreadable text.
- What was done: Thai strings written in files with encoding mismatch
- What should be done: Use English strings, or fix file encoding (UTF-8 BOM)

**M2. Device type string inconsistency across the codebase**
- `PingService.cs`: uses `"camera"`, `"nvr"`, `"poe_switch"` (underscore)
- `devicesController.cs`: returns `"camera"`, `"nvr"`, `"switch"` (no prefix)
- `hierarchyController.GetBreadcrumb`: accepts `"poe-switches"` (hyphen, plural)
- `hierarchyController.GetDeviceStatus`: returns `"poe-switch"` (hyphen, singular)
- `alert_logs` table: stores `device_type` from PingService so `"poe_switch"` (underscore)
- Problem: Frontend will need to handle 3–4 different strings for the same physical device type. Alert log device_type won't match devicesController device_type.
- What was done: Each layer independently chose its string format
- What should be done: Pick one canonical string (`"poe_switch"` or `"poe-switch"`) and use it everywhere

**M3. Mixed timezone handling in PingService**
- `UpdateDeviceStatus` (alive path): `DateTime.UtcNow` — UTC
- `ResolveOpenAlerts`: `GETDATE()` — SQL Server local time
- `WritePingLog`: implicit `GETDATE()` via SQL Server default — local time
- Problem: `last_seen` is UTC, `resolved_at` is local time. Dashboard time calculations will be wrong by timezone offset.
- What was done: No consistent timezone strategy

**M4. `ConnectionDB` has unused public static `SqlConnection con` field**
- File: `ConnectionDB.cs:12`
- Code: `public static SqlConnection con;`
- Problem: Dead code. If someone ever writes `ConnectionDB.con.Open()` thinking it's the shared connection, they'll get a NullReferenceException. Static SqlConnection is also an anti-pattern (not thread-safe).
- What was done: Field declared but never assigned or used

**M5. `SELECT *` in `GetDashboardSummary`**
- File: `hierarchyController.cs:202`
- Code: `new SqlCommand("SELECT * FROM vw_dashboard_summary", con)`
- Problem: If view schema changes, the C# reader will throw `IndexOutOfRangeException` on missing column names. Also transfers all columns even if only some are needed.
- What was done: Wildcard select
- What should be done: Explicit column list

**M6. `authController.Me()` role fallback is wrong**
- File: `authController.cs:81`
- Code: `principal.IsInRole("admin") ? "admin" : principal.IsInRole("user") ? "user" : "viewer"`
- Problem: If the actual role is `"viewer"` in the JWT claim, this returns `"viewer"` correctly — but if someone has role `"superadmin"` or any other value, they silently get `"viewer"`. The logic should read the actual claim, not infer by exclusion.
- What was done: Ternary chain that defaults unknown roles to "viewer"

**M7. CORS has no production origin**
- File: `WebApiConfig.cs:12`
- Code: `origins: "http://localhost:5173,http://localhost:3000,http://localhost:5174"`
- Problem: Only dev origins. When deployed to intranet, browsers will block all API calls unless CORS is updated.
- What was done: Dev-only config committed

---

### LOW — Performance / Maintainability

**L1. PingService opens 3–4 separate SqlConnections per device per cycle**
- File: `PingService.cs` — `WritePingLog`, `UpdateDeviceStatus`, `HandleOffline`, `ResolveOpenAlerts` each open their own connection
- Problem: 100 cameras × 4 connections = 400 connection open/close per 30-second cycle. ADO.NET connection pooling mitigates this, but it's still unnecessary overhead. If SQL Server hiccups mid-device, ping_log and status update can desync.
- What was done: Each helper method is self-contained for simplicity
- What should be done: Pass connection to helpers, or batch DB writes

**L2. `vw_dashboard_summary` — unknown query cost, no indexes documented**
- File: `hierarchyController.cs:202`, `hierarchyController.GetTree` line 31
- Problem: Every `GET /api/hierarchy/tree` and `GET /api/dashboard/summary` hits this view. The view definition is not in the repo. No indexes are documented. No query plan analyzed.
- What was done: View assumed to be fast

**L3. Building alert count uses correlated subqueries**
- File: `hierarchyController.cs:52–56`
- Code: 3 separate `SELECT COUNT(*)` subqueries inside the buildings SELECT (cameras + nvrs + poe_switches WHERE status IN ...)
- Problem: For N buildings, this is 3N subqueries. At 50 buildings, that's 150 subquery evaluations per tree load. This is a textbook N+1 waiting to happen.
- What was done: Inline correlated subqueries instead of JOIN to a derived table

**L4. `GET /api/status/devices` designed for polling but has no caching**
- File: `hierarchyController.cs:108–139`
- Problem: Endpoint comment says "used for 30-second polling." Every poll is a full UNION ALL across cameras + nvrs + poe_switches with no caching. 30 users × 1 request/30s = 1 request/second to this endpoint at peak. Not critical now, but no strategy exists.
- What was done: Raw DB query per request

**L5. `AddParameters` helper not reused between Save and Update**
- File: `camerasController.cs:117–144`
- Problem: `AddParameters` exists for Save, but Update duplicates all 25 parameter assignments manually. If a new column is added, two places need updating. Pattern repeated across all controllers.
- What was done: Helper for Save only, manual copy-paste for Update

**L6. IIS app pool recycle silently restarts PingService**
- File: `Global.asax.cs:23`
- Problem: IIS can recycle the app pool on idle timeout or memory pressure. `Application_End` → `PingService.Stop()`, `Application_Start` → `PingService.Start()`. During recycle, there's a monitoring gap. No log entry written when this happens. Ops won't know monitoring paused.
- What was done: Relies on ASP.NET lifecycle silently

---

## Section 3 — Open Questions for Debate

These are design decisions that are defensible but worth challenging:

1. **JWT secret in source vs config** — Was moving it to `Web.config` enough? `Web.config` is gitignored, but what about `Web.Debug.config` and `Web.Release.config` transforms? Are those gitignored too?

2. **"LAN only = lower security bar"** — Is this actually true for an insider threat model? What is the actual threat model for this system?

3. **3 flat queries vs recursive CTE** — At what row count does the in-memory LINQ nesting become the bottleneck? The claim is < 500 rows — is that documented as a constraint or just an assumption?

4. **File upload atomicity** — `File.Move()` is atomic only if source and dest are on the same filesystem (same volume). Is `~/uploads/` guaranteed to be on the same drive as the temp directory? On Windows, `Path.GetTempPath()` is NOT used here — temp is `.tmp` extension in same folder — so this is actually fine. But is this documented?

5. **No refresh token** — 8h token, 8h shifts. What happens if a user's account is disabled mid-shift? The token remains valid until expiry. Is there a token revocation mechanism? (There isn't.)

6. **`poe_switch` vs `poe-switch` vs `switch`** — Was this an intentional decision or did it drift? If drift, when will it be fixed?

7. **Camera position PATCH — who should be allowed?** — Only admin? Admin + user? The current state (everyone) is clearly wrong. What is the intended access model for technicians doing floor plan surveys?

8. **Floor plan served without auth** — Was this considered and accepted, or overlooked?

---

## Section 4 — What Was Done Well (For Balanced Debate)

These points should be acknowledged before attacking:

- **BCrypt for passwords** — correct choice, not MD5/SHA1
- **Parameterized queries everywhere** — no SQL injection found in any controller
- **`[AllowAnonymous]` + global filter pattern** — correct implementation of opt-out auth
- **TOCTOU mitigation in file upload** — write-to-temp-then-move is the right pattern
- **Magic byte verification** — extension + MIME + actual header check is thorough
- **Per-device exception isolation in PingService** — one bad device doesn't crash the cycle
- **Interlocked cycle guard** — correct use of `Interlocked.CompareExchange` to prevent overlapping cycles
- **Percentage-based camera coordinates** — resolution-independent is the right call
- **`ConnectionDB` reads from `ConnectionStrings` config** — connection string externalized from source
- **Transaction in `UploadFloorPlan`** — deactivate old + insert new is wrapped in a proper `SqlTransaction`

---

*Generated by single-pass source read. Bring to adversarial reviewer for challenge.*
