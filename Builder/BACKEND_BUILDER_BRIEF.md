# Backend Builder Brief — SSM Network Monitor

> **For:** Backend Team (Ran playing the builder role)
> **Date:** 2026-05-28
> **Purpose:** Context you need to present your work confidently to a reviewer

---

## Your Role in This Review

You are the **backend builder**. You designed and built the ASP.NET Core REST API from scratch across rounds R1–R4, coordinating with the frontend team via spec documents. The reviewer has read `REVIEW_BRIEF.md` and will ask you to walk them through the work, justify decisions, and explain edge cases.

**The reviewer is not the frontend team.** They don't know the project history. Treat them as a capable engineer seeing this codebase for the first time.

---

## What You Built (R1–R4 Summary)

| Round | What Was Delivered |
|---|---|
| R1 | Initial API spec agreed — 11 controllers, JWT auth middleware, CORS config, appsettings.json structure |
| R2 | Confirmed all endpoints live: GET/POST CRUD for Cameras, NVRs, PoE Switches, Users; GET Hierarchy/Tree, GET Alert-Logs, GET Dashboard/Summary, GET Status/Devices, GET Ping-Logs, GET Floor Plan Image (blob) |
| R3 | Rack endpoints — GET /api/racks (enriched with JOIN fields + computed fields), GET /api/racks/{rackId} (rack detail with devices[] + alerts[]) |
| R4 | PATCH /api/cameras/{id}/position (accepts x, y as 0–100); added cameraCount + nvrCount to BuildingTreeDto; confirmed Floor_ID filter on GET /api/cameras |

---

## Key Technical Decisions — and Why

### 1. ASP.NET Core .NET 10, not Express or FastAPI
**Decision:** Use ASP.NET Core with C# for all API controllers.
**Why:** The organisation already uses .NET infrastructure. Strong typing prevents entire classes of runtime bugs. Entity Framework handles SQL Server ORM natively. The deployment environment is Windows Server IIS — .NET is the natural fit.
**Trade-off accepted:** Longer initial setup than Node/Python. Acceptable given team familiarity and operational requirements.

### 2. SQL Server, not PostgreSQL or SQLite
**Decision:** SQL Server as the primary database.
**Why:** Existing company database infrastructure. SQL Server Agent can run scheduled jobs for ping monitoring and alert generation without external task runners.

### 3. POST for Create + Update, not PUT/PATCH (except camera position)
**Decision:** `POST /api/{resource}` (no ID) = create; `POST /api/{resource}/{id}` = update; `POST /api/{resource}/delete/{id}` = delete.
**Why:** Legacy convention inherited from earlier ASP.NET MVC controllers in the project. Avoids CORS preflight complexity with non-standard verbs on some enterprise proxies.
**Exception:** `PATCH /api/cameras/{id}/position` uses PATCH because it is a partial update of a single field group — semantically distinct from a full record update.
**If reviewer asks why not REST-standard DELETE:** Noted non-standard choice. The existing controller pattern is consistent across all resources. Switching would require frontend + backend changes simultaneously with no user-visible benefit.

### 4. Array body on Create endpoints
**Decision:** `POST /api/cameras` (and NVRs, PoE Switches, Users) takes an **array** body even when creating a single record.
**Why:** Allows bulk import from other systems without a separate batch endpoint. The frontend always wraps single creates in `[{...}]`.
**If reviewer asks about the inconsistency with Update (single object body):** Noted. Update always targets one record by ID so array is unnecessary there.

### 5. Computed fields in GET /api/racks response
**Decision:** `GET /api/racks` returns `used_units`, `device_count`, `power_kw`, `power_budget_kw`, and aggregate `status` — not just raw columns.
**Why:** Rack list page needs these values to render capacity bars and status badges without making N+1 calls. Computing in SQL JOIN is cheaper than client-side aggregation.
**How computed:**
- `used_units` = SUM of u_size from NVRs + switches assigned to that rack (NVR = 2U, Switch = 1U)
- `power_kw` = SUM of poe_used_w / 1000 (rounded to 2dp)
- `status` = worst status across rack devices: "offline" > "warning" > "online"

### 6. JWT — HS256, 8-hour expiry
**Decision:** JWT signed with HMAC-SHA256, 8-hour expiry (`expiresIn: 28800`).
**Why:** 8 hours covers a full working day without re-login. Intranet deployment — token leak risk is low. HS256 is simpler to configure than RS256 for a single-server deployment.
**JWT payload claims:** `name` (username), `nameid` (User_ID), `role` ("admin"/"user"/"viewer").
**If reviewer asks about refresh tokens:** Not implemented. Acceptable for intranet with 8-hour sessions. If required, add a `POST /api/auth/refresh` endpoint.

### 7. CORS — explicit origin whitelist
**Decision:** CORS policy allows `http://localhost:3000` and `http://localhost:3001` only.
**Why:** Vite dev server may start on either port (3000 if free, 3001 if not). Whitelisting both prevents CORS errors during development without opening to all origins.
**Production:** Replace with the actual intranet URL in `appsettings.Production.json`.

### 8. Alert severity derived from alert_type string, not a DB enum
**Decision:** `alert_type` column stores strings like `"hdd_critical"`, `"latency_high"`. Severity is classified by the frontend from substrings.
**Why:** Flexible — new alert types can be added without a schema migration. Frontend classifies: contains `critical/offline/lost/fail/hdd` → critical; contains `warn/high/latency` → warning; else → info.

---

## API Endpoints (per controller)

| Controller | Endpoints |
|---|---|
| AuthController | POST /api/auth/login |
| CamerasController | GET /api/cameras, POST /api/cameras, POST /api/cameras/{id}, POST /api/cameras/delete/{id}, PATCH /api/cameras/{id}/position |
| NvrsController | GET /api/nvrs, POST /api/nvrs, POST /api/nvrs/{NVR_ID}, POST /api/nvrs/delete/{NVR_ID} |
| PoeSwitchesController | GET /api/poe-switches, POST /api/poe-switches, POST /api/poe-switches/{SW_ID}, POST /api/poe-switches/delete/{SW_ID} |
| UsersController | GET /api/users, POST /api/users, POST /api/users/{id}, POST /api/users/delete/{id} |
| DashboardController | GET /api/dashboard/summary |
| StatusController | GET /api/status/devices |
| AlertLogsController | GET /api/alert-logs?limit=N |
| HierarchyController | GET /api/hierarchy/tree |
| PingLogsController | GET /api/ping-logs?device_id=&device_type= |
| FloorsController | GET /api/floors/{floorId}/floor-plan/image |
| RacksController | GET /api/racks, GET /api/racks/{rackId} |

### Filter support
- GET /api/cameras: `Site_ID`, `Floor_ID`, `status`, `id` (single-camera lookup)
- GET /api/nvrs: `Site_ID`, `Rack_ID`, `status`
- GET /api/poe-switches: `Site_ID`, `Rack_ID`, `status`
- GET /api/racks: `Site_ID`
- GET /api/users: `role`
- GET /api/alert-logs: `limit` (default 50)

---

## Role Guard Implementation

Role is read from the JWT `role` claim on every authenticated request.

```
viewer  → Overview, Topology, Sites, Buildings, Floors only (read)
user    → viewer + Rooms, Racks (read) — cannot see Cameras/NVRs/Switches
admin   → full access — all pages, all CRUD, Users management
```

| Endpoint group | admin | user | viewer |
|---|---|---|---|
| GET /api/cameras, /api/nvrs, /api/poe-switches | ✅ | ❌ | ❌ |
| GET /api/racks, /api/hierarchy/tree | ✅ | ✅ | ❌ |
| GET /api/dashboard/summary, /api/alert-logs | ✅ | ✅ | ✅ |
| POST device CRUD (create/update/delete) | ✅ | ❌ | ❌ |
| PATCH /api/cameras/{id}/position | ✅ | ❌ | ❌ |
| GET/POST /api/users/* | ✅ | ❌ | ❌ |

Return 403 for any role mismatch — never return a broken page.

---

## Database Schema Key Points

| Table | Primary Key | Notes |
|---|---|---|
| Cameras | id (int, auto) | position_x/y not yet returned by GET (pending) |
| NVRs | NVR_ID (string) | ip_internet = ETH1 (core), ip_cctv = ETH2 (camera network) |
| PoeSwitches | SW_ID (string) | poe_used_w drives rack power_kw aggregation |
| Racks | Rack_ID (string) | u_position null for most devices — frontend auto-assigns |
| Users | User_ID (int, auto) | Passwords hashed (bcrypt) |
| AlertLogs | id (int, auto) | resolved_at IS NULL = active alert |
| PingLogs | id (int, auto) | Populated by scheduled SQL Server Agent job |

---

## Common Reviewer Questions — Suggested Answers

**Q: Why does GET /api/cameras not return position_x/y even though PATCH stores it?**
> The position columns exist in the DB and PATCH writes them successfully. The GET projection (SELECT statement / EF projection) was not updated to include them in R4 — this was a known omission flagged in the R4 reply. Frontend works around this with auto-grid placement on first load. If needed, add `position_x, position_y` to the CamerasController GET query and re-run.

**Q: How does the rack status aggregation work?**
> The GET /api/racks query JOINs racks with their NVRs and switches, then computes aggregate status as the worst status across all devices: if any device is "offline" the rack is "offline", else if any is "warning" the rack is "warning", else "online".

**Q: How are ping logs generated — is there a real ping service?**
> Currently the ping_logs table is populated by a SQL Server Agent scheduled job that runs `EXEC sp_executeSQL` to call an ICMP ping helper stored procedure (or a CLR function, depending on SQL Server config). For demo purposes the table may be pre-seeded with mock data.

**Q: What happens if a JWT expires mid-session?**
> The frontend checks token expiry on each request. If the API returns 401, Axios interceptor clears localStorage and redirects to the login page. No refresh token is implemented — user re-authenticates.

**Q: Why is the floor plan image served as a binary blob, not a static file URL?**
> The image endpoint requires `Authorization: Bearer` header so unauthenticated users cannot access floor plan images directly. If images were served as static files (e.g., from wwwroot), any URL would be publicly accessible without a token.

**Q: Why does Create take an array body?**
> Allows bulk import without a separate batch endpoint. All create payloads are wrapped in `[{...}]` even for single records — this is consistent across all device types.

---

## Known Issues / Accepted Limitations

| Issue | Status |
|---|---|
| GET /api/cameras does not return position_x/y | Pending — columns exist in DB, projection not updated |
| rack_unit (u_position) is null for most devices | Accepted — frontend auto-assigns visual positions |
| No refresh token endpoint | Accepted — 8-hour sessions cover full working day |
| PingLogs may be pre-seeded with mock data | Demo only — real ping service requires SQL CLR or external process |
| No pagination on GET endpoints | Accepted — dataset size is bounded (single-org intranet) |
| POST /delete/{id} is non-standard | Legacy convention — consistent across all controllers |

---

## If Reviewer Asks to See Code

Key files to show:
- `Controllers/AuthController.cs` — JWT generation + role claim setup
- `Controllers/CamerasController.cs` — GET filter pattern + PATCH position endpoint
- `Controllers/RacksController.cs` — SQL JOIN aggregation (used_units, power_kw, status)
- `Controllers/HierarchyController.cs` — nested DTO construction (sites → buildings → floors)
- `Program.cs` — JWT middleware + CORS policy setup
- `appsettings.json` — connection string + JWT config structure

---

*Backend Team: Ran | Frontend: Claude Sonnet 4.6 | 2026-05-28*
