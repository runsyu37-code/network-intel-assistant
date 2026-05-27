# Role Matrix — Confirmed 2026-05-26

## Roles

| Role | Description |
|------|-------------|
| admin | Full access — read, write, delete everything |
| user | Read-only structural view — sites down to racks, no device/log data |
| viewer | Read-only layout view — sites down to floor plans only |

---

## GET (Read) Permissions

| Endpoint | admin | user | viewer |
|----------|-------|------|--------|
| GET /api/sites | ✅ | ✅ | ✅ |
| GET /api/buildings | ✅ | ✅ | ✅ |
| GET /api/floors | ✅ | ✅ | ✅ |
| GET /api/floor-plans | ✅ | ✅ | ✅ |
| GET /api/rooms | ✅ | ✅ | ❌ 403 |
| GET /api/racks | ✅ | ✅ | ❌ 403 |
| GET /api/cameras | ✅ | ❌ 403 | ❌ 403 |
| GET /api/nvrs | ✅ | ❌ 403 | ❌ 403 |
| GET /api/poe-switches | ✅ | ❌ 403 | ❌ 403 |
| GET /api/devices | ✅ | ❌ 403 | ❌ 403 |
| GET /api/alert-logs | ✅ | ❌ 403 | ❌ 403 |
| GET /api/audit-logs | ✅ | ❌ 403 | ❌ 403 |
| GET /api/ping-logs | ✅ | ❌ 403 | ❌ 403 |
| GET /api/sync-logs | ✅ | ❌ 403 | ❌ 403 |
| GET /api/users | ✅ | ❌ 403 | ❌ 403 |
| GET /api/hierarchy/tree | ✅ | ✅ (TBD scope) | ✅ (TBD scope) |

---

## POST / DELETE (Write) Permissions

All mutating endpoints (Save, Update, Delete) — **admin only**.

| Endpoint | admin | user | viewer |
|----------|-------|------|--------|
| POST/DELETE /api/sites | ✅ | ❌ 403 | ❌ 403 |
| POST/DELETE /api/buildings | ✅ | ❌ 403 | ❌ 403 |
| POST/DELETE /api/floors | ✅ | ❌ 403 | ❌ 403 |
| POST/DELETE /api/floor-plans | ✅ | ❌ 403 | ❌ 403 |
| POST/DELETE /api/rooms | ✅ | ❌ 403 | ❌ 403 |
| POST/DELETE /api/racks | ✅ | ❌ 403 | ❌ 403 |
| POST/DELETE /api/cameras | ✅ | ❌ 403 | ❌ 403 |
| POST/DELETE /api/nvrs | ✅ | ❌ 403 | ❌ 403 |
| POST/DELETE /api/poe-switches | ✅ | ❌ 403 | ❌ 403 |
| POST/DELETE /api/alert-logs | ✅ | ❌ 403 | ❌ 403 |
| POST/DELETE /api/audit-logs | ✅ | ❌ 403 | ❌ 403 |
| POST/DELETE /api/ping-logs | ✅ | ❌ 403 | ❌ 403 |
| POST/DELETE /api/sync-logs | ✅ | ❌ 403 | ❌ 403 |
| POST/DELETE /api/users | ✅ | ❌ 403 | ❌ 403 |

---

## Why Each Role Is Scoped This Way

**user** — intended for staff studying the CCTV network structure.
Can see the physical layout (site → building → floor → room → rack) but not device credentials.
IP addresses, serial numbers, MAC addresses are confidential even internally.

**viewer** — intended for high-level overview only.
Can see where floors exist and view floor plan images.
Cannot see room-level detail or any device/operational data.

---

## Current Implementation Status

| Item | Status |
|------|--------|
| All write endpoints → admin only | ✅ Done (Phase 10, 2026-05-27) |
| viewer blocked on rooms/racks GET | ✅ Done (Phase 10, 2026-05-27) |
| user/viewer blocked on cameras/nvrs/switches/devices GET | ✅ Done (Phase 10, 2026-05-27) |
| user/viewer blocked on logs/users GET | ✅ Done (Phase 10, 2026-05-27) |

---

*Confirmed by Ran — 2026-05-26. Implemented Phase 10 — 2026-05-27.*
