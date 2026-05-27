# Phase 7 — Session Log 2026-05-26

**Scope:** Complete Phase 7 Remediation + Bruno test collection setup  
**Branch:** `backend`  
**Status:** All 6 fixes merged. Bruno collection ready for testing.

---

## Part 1 — Phase 7 Remediation (Completed)

All 6 fixes from the debate-approved plan are now done.

| # | Fix | Files Changed |
|---|-----|---------------|
| 1 | SqlTransaction in all bulk-insert Save methods | All `*Controller.cs` |
| 2 | Secure floor plan serving — `hiddenSegment` in IIS + authenticated API endpoint + `imagePath` DTO returns `/api/floors/{id}/floor-plan/image` | `floorPlansController.cs`, `Web.config` |
| 3 | RBAC — admin-only on POST/UPDATE/DELETE `/api/users`, BCrypt server-side on create/update, `pw_hash` removed from GET response, role check on PATCH `/api/cameras/{id}/position` (admin + user only) | `usersController.cs`, `camerasController.cs`, `usersModel.cs` |
| 4 | Canonical device type strings — `DeviceTypes` static class created, `poe_switch` everywhere, controllers use `DeviceTypes.PoeSwitch` constant in SQL interpolation | New `Constants/DeviceTypes.cs`, `devicesController.cs`, `hierarchyController.cs` |
| 5 | JWT secret moved from hardcoded const to `Web.config` `AppSettings["JwtSecret"]` | `JwtHelper.cs`, `Web.config` |
| 6 | CORS origins moved from hardcoded string to `Web.config` `AppSettings["CorsOrigins"]` | `WebApiConfig.cs`, `Web.config` |

### Fix 2 — Detail (imagePath DTO)
`GetFloorPlan` and `UploadFloorPlan` responses previously returned the raw filesystem relative path (`uploads/floor-plans/...`). Now both return `/api/floors/{floorId}/floor-plan/image` so the frontend has a stable, auth-protected URL to request images from.

### Fix 4 — Detail (DeviceTypes constants)
`devicesController` default type set changed from `{ "camera", "nvr", "switch" }` to `{ DeviceTypes.Camera, DeviceTypes.Nvr, DeviceTypes.PoeSwitch }`. The `types.Contains("switch")` filter key also updated to `DeviceTypes.PoeSwitch`. SQL inline strings use `$@"...'{DeviceTypes.PoeSwitch}'..."` interpolation.

---

## Part 2 — Bruno Collection Setup

### Problems Encountered & Solutions

| # | Problem | Root Cause | Fix |
|---|---------|------------|-----|
| 1 | `ECONNREFUSED 127.0.0.1:44342` | API server not running | Start project in Visual Studio (F5) |
| 2 | `ECONNRESET` on all requests | Bruno sending `http://` to port 44342 which is IIS Express **HTTPS** port | Changed all URLs to HTTP port `50680` (found in `.vs/.../applicationhost.config`) |
| 3 | `EPROTO WRONG_VERSION_NUMBER` on some requests | Some files had `https://localhost:44342` — port changed to 50680 but protocol stayed HTTPS | Replaced `https://localhost` → `http://localhost` across all yml files |
| 4 | `404 No HTTP resource found — controller 'GetBuildings'` | Bruno yml files used old-style URLs (`/api/GetBuildings`, `/api/SaveCameras`, etc.) from before REST routes were added | Bulk-replaced all 50+ URLs to correct REST routes (`/api/buildings`, `/api/cameras`, etc.) |
| 5 | `401 Unauthorized (0 bytes)` on GET requests | No Authorization header in most Bruno yml files | Added `Authorization: Bearer {{admin_token}}` to all request files |
| 6 | `401 Unauthorized (0 bytes)` on LOGIN | `pw_hash` stored in DB was not BCrypt format — old code stored client-supplied hash directly. `BCrypt.Verify()` now requires valid `$2b$...` format | Generated BCrypt hash via Python (`bcrypt.hashpw`), ran `UPDATE users SET pw_hash = '...' WHERE username = 'admin'` in SSMS |
| 7 | `FileNotFoundException: System.Runtime.CompilerServices.Unsafe Version=4.0.4.1` | BCrypt.Net-Next 4.0.3 depends on this assembly as a transitive dependency — not referenced in `.csproj`, DLL never copied to `bin/` | Added explicit `<Reference>` in `.csproj` (version 6.0.0), added `<bindingRedirect oldVersion="0.0.0.0-6.0.0.0" newVersion="6.0.0.0" />` in `Web.config`, added entry to `packages.config` |
| 8 | `Msg 208 Invalid object name 'users'` in SSMS | SSMS was connected to wrong database (`master`) | Switched to correct database via dropdown in SSMS toolbar |
| 9 | Hardcoded JWT token found in `buildings/GET.yml` `runtime.variables` block | Token was pasted directly into the yml file | Removed all `runtime.variables` blocks, replaced token values with `{{admin_token}}` variable |

### Bruno Collection State (End of Session)

- All request files: `Authorization: Bearer {{admin_token}}` ✅
- `auth/LOGIN.yml`: no auth header (correct — public endpoint) ✅
- `auth/bruno.json` added (collection was missing it, only had `opencollection.yml`) ✅
- All URLs: `http://localhost:50680/api/...` REST-style routes ✅
- `.gitignore`: `bruno/**/environments/` added — environment files (with real tokens) never committed ✅
- No hardcoded tokens in any yml file ✅

### IIS Express Ports (this machine)
| Protocol | Port |
|----------|------|
| HTTP | **50680** |
| HTTPS | 44342 |

---

## Part 3 — Remaining Work

| Item | Notes |
|------|-------|
| Add `user` role account | For testing RBAC (PATCH camera position allowed) |
| Add `viewer` role account | For testing RBAC (POST/DELETE users → 403, PATCH position → 403) |
| Bruno: test all 6 fixes via requests | See test checklist in `PHASE7_REMEDIATION_APPROVED.md` |

---

*Session ended 2026-05-26. React team cleared to start.*
