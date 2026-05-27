# BNO_Survei_MonitorAPI — Backend Documentation

> **Purpose of this file:** This document is intended to give any developer or AI assistant full context to understand, maintain, and extend the backend without needing to re-investigate the codebase from scratch.

---

## Table of Contents
1. [Project Overview](#project-overview)
2. [Technology Stack](#technology-stack)
3. [Project Structure](#project-structure)
4. [Database Schema](#database-schema)
5. [API Routes](#api-routes)
6. [Code Patterns](#code-patterns)
7. [Problems Encountered & Solutions](#problems-encountered--solutions)
8. [Bruno API Collection](#bruno-api-collection)
9. [Current State & Limitations](#current-state--limitations)
10. [Future Development Notes](#future-development-notes)

---

## Project Overview

**BNO_Survei_MonitorAPI** is the backend REST API for the **SSM (Survei Monitor)** system — a web application for auditing and monitoring CCTV infrastructure across multiple sites.

The system tracks:
- Physical hierarchy: Sites → Buildings → Floors → Rooms → Racks
- Network devices: PoE Switches, NVRs (Network Video Recorders)
- CCTV Cameras (placed on floor plans)
- Users, audit logs, sync logs, ping logs, alert logs

> **Note:** At this stage the backend contains only the database schema and CRUD API endpoints. There is no business logic, authentication middleware, or front-end integration yet. The SQL schema defines what data will eventually be collected — many columns may be empty until the survey/import process populates them.

---

## Technology Stack

| Component | Technology |
|---|---|
| Framework | ASP.NET Web API (MVC 5, .NET Framework 4.8) |
| Language | C# |
| Database | SQL Server (SSM_DB) |
| ORM | None — raw ADO.NET (`SqlConnection`, `SqlCommand`) |
| JSON Serialization | Newtonsoft.Json |
| IDE | Visual Studio (classic `.csproj`, not SDK-style) |
| API Testing | Bruno (`.yml` collection files) |
| IIS | IIS Express, port `44342` (HTTPS) |

---

## Project Structure

```
C:\ai-playground\API\
│
├── SSM_schema_v2.sql                    ← Full SQL Server schema (run once on SSM_DB)
├── BACKEND.md                           ← This file
├── INSTRUCTIONS.md                      ← Original task instructions
│
├── BNO_Survei_MonitorAPI\
│   └── BNO_Survei_MonitorAPI\
│       ├── BNO_Survei_MonitorAPI.csproj ← Project file (all .cs files must be listed here)
│       ├── Web.config                   ← Connection string "CN" lives here
│       │
│       ├── ConnectionDB\
│       │   └── ConnectionDB.cs          ← Static helper that reads "CN" from Web.config
│       │
│       ├── Models\                      ← One model per SQL table (13 total)
│       │   ├── sitesModel.cs
│       │   ├── buildingsModel.cs
│       │   ├── floorsModel.cs
│       │   ├── roomsModel.cs
│       │   ├── racksModel.cs
│       │   ├── poeSwitchesModel.cs
│       │   ├── nvrsModel.cs
│       │   ├── camerasModel.cs
│       │   ├── usersModel.cs
│       │   ├── syncLogsModel.cs
│       │   ├── auditLogsModel.cs
│       │   ├── pingLogsModel.cs
│       │   └── alertLogsModel.cs
│       │
│       └── Controllers\                 ← One controller per model (13 total)
│           ├── sitesController.cs
│           ├── buildingsController.cs
│           ├── floorsController.cs
│           ├── roomsController.cs
│           ├── racksController.cs
│           ├── poeSwitchesController.cs
│           ├── nvrsController.cs
│           ├── camerasController.cs
│           ├── usersController.cs
│           ├── syncLogsController.cs
│           ├── auditLogsController.cs
│           ├── pingLogsController.cs
│           └── alertLogsController.cs
│
└── bruno\                               ← Bruno API test collection
    ├── Sites\
    ├── buildings\
    ├── floors\
    ├── rooms\
    ├── racks\
    ├── poeSwitches\
    ├── nvrs\
    ├── cameras\
    ├── users\
    ├── syncLogs\
    ├── auditLogs\
    ├── pingLogs\
    └── alertLogs\
```

---

## Database Schema

Database name: **SSM_DB**  
Full schema file: `SSM_schema_v2.sql`

### Section 1 — Hierarchy Tables

#### `sites`
| Column | Type | Nullable | Notes |
|---|---|---|---|
| Site_ID | NVARCHAR(10) | NOT NULL | **PK** — natural key, typed by staff |
| name | NVARCHAR(100) | NOT NULL | |
| code | NVARCHAR(20) | NULL | UNIQUE |
| location | NVARCHAR(255) | NULL | |
| description | NVARCHAR(500) | NULL | |
| created_at | DATETIME2(7) | NOT NULL | auto |
| updated_at | DATETIME2(7) | NOT NULL | auto |

#### `buildings`
| Column | Type | Nullable | Notes |
|---|---|---|---|
| Building_ID | NVARCHAR(10) | NOT NULL | **PK** |
| Site_ID | NVARCHAR(10) | NOT NULL | **FK** → sites |
| name | NVARCHAR(100) | NOT NULL | |
| code | NVARCHAR(20) | NULL | UNIQUE per site |
| floor_count | INT | NULL | default 1 |
| description | NVARCHAR(500) | NULL | |
| image_data | NVARCHAR(MAX) | NULL | base64 image |
| image_type | NVARCHAR(50) | NULL | mime type |
| note | NVARCHAR(500) | NULL | |
| created_at / updated_at | DATETIME2(7) | NOT NULL | auto |

#### `floors`
| Column | Type | Nullable | Notes |
|---|---|---|---|
| Floor_ID | NVARCHAR(10) | NOT NULL | **PK** |
| Site_ID | NVARCHAR(10) | NOT NULL | **FK** → sites |
| Building_ID | NVARCHAR(10) | NOT NULL | **FK** → buildings (CASCADE) |
| floor_number | INT | NULL | |
| name | NVARCHAR(50) | NULL | |
| function | NVARCHAR(100) | NULL | reserved SQL keyword — use `[function]` in queries |
| has_cctv | BIT | NULL | default 0 |
| image_data / image_type | NVARCHAR | NULL | floor plan image |
| note | NVARCHAR(500) | NULL | |

#### `rooms`
| Column | Type | Nullable | Notes |
|---|---|---|---|
| Room_ID | NVARCHAR(20) | NOT NULL | **PK** |
| Site_ID, Building_ID, Floor_ID | NVARCHAR | NOT NULL | **FK** → hierarchy |
| name | NVARCHAR(100) | NOT NULL | |
| type | NVARCHAR(50) | NULL | CHECK: server/network/office/power/other |
| has_nvr / has_sw | BIT | NULL | flags |
| width_m / length_m | DECIMAL(6,2) | NULL | physical dimensions |
| x, y, w, h | INT | NULL | SVG drag-drop position on floor plan |
| image_data / image_type | NVARCHAR | NULL | |
| note | NVARCHAR(500) | NULL | |

#### `racks`
| Column | Type | Nullable | Notes |
|---|---|---|---|
| Rack_ID | NVARCHAR(20) | NOT NULL | **PK** |
| Site_ID, Building_ID, Floor_ID, Room_ID | NVARCHAR | NOT NULL | **FK** → hierarchy |
| name | NVARCHAR(50) | NOT NULL | |
| total_units | INT | NOT NULL | default 42 |
| units_per_u | TINYINT | NOT NULL | default 3 (micro-slots per U) |
| brand / model | NVARCHAR(50) | NULL | |
| max_power_w | INT | NULL | |
| image_data / image_type / note | NVARCHAR | NULL | |

---

### Section 2 — Device Tables

#### `poe_switches`
| Column | Type | Nullable | Notes |
|---|---|---|---|
| SW_ID | NVARCHAR(20) | NOT NULL | **PK** |
| Site_ID…Rack_ID | NVARCHAR | NOT NULL | **FK** → full hierarchy |
| u_position | INT | NULL | U slot number, 1-based from rack bottom; NULL = not yet installed |
| u_subposition | TINYINT | NULL | micro-slot within that U (1–3); NULL = occupies full U; CHECK 1–3 |
| u_size | TINYINT | NULL | height in U (default 1); e.g. 2U device = 2 |
| device_name | NVARCHAR(100) | NOT NULL | UNIQUE |
| switch_type | NVARCHAR(20) | NULL | CHECK: PoE/Non-PoE/Core/Aggregation |
| brand, model, serial_no, mac_address, os_version | NVARCHAR | NULL | UNIQUE: serial, mac |
| ip_address, vlan_id, subnet_mask, gateway | various | NULL | |
| total_ports, poe_ports, poe_budget_w, poe_used_w | INT | NULL | |
| uplink_port | NVARCHAR(100) | NULL | |
| status | NVARCHAR(20) | NULL | CHECK: online/offline/warning/unknown |
| fail_count | INT | NULL | default 0 |
| last_seen | DATETIME2(7) | NULL | |
| notes | NVARCHAR(MAX) | NULL | |

#### `nvrs`
| Column | Type | Nullable | Notes |
|---|---|---|---|
| NVR_ID | NVARCHAR(20) | NOT NULL | **PK** |
| Site_ID…Rack_ID | NVARCHAR | NOT NULL | **FK** → full hierarchy |
| u_position | INT | NULL | U slot number, 1-based from rack bottom; NULL = not yet installed |
| u_subposition | TINYINT | NULL | micro-slot within that U (1–3); NULL = occupies full U; CHECK 1–3 |
| u_size | TINYINT | NULL | height in U (default 1); e.g. 2U device = 2 |
| device_name | NVARCHAR(100) | NOT NULL | UNIQUE |
| brand, model, serial_no, mac_address, os_version | NVARCHAR | NULL | |
| ip_internet | NVARCHAR(20) | NULL | uplink IP |
| ip_cctv | NVARCHAR(20) | NULL | CCTV LAN IP |
| vlan_id, subnet_mask, gateway | various | NULL | |
| total_channels, active_channels | INT | NULL | |
| hdd_total_tb | DECIMAL(6,2) | NULL | |
| hdd_used_pct | DECIMAL(5,2) | NULL | CHECK: 0–100 |
| recording_res | NVARCHAR(20) | NULL | |
| retention_days | INT | NULL | |
| record_status | NVARCHAR(20) | NULL | CHECK: normal/warning/error/stopped |
| status | NVARCHAR(20) | NULL | CHECK: online/offline/warning/unknown |
| fail_count | INT | NULL | default 0 |
| last_seen | DATETIME2(7) | NULL | |
| notes | NVARCHAR(MAX) | NULL | |

#### `cameras`
| Column | Type | Nullable | Notes |
|---|---|---|---|
| id | INT IDENTITY | NOT NULL | **PK** (auto-increment) |
| Site_ID, Building_ID, Floor_ID | NVARCHAR | NOT NULL | **FK** — cameras link to FLOOR, not room/rack |
| device_name | NVARCHAR(100) | NOT NULL | UNIQUE |
| brand, model, serial_no, mac_address | NVARCHAR | NULL | UNIQUE: serial, mac |
| camera_type, resolution, firmware_version | NVARCHAR | NULL | |
| ip_address, vlan_id, subnet_mask, gateway | various | NULL | |
| NVR_CH | NVARCHAR(30) | NULL | natural key e.g. "NVR9_CH1" — UNIQUE |
| SW_ID | NVARCHAR(20) | NULL | **FK** → poe_switches (SET NULL on delete) |
| poe_port_number | INT | NULL | |
| NVR_ID | NVARCHAR(20) | NULL | **FK** → nvrs (SET NULL on delete) |
| nvr_channel | INT | NULL | |
| install_location | NVARCHAR(255) | NULL | free-text location description |
| status | NVARCHAR(20) | NULL | CHECK: online/offline/warning/unknown |
| fail_count | INT | NULL | default 0 |
| last_seen | DATETIME2(7) | NULL | |
| notes | NVARCHAR(MAX) | NULL | |

#### U-position semantics (NVR + PoE Switch only)

Each rack has `units_per_u TINYINT DEFAULT 3` — defines the number of mounting holes per U (CHECK: 1–12).

| Field | Meaning |
|---|---|
| `u_position` | U slot number counted from the bottom of the rack (1-based) |
| `u_subposition` | Vertical mounting-hole within that U (1=bottom, 2=middle, 3=top); NULL = hole not recorded |
| `u_size` | Number of U slots the device occupies (default 1; 2U device = 2) |

All 3 fields are nullable — NULL means the device has not yet been installed into a rack.

Sub-position enables finer airflow gap planning: instead of wasting a full 1U (≈ 44 mm) for clearance, a single hole gap (≈ 14 mm) is sufficient.

```
Rack front view — Y-axis is vertical, U1 at the bottom
Each U has 3 mounting holes stacked vertically (sub1=bottom, sub2=middle, sub3=top)

  ┌──────────────────────────────┐
  │      [sub3] ─────────────── │ ↑
  │ U5   [sub2] ── Switch A ─── │  (u_pos=5, u_sub=2, u_size=1)
  │      [sub1] ─────────────── │ ↓
  ├──────────────────────────────┤  ← airflow gap ~14 mm
  │      [sub3] ─────────────── │ ↑
  │ U4   [sub2] ─────────────── │  NVR-01 spans U3–U4
  │      [sub1] ─── NVR-01 ──── │ ↓  (u_pos=3, u_sub=1, u_size=2)
  ├──────────────────────────────┤
  │      [sub3] ─── NVR-01 ──── │ ↑
  │ U3   [sub2] ─── NVR-01 ──── │
  │      [sub1] ─── NVR-01 ──── │ ↓
  ├──────────────────────────────┤
  │      [sub3] ─────────────── │ ↑
  │ U2   [sub2] ── Switch B ─── │  (u_pos=2, u_sub=2, u_size=1)
  │      [sub1] ─────────────── │ ↓
  └──────────────────────────────┘ (floor)
```

| Device | u_position | u_subposition | u_size |
|---|---|---|---|
| Switch A | 5 | 2 | 1 |
| NVR-01 | 3 | 1 | 2 |
| Switch B | 2 | 2 | 1 |

> **Note:** The `u_subposition` CHECK constraint is hardcoded to `BETWEEN 1 AND 3` on device tables.
> If a rack ever uses `units_per_u > 3`, the constraint must be updated accordingly.

Indexes used for the rack diagram view:
```sql
IX_nvrs_rack_slot    ON nvrs         (Rack_ID, u_position, u_subposition)
IX_sw_rack_slot      ON poe_switches (Rack_ID, u_position, u_subposition)
```

---

### Section 3 — Auth + Audit + Monitoring

#### `users`
| Column | Type | Nullable | Notes |
|---|---|---|---|
| User_ID | INT IDENTITY | NOT NULL | **PK** |
| username | NVARCHAR(100) | NOT NULL | UNIQUE |
| pw_hash | NVARCHAR(255) | NOT NULL | bcrypt hash |
| display_name | NVARCHAR(200) | NULL | |
| role | NVARCHAR(10) | NOT NULL | CHECK: admin/user/viewer |
| is_active | BIT | NOT NULL | default 1 |
| last_login | DATETIME2(7) | NULL | |

Seed users (hashes in `SSM_schema_v2.sql`): `admin`, `ssm_user`, `viewer`

#### `sync_logs`
| Column | Type | Notes |
|---|---|---|
| id | INT IDENTITY | **PK** |
| device_type | NVARCHAR(20) | CHECK: camera/nvr/poe_switch |
| device_id | NVARCHAR(50) | mixed PK types stored as string |
| synced_by | INT | **FK** → users (nullable) |
| sync_type, fields_updated (JSON), status, message | NVARCHAR | |

#### `audit_logs`
| Column | Type | Notes |
|---|---|---|
| id | INT IDENTITY | **PK** |
| user_id | INT | **FK** → users (nullable) |
| action | NVARCHAR(20) | CHECK: INSERT/UPDATE/DELETE |
| table_name, record_id | NVARCHAR | |
| old_value, new_value | NVARCHAR(MAX) | JSON snapshots |

#### `ping_logs`
| Column | Type | Notes |
|---|---|---|
| id | INT IDENTITY | **PK** |
| device_type | NVARCHAR(20) | CHECK: camera/nvr/poe_switch |
| device_id, ip_address | NVARCHAR | |
| is_alive | BIT | NOT NULL |
| latency_ms | DECIMAL(8,2) | NULL |
| pinged_at | DATETIME2(7) | auto |

#### `alert_logs`
| Column | Type | Notes |
|---|---|---|
| id | INT IDENTITY | **PK** |
| device_type, device_id, device_name | NVARCHAR | |
| brand, ip_address | NVARCHAR | NULL |
| site_name, building_name, floor_name, room_name | NVARCHAR | denormalized for fast alert display |
| poe_switch_name, poe_port | NVARCHAR/INT | NULL |
| alert_type | NVARCHAR(20) | CHECK: offline/hdd_warning/hdd_full/back_online |
| message | NVARCHAR(500) | NULL |
| webhook_sent | BIT | default 0 |
| resolved_at | DATETIME2(7) | NULL — NULL means still active |
| alerted_at / updated_at | DATETIME2(7) | auto |

---

### Views (read-only, in SQL schema)

| View | Purpose |
|---|---|
| `vw_camera_full_path` | Camera + full site/building/floor/NVR/switch path |
| `vw_nvr_full_path` | NVR + full hierarchy path |
| `vw_switch_full_path` | Switch + full hierarchy path |
| `vw_dashboard_summary` | Per-site rollup counts (cameras, NVRs, switches) |
| `vw_unresolved_alerts` | Active alerts only (resolved_at IS NULL) |

---

## API Routes

Base URL: `https://localhost:44342`  
All routes use attribute routing (`[Route("api/...")]`).  
**GET** = retrieve all rows. **POST** = insert/update/delete (no PUT/DELETE HTTP verbs used).

### Hierarchy

| Table | GET | SAVE (POST) | UPDATE (POST) | DELETE (POST) |
|---|---|---|---|---|
| sites | `/api/Getsites` | `/api/Savesites` | `/api/Updatesites/{Site_ID}` | `/api/Deletesites/{Site_ID}` |
| buildings | `/api/Getbuildings` | `/api/Savebuildings` | `/api/Updatebuildings/{Building_ID}` | `/api/Deletebuildings/{Building_ID}` |
| floors | `/api/Getfloors` | `/api/Savefloors` | `/api/Updatefloors/{Floor_ID}` | `/api/Deletefloors/{Floor_ID}` |
| rooms | `/api/Getrooms` | `/api/Saverooms` | `/api/Updaterooms/{Room_ID}` | `/api/Deleterooms/{Room_ID}` |
| racks | `/api/Getracks` | `/api/Saveracks` | `/api/Updateracks/{Rack_ID}` | `/api/Deleteracks/{Rack_ID}` |

### Devices

| Table | GET | SAVE (POST) | UPDATE (POST) | DELETE (POST) |
|---|---|---|---|---|
| poe_switches | `/api/GetpoeSwitches` | `/api/SavepoeSwitches` | `/api/UpdatepoeSwitches/{SW_ID}` | `/api/DeletepoeSwitches/{SW_ID}` |
| nvrs | `/api/Getnvrs` | `/api/Savenvrs` | `/api/Updatenvrs/{NVR_ID}` | `/api/Deletenvrs/{NVR_ID}` |
| cameras | `/api/Getcameras` | `/api/Savecameras` | `/api/Updatecameras/{id}` | `/api/Deletecameras/{id}` |

### Auth + Logs

| Table | GET | SAVE (POST) | UPDATE (POST) | DELETE (POST) |
|---|---|---|---|---|
| users | `/api/Getusers` | `/api/Saveusers` | `/api/Updateusers/{User_ID}` | `/api/Deleteusers/{User_ID}` |
| sync_logs | `/api/GetsyncLogs` | `/api/SavesyncLogs` | `/api/UpdatesyncLogs/{id}` | `/api/DeletesyncLogs/{id}` |
| audit_logs | `/api/GetauditLogs` | `/api/SaveauditLogs` | `/api/UpdateauditLogs/{id}` | `/api/DeleteauditLogs/{id}` |
| ping_logs | `/api/GetpingLogs` | `/api/SavepingLogs` | `/api/UpdatepingLogs/{id}` | `/api/DeletepingLogs/{id}` |
| alert_logs | `/api/GetalertLogs` | `/api/SavealertLogs` | `/api/UpdatealertLogs/{id}` | `/api/DeletealertLogs/{id}` |

### Route behaviour notes
- **SAVE** accepts `List<Model>` in the request body (bulk insert, JSON array)
- **UPDATE** accepts a single `Model` object in the request body
- **DELETE** takes the PK in the URL path only, no body needed
- All responses return `{ success: true, ... }` on success or HTTP 400/404/500 on failure
- `updated_at` is set to `SYSUTCDATETIME()` automatically on every UPDATE

---

## Code Patterns

### Model pattern (`Models/sitesModel.cs`)
```csharp
namespace TestAPBNO_Survei_MonitorAPI.Models
{
    public class sitesModel
    {
        [JsonProperty(PropertyName = "Site_ID")]
        public string Site_ID { get; set; }

        [JsonProperty(PropertyName = "name")]
        public string name { get; set; }
        // ... all columns as properties
    }
}
```
- Namespace is `TestAPBNO_Survei_MonitorAPI.Models` (note: different from assembly name)
- Uses `[JsonProperty]` on every property
- Nullable SQL columns → nullable C# types (`int?`, `bool?`, `decimal?`)
- `DATETIME2` columns stored as `string` (returned as-is from reader)
- `BIT` NOT NULL → `bool`, `BIT` NULL → `bool?`

### Controller pattern (`Controllers/buildingsController.cs`)
```csharp
namespace BNO_Survei_MonitorAPI.Controllers
{
    public class buildingsController : ApiController
    {
        [Route("api/Getbuildings")] [HttpGet]
        public IHttpActionResult Getbuildings() { ... }

        [Route("api/Savebuildings")] [HttpPost]
        public IHttpActionResult Savebuildings([FromBody] List<buildingsModel> modelList) { ... }

        [Route("api/Updatebuildings/{Building_ID}")] [HttpPost]
        public IHttpActionResult Updatebuildings(string Building_ID, [FromBody] buildingsModel model) { ... }

        [Route("api/Deletebuildings/{Building_ID}")] [HttpPost]
        public IHttpActionResult Deletebuildings(string Building_ID) { ... }
    }
}
```
- Inherits `ApiController` (Web API 2)
- All DB access via `using (SqlConnection con = new SqlConnection(ConnectionDB.ConnectionStringCN))`
- DBNull handling: `reader["col"] == DBNull.Value ? null : reader["col"].ToString()`
- Private `AddParameters(SqlCommand, Model)` helper reused by Save and Update
- Error handling: `catch (SqlException ex)` + `catch (Exception ex)` both return `InternalServerError(ex)`

### Connection string
Located in `Web.config`:
```xml
<connectionStrings>
  <add name="CN" connectionString="..." providerName="System.Data.SqlClient" />
</connectionStrings>
```
Read by `ConnectionDB.ConnectionStringCN` static property.

---

## Problems Encountered & Solutions

### 1. `sitesController.cs` had wrong SQL (old project leftover)
**Problem:** `sitesController.cs` was copied from a previous project and still referenced `PD_MDepartments` table instead of `sites`.  
**Solution:** Rewrote the entire controller with correct SQL targeting the `sites` table.  
**Lesson:** Always verify controller SQL matches the intended table, especially when files are copied from other projects.

### 2. Models and Controllers not visible in Visual Studio
**Problem:** All 12 model and controller `.cs` files existed on disk but did not appear in Visual Studio's Solution Explorer.  
**Root cause:** The old-style `.csproj` (non-SDK format, .NET Framework) requires every `.cs` file to be explicitly listed as `<Compile Include="..." />`. Files on disk but not in `.csproj` are invisible to the compiler and IDE.  
**Solution:** Added all 12 missing `<Compile>` entries to `BNO_Survei_MonitorAPI.csproj`.  
**Lesson:** In .NET Framework Web API projects, always add new files through Visual Studio "Add → New Item" so they are auto-registered in `.csproj`. If adding files manually (e.g., via CLI/AI), manually edit `.csproj` to include them.

### 3. `[function]` column name is a reserved SQL keyword
**Problem:** The `floors` table has a column named `function` which is a reserved keyword in SQL Server.  
**Solution:** Wrap it in square brackets in all SQL queries: `[function]`.  
**Affected file:** `floorsController.cs` UPDATE query.

### 4. Bruno collection "not valid" error
**Problem:** Created a root `opencollection.yml` in the `bruno/` folder AND individual `opencollection.yml` files in each table subfolder. Bruno does not support nested collections, so the root file caused "collection not valid" errors.  
**Solution:** Deleted the root `opencollection.yml`. Also added `bruno.json` to each subfolder as a fallback since Bruno accepts either format.  
**Lesson:** Each folder with `opencollection.yml` or `bruno.json` is treated as a standalone collection. Do not nest collection definition files.

### 5. Mixed PK types across tables
**Problem:** `sync_logs`, `audit_logs`, `ping_logs`, `alert_logs` use `device_id NVARCHAR(50)` to store PKs from different device tables (cameras use `int id`, switches/NVRs use `NVARCHAR`).  
**Solution:** Store all device IDs as `NVARCHAR(50)` in log tables. Controller code handles this transparently.

---

## Bruno API Collection

Located at: `C:\ai-playground\API\bruno\`  
Each table has its own subfolder containing 4 request files:

```
{table}/
  bruno.json          ← collection definition
  opencollection.yml  ← alternative collection definition
  GET.yml             ← GET all records
  SAVE.yml            ← POST bulk insert
  UPDATE.yml          ← POST update by PK
  DELETE.yml          ← POST delete by PK
```

Open in Bruno: **Open Collection** → select any table folder (e.g., `bruno/buildings/`)

---

## Current State & Limitations

> Last updated: 2026-05-26

| Area | Status |
|---|---|
| SQL Schema | Complete — 13 tables, 5 views, indexes, constraints |
| Models (C#) | Complete — 13 models + `deviceSearchModel` (14 total) |
| Controllers (C#) | Complete — 13 CRUD controllers + `devicesController` (14 total) |
| GET filtering | Implemented — all hierarchy + device GET endpoints accept query params (see table below) |
| Unified device search | Implemented — `/api/GetDevices` searches cameras/nvrs/switches in one call |
| Authentication | Not implemented — no JWT/session middleware |
| Authorization | Not implemented — all endpoints publicly accessible |
| Input validation | Minimal — only checks required PK fields are not empty |
| Business logic | None — pure CRUD only |
| Error responses | Generic — returns raw SqlException message |
| Pagination | Not implemented — GET returns all rows |
| Bruno test bodies | URLs only — no request body samples in `.yml` files |

### GET Filter Parameters (implemented)

| Endpoint | Query params supported |
|---|---|
| `/api/GetSites` | `?Site_ID=` |
| `/api/GetBuildings` | `?Site_ID=`, `?Building_ID=` |
| `/api/GetFloors` | `?Building_ID=`, `?Floor_ID=` |
| `/api/GetRooms` | `?Floor_ID=`, `?Room_ID=` |
| `/api/GetRacks` | `?Room_ID=`, `?Rack_ID=` |
| `/api/GetCameras` | `?Site_ID=`, `?Floor_ID=`, `?status=`, `?id=` |
| `/api/GetNvrs` | `?Site_ID=`, `?Rack_ID=`, `?status=`, `?NVR_ID=` |
| `/api/GetPoeSwitches` | `?Site_ID=`, `?Rack_ID=`, `?status=`, `?SW_ID=` |
| `/api/GetDevices` | `?device_type=` (camera/nvr/switch, comma-separated), `?Site_ID=`, `?Building_ID=`, `?Floor_ID=`, `?device_name=` (LIKE), `?ip_address=` (LIKE), `?status=` |

All filters use `WHERE 1=1` + conditional `AND` appending — omitting a param returns all rows.

---

## Future Development Notes

### If adding authentication
- Add JWT middleware to `WebApiConfig.cs`
- All controllers currently have no `[Authorize]` attributes — add them after auth is wired up
- `users` table already has `pw_hash` (bcrypt) and `role` (admin/user/viewer) columns ready

### If adding business logic / services
- Follow the existing raw ADO.NET pattern OR introduce a service layer
- Do NOT introduce Entity Framework without migrating all controllers — mixing both will cause issues
- The `sync_logs` and `audit_logs` tables are designed to be written to by background jobs/services

### If adding pagination
- Add `?page=1&pageSize=50` query params to GET endpoints
- Use `OFFSET / FETCH NEXT` in SQL Server queries

### If the front-end needs more filtered queries
- Filter params already exist on all hierarchy + device GET endpoints (see section 9)
- To add more params: follow the `WHERE 1=1` + conditional `AND` pattern already in use

### Important design decisions to preserve
- **Cameras link to Floor, not Room/Rack** — cameras are placed on floor SVG plans, not inside racks
- **NVRs and Switches have Rack_ID NOT NULL** — standalone (non-rack) devices are added via the web app later
- **`alert_logs.resolved_at IS NULL`** = active alert; setting it resolves the alert
- **Natural keys** (e.g., `Site_ID`, `Building_ID`) are typed by survey staff in Excel — they are not auto-generated
- **`units_per_u`** in racks represents micro-slots per U (Susan D2 spec) — default 3
