# MEGA CONTEXT — SSM Project (Single-File Briefing)

> **For the new AI chat:** Read this file end-to-end. It is **self-contained** —
> you do not need any other file to continue the work. The user (Susan / Ran)
> wants you to pick up immediately and ask which task to tackle next.
>
> **Last updated:** 2026-05-19 (natural-key PK realignment, v3 workbook)
> **Canonical schema file:** `db/SSM_schema_v2.sql`
> **Canonical workbook:** `templates/template_v3.xlsx` (replaces v2 — has new PK columns)

---

## TABLE OF CONTENTS

0. **Project Purpose & Goals** ← start here
1. How to talk to the user
2. Project at a glance
3. Locked decisions (do not redesign)
4. Data model — key concepts
5. Full SQL schema (table summary)
6. Excel template structure (10 sheets, v3)
7. Latest changes (this session — natural-key PKs)
8. Manual cleanup the user still needs to do
9. Pending tasks — pick one
10. Quick checklist before responding
11. Quick file map

---

## 0. PROJECT PURPOSE & GOALS

### Why this project exists

Susan is building **SSM v1.0** — a monitoring web app for CCTV cameras, NVRs, and
PoE switches on an air-gapped LAN. **The DB and survey workbook are inputs to
that web app.** Field staff fill the survey workbook with real device inventory;
that data gets imported into MS SQL Server; the web app then reads from SQL.

### The end-to-end vision

```
   ┌──────────────────┐    Python      ┌────────────────┐     reads       ┌──────────────┐
   │ template_v3.xlsx │ ─── importer ─►│  MS SQL Server │ ◄──────────────│  SSM web app │
   │  (survey staff)  │   (NEXT phase) │     SSM_DB     │  + writes new   │ (React/FastAPI)│
   └──────────────────┘                └────────────────┘    devices via  └──────────────┘
                                              ▲                   web UI
                                              │
                                              └─── after first import, the web app
                                                   becomes the source of truth and can
                                                   add/edit any device.
```

### Concrete goal for the importer (Phase 2 — coming next)

Build `scripts/ssm_import.py` that:

1. **Auto-maps Excel columns → SQL columns by header name.**
   The Excel headers are intentionally close to SQL column names so the
   importer can mostly do header-name matching with a small alias table for
   exceptions (e.g. `"Site_ID (PK)"` → `Site_ID`, `"IP Address"` → `ip_address`).

2. **Resolves cross-sheet references by natural-key PKs.**
   Every layer's PK is a string code typed by the survey staff:
   `Site_ID`, `Building_ID`, `Floor_ID`, `Room_ID`, `Rack_ID`, `NVR_ID`, `SW_ID`.
   Cameras additionally use `NVR_CH` (e.g. `NVR9_CH1`) as an alternate key.
   The importer never invents IDs — it inserts the natural keys directly.

3. **Extracts critical sync fields from Excel into SQL.**
   These three columns drive device sync from the web app's "device sync modal"
   and from the future `worker.py` (Triple-Ping):
   - `ip_address` (camera/switch) and `ip_internet` + `ip_cctv` (NVR has 2 ports)
   - `mac_address`
   - `serial_no` (S/N)
   The importer **must** validate IP regex, MAC regex, and uniqueness of S/N
   before inserting. Sync from Excel → SQL is the **primary** purpose of this
   tool; later sync from web app → SQL is handled by the existing FastAPI
   endpoints.

4. **Auto-fills system fields** that survey staff should not touch:
   `created_at`, `updated_at`, bcrypt-hashed passwords from `9_Users`, and
   converts `image_path` → `image_data` (base64) + `image_type`.

### What the importer should NOT do

- Do not invent or shift PK codes — if the Excel has `Site_ID = 'HQ'`, that's
  what goes into SQL.
- Do not skip the `9_Users` sheet — those 3 accounts (admin/user/viewer) seed
  the auth layer.
- Do not send any data over the network. The importer runs locally against the
  work-machine SQL Server.

### Auto-fill strategy summary (the "headers or PKs" idea Susan asked for)

| Excel column type | How importer maps it to SQL |
|---|---|
| **Natural-key PK column** (Site_ID, Building_ID, Floor_ID, Room_ID, Rack_ID, NVR_ID, SW_ID) | Direct insert into the matching SQL PK column |
| **FK column** (same column name appearing in a child sheet) | Same value — already aligned by Susan's column-name discipline |
| **Sync-key column** (S/N, MAC, IP) | Validate regex + uniqueness, then insert |
| **System column** (Created, Updated, "(auto)") | Set to `SYSUTCDATETIME()` if blank; respect user value otherwise |
| **Display column** (Name, Note, Brand, Model, etc.) | Direct insert; no transformation |
| **Image Path** column | Read file → base64 → insert into `image_data` + `image_type` |
| **Password (plain)** column | bcrypt hash before insert |

---

## 1. HOW TO TALK TO THE USER

| Rule | Detail |
|---|---|
| Language | **Reply in Thai always.** Even if Susan writes in English. |
| Technical terms | Keep English: PK / FK / schema / view / importer / CHECK constraint. |
| Detail level | Explain *why* before *how*. Susan is here to learn. |
| Style | Friendly + concise. Tables for comparisons. Code blocks must be typed (` ```python `). |
| Destructive ops | Ask before delete / drop / overwrite. |
| Pushback | Tell Susan when she is wrong. No yes-bot behaviour. |
| Refuse | No cloud CDN, online `pip install` on production box, nothing needing internet on the air-gapped LAN. |

User info:

| Field | Value |
|---|---|
| Name | Susan (a.k.a. Ran) |
| Email | runsyu37@gmail.com |
| GitHub | runsyu37 |
| Role | Networking & AI intern, Thailand |
| Timezone | Asia/Bangkok (UTC+7) |

---

## 2. PROJECT AT A GLANCE

**SSM v1.0 (Surveillance Smart-Monitor)** — web app monitoring CCTV cameras,
NVRs, and PoE switches on an **air-gapped LAN** (no internet on production).

- **Stack:** React 18 + Vite + FastAPI + SQLite (dev) / MS SQL Server (prod).
- **Hierarchy:** Site → Building → Floor → { Rooms with racks } | Cameras on floor plan
- **Devices split into 3 tables:** `cameras`, `nvrs`, `poe_switches`.
- **Sync keys:** `serial_no` (UNIQUE), `mac_address` (UNIQUE), `ip_address`.
- **Auth roles:** `admin` / `user` / `viewer`.
- **Hard deadline:** ~late July 2026.

**Phase status:**

| Phase | Description | Status |
|---|---|---|
| 1   | Excel survey template + SQL schema design | ✅ Complete |
| 1.5 | Realign Excel ↔ SQL columns (incl. natural-key PKs) | ✅ Complete (this session) |
| 2   | Python importer `ssm_import.py` + SQL Server testing | ⏳ Pending |

---

## 3. LOCKED DECISIONS (do not redesign)

| # | Decision | Rationale |
|---|---|---|
| D1  | Devices split into 3 tables (cameras / nvrs / poe_switches) | Sync key is `ip + s/n + mac` per device type |
| D2  | U sub-position: `u_position INT` + `u_subposition TINYINT (1..3)` + `u_size TINYINT` | Sub-slot precision + multi-U height |
| D3  | `created_at` / `updated_at` auto-filled by importer | Avoids human error per row |
| D4  | 3 roles: `admin` / `user` / `viewer` | Matches existing LoginPage.jsx semantics |
| D5  | `Site_ID` FK on every child table | Building names can repeat across sites |
| D6  | Cameras DO NOT link to Room or Rack — they live on a floor plan | Cameras are wall/ceiling mounted; web computes `map_x/map_y` from floor SVG |
| D7  | `rooms` table = ONLY rooms that contain a rack | Web app audits cameras + supporting gear; non-rack rooms are not modeled |
| D8  | Natural-key PKs for sites/buildings/floors/rooms (NVARCHAR(10)) | Survey staff already type codes (`HQ`, `BLD_A`, …) |
| D9  | NVR has 2 IPs: `ip_internet` (uplink) + `ip_cctv` (LAN to cameras) | Real-world NVRs have two ports — both monitored |
| D10 | Excel `Image Path` → SQL `image_data` + `image_type` (importer base64-encodes) | Air-gapped; no cloud blob storage. 5 MB hard limit |
| **D11** | **Natural-key PKs extended to racks/nvrs/poe_switches** (`Rack_ID`, `NVR_ID`, `SW_ID` — all NVARCHAR(20)) | Matches `template_v3.xlsx` column "Rack_ID (PK)" / "NVR_ID (PK)" / "SW_ID(PK)". Importer can map header → SQL column 1-to-1. |
| **D12** | **Cameras keep `id INT IDENTITY` PK; add `NVR_CH NVARCHAR(30) UNIQUE NULL`** | Camera may be installed but not yet wired to an NVR at survey time. Web app fills `NVR_CH` later. |
| **D13** | **`Rack_ID` is `NOT NULL` on `nvrs` and `poe_switches`** | Non-rack NVRs/switches are added via web app later — out of scope for the importer |
| **D14** | **Excel headers ≈ SQL column names** | Lets the importer do header-name matching with a small alias table. Goal: minimal hand-mapping in Python. |

---

## 4. DATA MODEL — KEY CONCEPTS

### Hierarchy & how cameras fit in

```
sites ──► buildings ──► floors ──┬──► rooms ──► racks ──► nvrs / poe_switches
                                  │              (only rooms with racks)
                                  │
                                  └──► cameras    (on floor plan — web drags them)
```

Cameras link to:
- a `poe_switch.SW_ID` + `poe_port_number` (which port powers them)
- a `nvr.NVR_ID` + `nvr_channel` (which NVR channel records them)

These FKs are resolved by the importer using the natural-key PKs.

### U-position semantics (NVR + PoE Switch only — not cameras)

| Field | Meaning |
|---|---|
| `u_position` | 1-based U number from bottom of rack |
| `u_subposition` | Micro-slot 1, 2, or 3 inside that U (each U has `units_per_u` slots, default 3) |
| `u_size` | How many U the device occupies (default 1, e.g. 2U servers = 2) |

---

## 5. FULL SQL SCHEMA — `db/SSM_schema_v2.sql`

**13 tables, 5 views, 25+ indexes, all FK + CHECK + UNIQUE constraints.**
Run once on a fresh `SSM_DB`. Includes seed users.

### Tables

| Table | PK | Type | Notes |
|---|---|---|---|
| `sites` | `Site_ID` | NVARCHAR(10) | e.g. `HQ` |
| `buildings` | `Building_ID` | NVARCHAR(10) | e.g. `BLD_1`, FK `Site_ID` |
| `floors` | `Floor_ID` | NVARCHAR(10) | e.g. `BLD_1_F_1`, FKs `Site_ID + Building_ID` |
| `rooms` | `Room_ID` | NVARCHAR(10) | e.g. `BLD_1_F1_SRV01`, 3 FKs |
| **`racks`** | **`Rack_ID`** | **NVARCHAR(20)** | e.g. `BLD_1_F1_R1`, 4 FKs |
| **`poe_switches`** | **`SW_ID`** | **NVARCHAR(20)** | 5 FKs (`Rack_ID NOT NULL`), `switch_type` (PoE/Non-PoE/Core/Aggregation), `u_position+u_subposition+u_size`, `ip_address`, `subnet_mask`, `gateway`, port + PoE stats |
| **`nvrs`** | **`NVR_ID`** | **NVARCHAR(20)** | 5 FKs (`Rack_ID NOT NULL`), 2 IPs (`ip_internet`+`ip_cctv`), HDD %, retention, record_status |
| **`cameras`** | `id INT IDENTITY` + `NVR_CH NVARCHAR(30) UNIQUE` | mixed | **3 FKs only (Site/Building/Floor)** — no Room/Rack. FKs to `poe_switches.SW_ID` + `nvrs.NVR_ID`. `install_location` free-text. |
| `users` | `User_ID INT IDENTITY` | INT | bcrypt `pw_hash`, role IN (admin/user/viewer) |
| `sync_logs` | id | INT | `device_id` is NVARCHAR(50) — accepts both int (camera) and string (NVR/SW) IDs |
| `audit_logs` | id | INT | who/what/when, JSON old/new values |
| `ping_logs` | id | INT | device_id NVARCHAR(50), is_alive, latency_ms, pinged_at |
| `alert_logs` | id | INT | denormalised path + alert_type IN (offline/hdd_warning/hdd_full/back_online) |

### Views

| View | Purpose |
|---|---|
| `vw_camera_full_path` | Susan's "CCTV Transaction" — camera + site/building/floor + linked NVR + PoE switch. No room/rack join. |
| `vw_nvr_full_path` | Every NVR with full Site → Room → Rack path |
| `vw_switch_full_path` | Every PoE switch with full Site → Room → Rack path |
| `vw_dashboard_summary` | Per-site rollup counts (scalar subqueries — no cross-product) |
| `vw_unresolved_alerts` | `alert_logs WHERE resolved_at IS NULL` |

### Seed users (replace bcrypt hashes before production)

| username | role | plain pw (replace!) |
|---|---|---|
| admin | admin | Admin@SSM1 |
| ssm_user | user | User@SSM1 |
| viewer | viewer | — (Guest button) |

---

## 6. EXCEL TEMPLATE — `templates/template_v3.xlsx`

10 sheets, filled in numbered order. Headers intentionally close to SQL column
names so importer can do header-matching.

| # | Sheet | Key columns (matches SQL exactly where possible) |
|---|---|---|
| 0 | `📋 README` | Filling order + sync key notes |
| 1 | `1_Site` | `Site_ID (PK)`, Site Name, Site Code, Location / Address, Description, Created, Updated |
| 2 | `2_Building` | `Site_ID (FK)`, `Building_ID (PK)`, Building Name, Building Code, Floor Count, Description, Image Path, Note, Created, Updated |
| 3 | `3_Floor` | 2 FKs + `Floor_ID (PK)`, Floor Number, Floor Name, Main Function, Has CCTV?, Image Path, Note, Created, Updated |
| 4 | `4_Room` | 3 FKs + `Room_ID (PK)`, Room Name, Room Type, Has NVR, Has SW, Image Path, Note, Created, Updated — **only rack-containing rooms** |
| 5 | `5_Rack` | 4 FKs + `Rack_ID (PK)`, Rack Name, Total U, **Units per U**, Note, Created, Updated |
| 6 | `6_CCTV` | **3 FKs (Site/Building/Floor only)** + `NVR_CH (PK)`, Device Name, Brand, Model, S/N, MAC, Camera Type, Resolution, IP Address, VLAN, PoE Switch Name, Switch Port, NVR Device Name, NVR Channel, Status, Fail Count, Note, Created, Updated |
| 7 | `7_NVR` | 5 FKs + `NVR_ID (PK)`, U Position + **U Sub-pos** + **U-Size**, Device Name, Brand, Model, S/N, MAC, OS/Firmware, VLAN, **IP (Internet Port)** + **IP (CCTV Port)**, Total/Active Channels, HDD Total (TB), Recording Resolution, Retention (days), Record Status, Status, Fail Count, Note, Created, Updated |
| 8 | `8_Switch` | 5 FKs + `SW_ID (PK)`, U Position + U Sub-pos, Device Name, **Switch Type**, Brand, Model, S/N, MAC, OS/Firmware, VLAN, IP Address, Total Ports, PoE Ports, PoE Budget (W), PoE Used (W), Uplink Port, Status, Fail Count, Note, Created, Updated |
| 9 | `9_Users` | `User_ID (PK)`, Username, Password (plain → bcrypt on import), Display Name, Role, Is Active, Last Login, Created, Updated |

**Source of truth for the workbook:** `scripts/build_template_v2.py` — needs to
be updated to emit `template_v3.xlsx` (currently still emits v2). This is part
of Phase 2 cleanup.

---

## 7. LATEST CHANGES (this session — natural-key PKs)

### Schema changes applied to `db/SSM_schema_v2.sql`

| Table | Before | After | Reason |
|---|---|---|---|
| `racks` | `Rack_ID INT IDENTITY` PK | `Rack_ID NVARCHAR(20)` PK | Match Excel `5_Rack.Rack_ID (PK)` natural codes (e.g. `BLD_1_F1_R1`) |
| `poe_switches` | `id INT IDENTITY` PK, `Rack_ID INT NULL` | `SW_ID NVARCHAR(20)` PK, `Rack_ID NVARCHAR(20) NOT NULL` | Match Excel; D13 — only rack-mounted switches |
| `nvrs` | `id INT IDENTITY` PK, `Rack_ID INT NULL` | `NVR_ID NVARCHAR(20)` PK, `Rack_ID NVARCHAR(20) NOT NULL` | Match Excel; D13 |
| `cameras` | `poe_switch_id INT`, `nvr_id INT` FKs | `SW_ID NVARCHAR(20)`, `NVR_ID NVARCHAR(20)` FKs, added `NVR_CH NVARCHAR(30) UNIQUE NULL` | Match Excel — `NVR_CH` lets web fill later (D12) |
| `sync_logs / ping_logs / alert_logs` | `device_id INT` | `device_id NVARCHAR(50)` | Devices now have mixed PK types (int for camera, string for NVR/SW) |
| Views (`vw_camera_full_path`, etc.) | joined on `.id` | joined on `SW_ID` / `NVR_ID` | Cascading update |
| `vw_nvr_full_path` / `vw_switch_full_path` | `LEFT JOIN racks` | `INNER JOIN racks` | D13 — Rack_ID NOT NULL |

### File status

| File | Status |
|---|---|
| `db/SSM_schema_v2.sql` | ✅ **Canonical** — use this |
| `db/script.sql` (SSMS export) | ⚠️ Outdated; replace |
| `db/001/002/003_*.sql` | ⚠️ Earlier drafts; superseded |
| `templates/template_v3.xlsx` | ✅ Current |
| `templates/template_v2.xlsx` | ⚠️ Reference only |
| `scripts/build_template_v2.py` | ⚠️ Still emits v2 layout — needs update to v3 |

---

## 8. MANUAL CLEANUP THE USER STILL NEEDS TO DO

Workspace permissions block the AI from deleting files. Susan must do these
in Windows Explorer:

- [ ] Delete folder `SQL/` (3 files identical to `db/`)
- [ ] Delete `gitignore.txt` (replaced by `.gitignore`)
- [ ] Delete or rename `db/script.sql` → `db/script_OLD_ssms_export.sql`
- [ ] Delete `db/001_initial.sql`, `db/002_seed_users.sql`, `db/003_views.sql`
- [ ] Close Excel so the `~$template_v3.xlsx` lock file disappears

After cleanup, `db/` should contain only `SSM_schema_v2.sql`.

---

## 9. PENDING TASKS — PICK ONE

### Priority 1 — Python importer `ssm_import.py`

```bash
python scripts/ssm_import.py templates/template_v3.xlsx \
    --server localhost\SQLEXPRESS \
    --db SSM_DB \
    --auth windows \
    --dry-run
```

Required behaviour (see §0 for the full strategy):

- Read sheets in dependency order:
  Site → Building → Floor → Room → Rack → PoE Switch → NVR → CCTV → Users.
- **Header-based column mapping** with a small alias table for the few headers
  that don't match SQL column names exactly (e.g. `"IP (Internet Port)"` →
  `ip_internet`, `"Switch Port"` → `poe_port_number`).
- **Natural-key resolution** for every FK (`Site_ID`, `Building_ID`, `Floor_ID`,
  `Room_ID`, `Rack_ID`, `NVR_ID`, `SW_ID`).
- **Sync-key validation:** IP regex `^(?:\d{1,3}\.){3}\d{1,3}$`, MAC regex
  `^([0-9A-Fa-f]{2}:){5}[0-9A-Fa-f]{2}$`, duplicate `serial_no` detection
  across all device tables, `hdd_used_pct ∈ [0,100]`, `u_subposition ∈ {1,2,3}`,
  `u_position ≤ rack.total_units`.
- Auto-fill `created_at` / `updated_at` if blank.
- bcrypt-hash passwords from `9_Users` (cost factor 12).
- Resolve `Image Path` → file → base64 → `image_data` + `image_type`
  (reject if > 5 MB).
- Single transaction; `--dry-run` rolls back. Emit `import_report.csv` listing
  per-row pass / fail / reason.

### Priority 2 — Regenerate the template script

Update `scripts/build_template_v2.py` (or rename to `_v3.py`) so it emits the
v3 layout with the natural-key PK columns. Goal: workbook stays reproducible
from code.

### Priority 3 — SQL Server testing

- Run `db/SSM_schema_v2.sql` against a fresh `SSM_DB`. Confirm zero errors.
- Insert synthetic data; verify `vw_dashboard_summary` counts and
  `vw_camera_full_path` joins.
- Replace bcrypt hashes in the seed section with real passwords before
  production.

### Priority 4 — Open clarifying questions

1. `Site Code` — required, or optional? (Currently optional.)
2. Image path in Excel — relative to the workbook (recommended) or absolute Windows path?
3. `updated_at` semantics on re-import — bump every row, or only changed rows? Recommendation: hash compare, only bump changed rows.

---

## 10. QUICK CHECKLIST BEFORE RESPONDING

When you (the new AI) start the chat:

1. ☐ Read §0 (Purpose) — every recommendation must serve the importer goal.
2. ☐ Confirm Susan has completed the §8 manual cleanup.
3. ☐ Ask which Priority she wants to tackle next.
4. ☐ Do **not** redesign the schema. Decisions in §3 (D1–D14) are locked.
5. ☐ Do **not** edit `template_v3.xlsx` directly. Update
   `scripts/build_template_v2.py` (rename to `_v3`) and re-run.
6. ☐ Reply in Thai. Keep technical terms in English.
7. ☐ Explain *why* before *how*.

Suggested opening:

> "อ่าน MEGA_CONTEXT แล้วครับ เข้าใจครบ:
> - 13 tables, natural-key PKs everywhere (Site_ID … SW_ID), cameras = id INT + NVR_CH UNIQUE
> - Cameras อยู่บน floor plan (ไม่มี Room/Rack), rooms มีแค่ห้องที่มี rack
> - Schema canonical อยู่ที่ `db/SSM_schema_v2.sql`, workbook canonical คือ `template_v3.xlsx`
> - Goal: เขียน `ssm_import.py` ที่ map header → SQL column, ดึง ip/mac/s/n จาก Excel
>
> อยากเริ่ม Priority ไหนก่อนครับ? (1) Python importer (2) regen template script (3) SQL Server testing (4) ตอบ 3 open questions"

---

## 11. QUICK FILE MAP

| File | When to open |
|---|---|
| `db/SSM_schema_v2.sql` | **The schema** — all 13 tables + views + indexes + seed users |
| `templates/template_v3.xlsx` | The actual workbook field staff fill |
| `templates/template_v2.xlsx` | Older version — reference only |
| `scripts/build_template_v2.py` | Reproduce the (v2) template from code; needs v3 update |
| `docs/SSM_PROJECT.md` | Original project doc (API, components, conventions) |
| `docs/SQL_DESIGN.md` | Older design rationale; some sections superseded by D6+D7+D11–D14 |
| `docs/MS_SQL_DRAW.pdf` | Susan's hand-drawn schema (original input) |
| `ABOUT_ME.md` | Susan's preferences and AI rules |
| `ROADMAP.md` | 5-month learning + portfolio plan |
| `README.md` | Repo overview |
| `_ai_context/RESUME.md`, `START_HERE.md`, `HANDOFF.md` | Older context files — MEGA_CONTEXT supersedes them |

---

*End of MEGA_CONTEXT.md. This is the only file the new AI chat needs.*
