# F9 — Backend API Spec for BNO_Survei_Monitor

> **อ่านก่อน:** Frontend (React) เรียก `/api/*` ทั้งหมดผ่าน Vite proxy → `http://localhost:50680`
> Project นี้คือ `BNO_Survei_Monitor` (ASP.NET Core .NET 10) ที่อยู่ใน `C:\ai-playground\Frontend\BNO_Survei_Monitor\`

---

## 1. Setup ที่ต้องทำก่อน (Program.cs + appsettings.json)

### `Program.cs`
ต้องเพิ่ม:
- JWT Authentication middleware
- CORS เปิด `http://localhost:3000` (Vite dev) และ `http://localhost:3001`
- Route prefix `/api`

```csharp
// ตัวอย่าง minimal setup
builder.Services.AddCors(options => {
    options.AddPolicy("FrontendDev", policy => {
        policy.WithOrigins("http://localhost:3000", "http://localhost:3001")
              .AllowAnyHeader()
              .AllowAnyMethod();
    });
});

builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(options => { /* config JWT */ });

app.UseCors("FrontendDev");
app.UseAuthentication();
app.UseAuthorization();
```

### `appsettings.json`
```json
{
  "ConnectionStrings": {
    "DefaultConnection": "Server=...;Database=...;..."
  },
  "Jwt": {
    "Key": "...",
    "Issuer": "BNO_Survei_Monitor",
    "ExpiresInMinutes": 480
  }
}
```

---

## 2. Controllers ที่ต้องสร้าง

ทุกไฟล์ไปไว้ที่:
```
BNO_Survei_Monitor\BNO_Survei_Monitor\Controllers\
```

---

### `AuthController.cs`

```
POST /api/auth/login
```

**Request body:**
```json
{ "username": "admin_test", "password": "Test@1234" }
```

**Response 200:**
```json
{
  "token": "<JWT string>",
  "role": "admin",
  "displayName": "System Admin",
  "expiresIn": 28800
}
```

**Notes:**
- ไม่ต้องการ JWT header (endpoint เดียวที่ไม่ต้อง authenticate)
- JWT payload ต้องมี claims: `name` (username), `nameid` (User_ID), `role`
- Test accounts: `admin_test/Test@1234`, `user_test/Test@1234`, `viewer_test/Test@1234`

---

### `CamerasController.cs`

```
GET  /api/cameras
PATCH /api/cameras/{id}/position   ← ใช้สำหรับ Floor Plan drag-and-drop
```

**GET query params (optional):**
- `Site_ID` — filter by site
- `Floor_ID` — filter by floor
- `status` — filter by status
- `id` — get single camera by id (returns array with 1 item)

**GET Response (array):**
```json
[
  {
    "id": 1,
    "Site_ID": "S01",
    "Building_ID": "A",
    "Floor_ID": "a-f1",
    "device_name": "CAM-A1-01",
    "brand": "Hikvision",
    "model": "DS-2CD2T47G2",
    "serial_no": null,
    "mac_address": null,
    "camera_type": null,
    "resolution": null,
    "firmware_version": null,
    "ip_address": "192.168.1.101",
    "vlan_id": null,
    "NVR_ID": "NVR-HQ-01",
    "nvr_channel": null,
    "install_location": "ทางเข้าอาคาร A",
    "status": "online",
    "fail_count": 0,
    "last_seen": "2026-05-28T10:30:00",
    "notes": null,
    "created_at": "2026-01-01T00:00:00",
    "updated_at": "2026-05-28T10:30:00",
    "position_x": 0.35,
    "position_y": 0.60
  }
]
```

**PATCH `/api/cameras/{id}/position` body:**
```json
{ "x": 0.35, "y": 0.60 }
```
→ Response: อะไรก็ได้ 200 OK

**Notes:**
- `status` field: ส่งเป็น string `"online"`, `"offline"`, `"warning"`
- `last_seen` ส่งเป็น UTC ไม่ต้องมี Z (frontend append เอง)
- `position_x` / `position_y` คือ 0.0–1.0 (% ของขนาดรูป floor plan), null ได้

---

### `NvrsController.cs`

```
GET /api/nvrs
```

**GET query params (optional):** `Site_ID`, `Rack_ID`, `status`

**GET Response (array):**
```json
[
  {
    "NVR_ID": "NVR-HQ-01",
    "Site_ID": "S01",
    "Building_ID": "A",
    "Floor_ID": "a-f2",
    "Room_ID": "server-room",
    "Rack_ID": "rack-a1",
    "device_name": "NVR-HQ-01",
    "brand": "Hikvision",
    "model": "DS-9632NXI-I8",
    "serial_no": null,
    "mac_address": null,
    "ip_internet": "192.168.1.10",
    "ip_cctv": "10.10.1.10",
    "total_channels": 32,
    "active_channels": 28,
    "hdd_total_tb": 16.0,
    "hdd_used_pct": 72.5,
    "recording_res": "4K",
    "retention_days": 30,
    "record_status": "recording",
    "status": "online",
    "fail_count": 0,
    "last_seen": "2026-05-28T10:30:00",
    "notes": null,
    "created_at": "2026-01-01T00:00:00",
    "updated_at": "2026-05-28T10:30:00"
  }
]
```

**Notes:**
- `ip_internet` = ETH1 (uplink ออก internet/core switch)
- `ip_cctv` = ETH2 (เชื่อม PoE switch ที่กล้องเสียบ)
- สองช่องนี้สำคัญมาก frontend ใช้แสดง port diagram

---

### `PoeSwitchesController.cs`

```
GET /api/poe-switches
```

**GET query params (optional):** `Site_ID`, `Rack_ID`, `status`

**GET Response (array):**
```json
[
  {
    "SW_ID": "SW-HQ-CORE",
    "Site_ID": "S01",
    "Building_ID": "A",
    "Floor_ID": "a-f2",
    "Room_ID": "server-room",
    "Rack_ID": "rack-a1",
    "device_name": "Core Switch HQ",
    "switch_type": "core",
    "brand": "Cisco",
    "model": "SG350X-24P",
    "serial_no": null,
    "mac_address": null,
    "ip_address": "192.168.1.2",
    "total_ports": 24,
    "poe_ports": 24,
    "poe_budget_w": 370,
    "poe_used_w": 180,
    "status": "online",
    "fail_count": 0,
    "last_seen": "2026-05-28T10:30:00",
    "notes": null,
    "created_at": "2026-01-01T00:00:00",
    "updated_at": "2026-05-28T10:30:00"
  }
]
```

---

### `UsersController.cs`

```
GET  /api/users
POST /api/users              ← body = array (สร้าง user ใหม่)
POST /api/users/{id}         ← body = object (แก้ไข)
POST /api/users/delete/{id}  ← ลบ (ใช้ POST ไม่ใช่ DELETE)
```

**GET query params:** `role` (optional filter)

**GET Response (array):**
```json
[
  {
    "User_ID": 1,
    "username": "admin_test",
    "display_name": "System Admin",
    "role": "admin",
    "is_active": true,
    "last_login": "2026-05-28T08:00:00",
    "created_at": "2026-01-01T00:00:00",
    "updated_at": "2026-05-28T08:00:00"
  }
]
```

**POST /api/users body (array!):**
```json
[
  {
    "username": "new_user",
    "password": "Pass@1234",
    "display_name": "New User",
    "role": "user"
  }
]
```

**POST /api/users/{id} body (object):**
```json
{
  "display_name": "Updated Name",
  "role": "viewer",
  "is_active": false
}
```

**POST /api/users/delete/{id}:** ไม่มี body → Response 200 OK

**Notes:**
- `role` values: `"admin"`, `"user"`, `"viewer"` เท่านั้น
- ทุก endpoint ยกเว้น login ต้องการ JWT และ role = `admin`

---

### `DashboardController.cs`

```
GET /api/dashboard/summary
```

**Response (array — 1 item ต่อ site):**
```json
[
  {
    "siteId": "S01",
    "siteCode": "HQ",
    "siteName": "สำนักงานใหญ่",
    "totalCameras": 48,
    "camerasOnline": 46,
    "camerasOffline": 2,
    "camerasWarning": 0,
    "totalNvrs": 4,
    "nvrsOffline": 0,
    "totalSwitches": 6,
    "switchesOffline": 1,
    "totalBuildings": 4,
    "totalFloors": 14,
    "totalRooms": 20,
    "totalRacks": 3
  }
]
```

**Notes:**
- Frontend aggregate ข้าม site เอง (sum ทุก item ใน array)
- Sidebar badge counts ใช้ field `totalCameras`, `totalNvrs`, `totalSwitches`

---

### `StatusController.cs`

```
GET /api/status/devices
```

**Response (array — เฉพาะอุปกรณ์ที่ไม่ online):**
```json
[
  {
    "id": "NVR-HQ-05",
    "type": "nvr",
    "name": "NVR-HQ-05",
    "status": "offline",
    "lastSeen": "2026-05-28T05:18:00",
    "siteId": "S01"
  }
]
```

**Notes:**
- `lastSeen` ใช้สำหรับคำนวณ "offline นานแค่ไหน"
- ส่งเฉพาะตัวที่ไม่ online ก็ได้ หรือส่งทั้งหมด frontend filter เอง

---

### `AlertLogsController.cs`

```
GET /api/alert-logs?limit=8
```

**Query params:** `limit` (int, optional, default = 50)

**Response (array — เรียงจากใหม่ → เก่า):**
```json
[
  {
    "id": 1,
    "device_type": "nvr",
    "device_id": "NVR-HQ-03",
    "device_name": "NVR-HQ-03",
    "brand": "Hikvision",
    "ip_address": "192.168.1.13",
    "site_name": "สำนักงานใหญ่",
    "building_name": "Building A",
    "floor_name": "F2 — Server Room",
    "alert_type": "hdd_critical",
    "message": "HDD2 storage at 91%",
    "webhook_sent": false,
    "resolved_at": null,
    "alerted_at": "2026-05-28T09:45:00",
    "updated_at": "2026-05-28T09:45:00"
  }
]
```

**Notes:**
- `resolved_at: null` = ยังไม่แก้ไข (active alert)
- `alert_type` ที่ frontend ใช้จำแนก severity:
  - critical = ชื่อมี `critical`, `offline`, `lost`, `fail`, `hdd`
  - warning = ชื่อมี `warn`, `high`, `latency`
  - info = อื่นๆ
- Topbar ดึง `limit=5`, Dashboard ดึง `limit=8`

---

### `HierarchyController.cs`

```
GET /api/hierarchy/tree
```

**Response (array of sites, nested):**
```json
[
  {
    "siteId": "S01",
    "siteName": "สำนักงานใหญ่",
    "siteCode": "HQ",
    "location": "Bangkok",
    "alertCount": 3,
    "totalDevices": 58,
    "buildings": [
      {
        "buildingId": "a",
        "siteId": "S01",
        "buildingName": "Building A",
        "buildingCode": "A",
        "floorCount": 6,
        "alertCount": 2,
        "floors": [
          {
            "floorId": "a-f1",
            "buildingId": "a",
            "floorNumber": 1,
            "floorName": "F1 — Lobby",
            "mainFunction": "lobby",
            "cameraCount": 8,
            "alertCount": 0
          }
        ]
      }
    ]
  }
]
```

---

### `PingLogsController.cs`

```
GET /api/ping-logs?device_id=1&device_type=camera
```

**Query params:** `device_id` (string), `device_type` (string)

**Response (array — เรียงจากใหม่ → เก่า):**
```json
[
  {
    "id": 1,
    "device_type": "camera",
    "device_id": "1",
    "ip_address": "192.168.1.101",
    "is_alive": true,
    "latency_ms": 2,
    "pinged_at": "2026-05-28T10:30:00"
  }
]
```

---

### `FloorsController.cs`

```
GET /api/floors/{floorId}/floor-plan/image
```

**Response:** ไฟล์รูป (jpg/png) พร้อม `Content-Type: image/jpeg`

**Notes:**
- ต้องการ JWT header (frontend ส่ง Authorization: Bearer ทุก request)
- Floor ID format: `a-f1` ถึง `a-f6`, `b-f1` ถึง `b-f4` ฯลฯ
- ถ้ายังไม่มีรูปจริง ส่ง 404 ได้เลย frontend มี SVG fallback รอไว้

---

## 3. สรุป Priority

| Priority | Controller | เหตุผล |
|---|---|---|
| 🔴 ต้องมีก่อน demo | `AuthController` | ล็อกอินไม่ได้ = เข้าอะไรไม่ได้ |
| 🔴 ต้องมีก่อน demo | `DashboardController` | หน้าแรกหลัง login |
| 🔴 ต้องมีก่อน demo | `CamerasController` | หน้าหลักของระบบ |
| 🔴 ต้องมีก่อน demo | `NvrsController` | |
| 🔴 ต้องมีก่อน demo | `PoeSwitchesController` | |
| 🟡 สำคัญแต่มี mock | `UsersController` | admin feature |
| 🟡 สำคัญแต่มี mock | `AlertLogsController` | Topbar + Dashboard |
| 🟡 สำคัญแต่มี mock | `StatusController` | Dashboard offline list |
| 🟢 ทำทีหลังได้ | `HierarchyController` | Sites/Buildings page |
| 🟢 ทำทีหลังได้ | `PingLogsController` | Camera detail chart |
| 🟢 ทำทีหลังได้ | `FloorsController` | Floor plan image |

---

## 4. Reference

- Frontend types ครบอยู่ที่ `src/api/types.ts`
- ตัวอย่าง controllers เก่า (ASP.NET MVC) ดูได้ที่ `C:\ai-playground\API\BNO_Survei_MonitorAPI\BNO_Survei_MonitorAPI\Controllers\`
- Models ของ `BNO_Survei_Monitor` มีอยู่แล้วที่ `BNO_Survei_Monitor\BNO_Survei_Monitor\Models\`
