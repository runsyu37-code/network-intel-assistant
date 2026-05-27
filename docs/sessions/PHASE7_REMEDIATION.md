# Phase 7 Remediation Plan — Debate Approved

**Source:** Claude vs Gemini adversarial debate, 2026-05-26  
**Status:** CLOSED — React team cleared to start after these 6 fixes  
**Total estimated effort:** ~5 hours

---

## Final Fix List

| # | Fix | File(s) to Change | Effort |
|---|-----|-------------------|--------|
| 1 | **SqlTransaction** — wrap bulk inserts in all CRUD controllers | All `*Controller.cs` Save methods | ~1 hr |
| 2 | **Secure File Serving** — block `/uploads/` as `hiddenSegment`, serve via authenticated API endpoint, update `imagePath` DTO to return `/api/floors/{floorId}/floor-plan/image` | `web.config`, `floorPlansController.cs` | ~1 hr |
| 3 | **Identity & RBAC** — admin-only on POST/DELETE `/api/users`, BCrypt server-side on create, remove `pw_hash` from GET response, add role check on `PATCH /api/cameras/{id}/position` | `usersController.cs`, `camerasController.cs` | ~2 hr |
| 4 | **Canonical Device Type Strings** — create `DeviceTypes` static class, `poe_switch` as canonical, fix `devicesController` (`"switch"` → `DeviceTypes.PoeSwitch`) and `hierarchyController.GetDeviceStatus` (`"poe-switch"` → `DeviceTypes.PoeSwitch`) | New `Constants/DeviceTypes.cs`, `devicesController.cs`, `hierarchyController.cs` | ~30 min |
| 5 | **JWT Secret** — move from `JwtHelper.cs` const to `Web.config` `<appSettings>`, read via `ConfigurationManager.AppSettings["JwtSecret"]`, rotate immediately | `JwtHelper.cs`, `Web.config` | ~15 min |
| 6 | **Dynamic CORS** — move allowed origins from hardcoded string in `WebApiConfig.cs` to `Web.config` `<appSettings>` key (e.g., `CorsOrigins`), read at startup | `WebApiConfig.cs`, `Web.config` | ~15 min |

---

## Items Debated and Cleared (Not Bugs)

| Item | Verdict | Reasoning |
|------|---------|-----------|
| Network isolation (intranet) | ✅ Cleared | Strict host-based firewall + isolated server — L2/L3 architecture sound |
| 6-layer upload validation usefulness | ✅ Cleared | Protects against file-based attacks orthogonally from RBAC |
| Threat model scope | ✅ Acknowledged | IT-staff only, insider-only model — reduces external attack surface significantly |
| TOCTOU mitigation (write-to-temp + File.Move) | ✅ Cleared | Correct pattern; temp and dest on same filesystem by deployment assumption |
| Camera position % storage (DECIMAL 10,4) | ✅ Cleared | Resolution-independent is correct for floor plan rendering |
| 3 flat queries + in-memory LINQ nesting | ✅ Cleared | Dataset < 500 rows; debuggable; recursive CTE not justified |
| Bulk insert blast radius | ✅ Scoped down | Bulk save is setup/import operation, not real-time UI — React Query retry risk is lower than initially framed |
| Static file URL guessability | ✅ Scoped down | `ffff` fractional seconds = massive entropy; security through obscurity, not trivially guessable — but still must fix routing |

---

## Key Architectural Decisions Locked In

1. **`imagePath` in floor plan response** must be an API URL (`/api/floors/{id}/floor-plan/image`), not a relative file path — frontend cannot construct image URLs from file system paths
2. **`poe_switch`** (underscore) is canonical device type string — matches existing `alert_logs` DB data, avoids SQL migration
3. **Config-driven secrets** — JWT secret, CORS origins, connection string all in `Web.config` / gitignored config files, never in C# source
4. **Non-repudiation matters** — this is an auditing tool; audit log spoofing via RBAC hole is especially unacceptable for the core purpose of the system

---

## What Was Successfully Defended

- BCrypt for password storage — correct choice
- Parameterized queries everywhere — no SQL injection surface found
- Global JWT filter with `[AllowAnonymous]` opt-out — correct pattern
- Magic byte verification in upload — thorough and correct
- Per-device exception isolation in PingService — correct design
- `Interlocked.CompareExchange` cycle guard in PingService — correct concurrency pattern
- `SqlTransaction` in `UploadFloorPlan` (deactivate old + insert new) — already correct

---

*Debate closed 2026-05-26. React team cleared to start after 6 fixes above are merged.*
