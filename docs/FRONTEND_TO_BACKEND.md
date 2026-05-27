# Frontend → Backend: API Contract & Clarifications

> **From:** Frontend Claude (SSM React SPA)  
> **Date:** 2026-05-27  
> **Re:** API endpoints the frontend already calls + discrepancies to resolve

---

## 1. Endpoints the Frontend Currently Calls

The frontend has React Query hooks wired to these endpoints. Backend must implement them **in this exact shape** for the integration to work.

### Auth

| Method | Path | Request body | Response |
|--------|------|--------------|----------|
| `POST` | `/api/auth/login` | `{ username, password }` | `{ token, role, displayName, expiresIn }` |

The frontend decodes the JWT to extract `unique_name` (username) and `nameid` (user ID).  
Role must be exactly: `"admin"`, `"user"`, or `"viewer"` (lowercase string).

---

### Device Lists (all accept optional query params for filtering)

| Method | Path | Query params | Response |
|--------|------|--------------|----------|
| `GET` | `/api/cameras` | `?Site_ID=&Floor_ID=&status=&id=` | `CameraApi[]` |
| `GET` | `/api/nvrs` | `?Site_ID=` | `NvrApi[]` |
| `GET` | `/api/poe-switches` | `?Site_ID=` | `PoeSwitchApi[]` |
| `GET` | `/api/users` | — | `UserApi[]` |

### Logs (admin-only — return 403 for non-admin)

| Method | Path | Query params | Response |
|--------|------|--------------|----------|
| `GET` | `/api/ping-logs` | `?device_id=&device_type=camera` | `PingLogApi[]` |
| `GET` | `/api/alert-logs` | — | `AlertLogApi[]` |

The frontend handles 403 gracefully — it falls back to mock data with a note in the UI.

### Dashboard

| Method | Path | Response |
|--------|------|----------|
| `GET` | `/api/dashboard/summary` | `DashboardSummaryDto[]` (one per site) |

### Camera position save (Edit mode drag-and-drop)

| Method | Path | Request body | Response |
|--------|------|--------------|----------|
| `PATCH` | `/api/cameras/{id}/position` | `{ x, y }` | any 200 |

---

## 2. TypeScript Shape Expected (matches `src/api/types.ts`)

```typescript
interface CameraApi {
  id: number
  Site_ID: string; Building_ID: string; Floor_ID: string
  device_name: string
  brand: string|null; model: string|null; serial_no: string|null
  mac_address: string|null; camera_type: string|null
  resolution: string|null; firmware_version: string|null
  ip_address: string|null; vlan_id: number|null
  NVR_ID: string|null; nvr_channel: number|null
  install_location: string|null
  status: 'online'|'offline'|'warning'|null
  fail_count: number|null; last_seen: string|null  // UTC ISO 8601
  notes: string|null
  created_at: string; updated_at: string
  position_x?: number|null; position_y?: number|null
}

interface NvrApi {
  NVR_ID: string; Site_ID: string; Building_ID: string
  Floor_ID: string; Room_ID: string; Rack_ID: string
  device_name: string
  brand: string|null; model: string|null; serial_no: string|null
  mac_address: string|null; ip_internet: string|null; ip_cctv: string|null
  total_channels: number|null; active_channels: number|null
  hdd_total_tb: number|null; hdd_used_pct: number|null
  recording_res: string|null; retention_days: number|null
  record_status: string|null
  status: string|null; fail_count: number|null; last_seen: string|null
  notes: string|null; created_at: string; updated_at: string
}

interface PoeSwitchApi {
  SW_ID: string; Site_ID: string; Building_ID: string
  Floor_ID: string; Room_ID: string; Rack_ID: string
  device_name: string; switch_type: string|null
  brand: string|null; model: string|null; serial_no: string|null
  mac_address: string|null; ip_address: string|null
  total_ports: number|null; poe_ports: number|null
  poe_budget_w: number|null; poe_used_w: number|null
  status: string|null; fail_count: number|null; last_seen: string|null
  notes: string|null; created_at: string; updated_at: string
}

interface UserApi {
  User_ID: number; username: string; display_name: string|null
  role: string; is_active: boolean
  last_login: string|null; created_at: string; updated_at: string
  // pw_hash must NOT appear in this response — strip it server-side
}

interface PingLogApi {
  id: number; device_type: string; device_id: string
  ip_address: string; is_alive: boolean
  latency_ms: number|null; pinged_at: string  // UTC ISO 8601
}

interface AlertLogApi {
  id: number
  device_type: string|null; device_id: string|null
  device_name: string|null; brand: string|null
  ip_address: string|null; site_name: string|null
  building_name: string|null; floor_name: string|null
  alert_type: string|null; message: string
  webhook_sent: boolean
  alerted_at: string|null; resolved_at: string|null; updated_at: string
}

interface DashboardSummaryDto {
  siteId: string; siteCode: string; siteName: string
  totalCameras: number; camerasOnline: number
  camerasOffline: number; camerasWarning: number
  totalNvrs: number; nvrsOffline: number
  totalSwitches: number; switchesOffline: number
  totalBuildings: number; totalFloors: number
  totalRooms: number; totalRacks: number
}
```

---

## 3. Discrepancies to Clarify

Based on what I can see in the `BNO_Survei_Monitor` project on disk:

### 3.1 — Port
- `launchSettings.json` says: **http port 5205, https port 7251**
- Frontend client.ts was previously pointing to **50680** — now corrected to **5205**
- Please confirm which port the backend team plans to use, or just keep 5205

### 3.2 — Login response format
My implementation expects:
```json
{ "token": "...", "role": "admin", "displayName": "Admin User", "expiresIn": 86400 }
```
If the response shape is different (e.g. only `{ "token": "...", "expiry": "2026-..." }`), let me know and I'll update `auth.ts`.

### 3.3 — JWT claims
The `extractJwtUser()` function looks for these claims in the JWT payload:
- `unique_name` → username
- `nameid` → user ID

If you're using different claim names (e.g. `sub`, `name`, `http://schemas.xmlsoap.org/ws/2005/05/identity/claims/name`), let me know.

### 3.4 — Status values
Frontend maps `status` field as: `"online"` → green, `"warning"` → yellow, anything else → red.  
Please use exactly `"online"` / `"offline"` / `"warning"` (lowercase).

### 3.5 — `GET /api/dashboard/summary`
Frontend calls this endpoint. If it doesn't exist yet, the TopologyPage falls back gracefully (shows empty stats). Please add it when possible — response should be `DashboardSummaryDto[]` (array, one per site).

---

## 4. CORS

Frontend dev server runs on **http://localhost:3001** (port 3000 was in use today).  
Please ensure CORS allows origins: `http://localhost:3000` and `http://localhost:3001`.

---

## 5. What's NOT Yet Wired (but will need endpoints later)

These pages still use mock data. Will wire after the core endpoints above are stable:

| Page | Endpoint needed |
|------|-----------------|
| SitesPage | `GET /api/sites` |
| BuildingDetailPage | `GET /api/buildings/{id}` |
| FloorPlanPage | `GET /api/floors/{id}` + `GET /api/floors/{id}/floor-plan/image` |
| RackDetailPage | `GET /api/racks/{id}` |
| NVRDetailPage | `GET /api/nvrs/{id}` + channel data |
| SwitchDetailPage | `GET /api/poe-switches/{id}` + port data |

---

## 6. Models Already in Place

The `BNO_Survei_Monitor/Models/` folder has all 13 model files. The namespace must remain `BNO_Survei_Monitor.Models` — do not rename.

---

*Questions? Reply via a .md file in this folder or update `BACKEND_READY_NOTES.md`.*
