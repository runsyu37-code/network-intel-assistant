# Backend API Brief — SSM Controllers

> **To:** Backend Claude  
> **From:** Frontend Claude  
> **Date:** 2026-05-27  
> **Project:** BNO_Survei_Monitor (ASP.NET Core .NET 10, path: `BNO_Survei_Monitor/`)  
> **Urgency:** Phase 1 endpoints needed before demo (2026-05-29)

---

## Critical Issues to Fix First

### 1. Model namespace is wrong

All 13 model files currently have:
```csharp
namespace TestAPBNO_Survei_MonitorAPI.Models   // WRONG — old project name
```
Must be changed to:
```csharp
namespace BNO_Survei_Monitor.Models   // CORRECT — matches new project
```
Also remove `using System.Web;` from every model — it does not exist in ASP.NET Core.

### 2. `Newtonsoft.Json` not installed by default in .NET 10

Either:
- Install via NuGet: `Newtonsoft.Json` + keep `[JsonProperty]` attributes  
- Or replace with `System.Text.Json` + use `[JsonPropertyName]` attributes

Recommended: install Newtonsoft.Json (keeps existing attributes intact, less work).

---

## Step 1 — Program.cs Setup

Replace the current `Program.cs` with this:

```csharp
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.IdentityModel.Tokens;
using System.Text;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddControllers();

// CORS — allow frontend dev server
builder.Services.AddCors(options =>
{
    options.AddPolicy("FrontendDev", policy =>
    {
        policy.WithOrigins("http://localhost:3000", "http://localhost:3001")
              .AllowAnyHeader()
              .AllowAnyMethod();
    });
});

// JWT Auth
var jwtKey = builder.Configuration["Jwt:Key"] ?? "ssm-dev-secret-key-change-in-prod";
builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(options =>
    {
        options.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuerSigningKey = true,
            IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtKey)),
            ValidateIssuer = false,
            ValidateAudience = false,
        };
    });

builder.Services.AddAuthorization();

var app = builder.Build();

app.UseCors("FrontendDev");
app.UseAuthentication();
app.UseAuthorization();
app.MapControllers();
app.Run();
```

Add to `appsettings.json`:
```json
{
  "ConnectionStrings": {
    "DefaultConnection": "Server=YOUR_SERVER;Database=SSM_DB;Trusted_Connection=True;"
  },
  "Jwt": {
    "Key": "ssm-dev-secret-key-change-in-prod"
  }
}
```

Install NuGet packages:
```
Microsoft.AspNetCore.Authentication.JwtBearer
Microsoft.IdentityModel.Tokens
System.IdentityModel.Tokens.Jwt
Newtonsoft.Json
Microsoft.Data.SqlClient
```

---

## Step 2 — DB Helper Class

Create `Helpers/DbHelper.cs`:

```csharp
using Microsoft.Data.SqlClient;

namespace BNO_Survei_Monitor.Helpers
{
    public class DbHelper
    {
        private readonly string _conn;
        public DbHelper(IConfiguration config)
        {
            _conn = config.GetConnectionString("DefaultConnection")!;
        }
        public SqlConnection Open() => new SqlConnection(_conn);
    }
}
```

Register in `Program.cs` (add before `builder.Build()`):
```csharp
builder.Services.AddSingleton<DbHelper>();
```

---

## Step 3 — Controllers to Create

Create all files in `Controllers/` folder.

---

### AuthController.cs

**Route:** `POST /api/auth/login`  
**Request:** `{ "username": "...", "password": "..." }`  
**Response:** `{ "token": "...", "role": "admin", "displayName": "...", "expiresIn": 86400 }`

```csharp
using Microsoft.AspNetCore.Mvc;
using Microsoft.Data.SqlClient;
using Microsoft.IdentityModel.Tokens;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using BNO_Survei_Monitor.Helpers;

namespace BNO_Survei_Monitor.Controllers
{
    [ApiController]
    [Route("api/auth")]
    public class AuthController : ControllerBase
    {
        private readonly DbHelper _db;
        private readonly IConfiguration _config;

        public AuthController(DbHelper db, IConfiguration config)
        {
            _db = db;
            _config = config;
        }

        [HttpPost("login")]
        public IActionResult Login([FromBody] LoginRequest req)
        {
            using var conn = _db.Open();
            conn.Open();
            var cmd = new SqlCommand(
                "SELECT User_ID, username, display_name, role, pw_hash FROM users WHERE username = @u AND is_active = 1",
                conn);
            cmd.Parameters.AddWithValue("@u", req.Username);
            using var reader = cmd.ExecuteReader();
            if (!reader.Read()) return Unauthorized(new { Message = "Invalid username or password." });

            var userId      = reader.GetInt32(0);
            var username    = reader.GetString(1);
            var displayName = reader.IsDBNull(2) ? username : reader.GetString(2);
            var role        = reader.GetString(3);
            var pwHash      = reader.GetString(4);
            reader.Close();

            // TODO: replace with BCrypt.Verify(req.Password, pwHash) when bcrypt is set up
            // For now: plain text comparison (dev only)
            if (pwHash != req.Password) return Unauthorized(new { Message = "Invalid username or password." });

            var token = GenerateJwt(userId, username, role);
            return Ok(new { token, role, displayName, expiresIn = 86400 });
        }

        private string GenerateJwt(int userId, string username, string role)
        {
            var key   = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(_config["Jwt:Key"]!));
            var creds = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);
            var claims = new[]
            {
                new Claim(ClaimTypes.NameIdentifier, userId.ToString()),
                new Claim(ClaimTypes.Name, username),
                new Claim(ClaimTypes.Role, role),
            };
            var token = new JwtSecurityToken(
                expires: DateTime.UtcNow.AddDays(1),
                claims: claims,
                signingCredentials: creds);
            return new JwtSecurityTokenHandler().WriteToken(token);
        }
    }

    public class LoginRequest
    {
        public string Username { get; set; } = "";
        public string Password { get; set; } = "";
    }
}
```

> **JWT claim names:** `ClaimTypes.NameIdentifier` serializes as `nameid`, `ClaimTypes.Name` as `unique_name`. These match what the frontend's `extractJwtUser()` reads.

---

### CamerasController.cs

**Routes:**
- `GET /api/cameras` — all cameras, optional `?Site_ID=&Floor_ID=&status=&id=`
- `PATCH /api/cameras/{id}/position` — save drag position `{ x, y }`

```csharp
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Data.SqlClient;
using BNO_Survei_Monitor.Helpers;
using BNO_Survei_Monitor.Models;

namespace BNO_Survei_Monitor.Controllers
{
    [ApiController]
    [Route("api/cameras")]
    [Authorize]
    public class CamerasController : ControllerBase
    {
        private readonly DbHelper _db;
        public CamerasController(DbHelper db) { _db = db; }

        [HttpGet]
        public IActionResult GetCameras(
            [FromQuery] string? Site_ID,
            [FromQuery] string? Floor_ID,
            [FromQuery] string? status,
            [FromQuery] int? id)
        {
            var sql = "SELECT id, Site_ID, Building_ID, Floor_ID, device_name, brand, model, " +
                      "serial_no, mac_address, camera_type, resolution, firmware_version, " +
                      "ip_address, vlan_id, NVR_ID, nvr_channel, install_location, " +
                      "status, fail_count, last_seen, notes, created_at, updated_at, " +
                      "position_x, position_y FROM cameras WHERE 1=1";
            var conditions = new List<string>();
            if (id.HasValue)         conditions.Add("id = @id");
            if (Site_ID != null)     conditions.Add("Site_ID = @site");
            if (Floor_ID != null)    conditions.Add("Floor_ID = @floor");
            if (status != null)      conditions.Add("status = @status");
            if (conditions.Count > 0) sql += " AND " + string.Join(" AND ", conditions);

            using var conn = _db.Open();
            conn.Open();
            var cmd = new SqlCommand(sql, conn);
            if (id.HasValue)     cmd.Parameters.AddWithValue("@id", id.Value);
            if (Site_ID != null) cmd.Parameters.AddWithValue("@site", Site_ID);
            if (Floor_ID != null)cmd.Parameters.AddWithValue("@floor", Floor_ID);
            if (status != null)  cmd.Parameters.AddWithValue("@status", status);

            var list = new List<camerasModel>();
            using var r = cmd.ExecuteReader();
            while (r.Read())
            {
                list.Add(new camerasModel
                {
                    id               = r.GetInt32(0),
                    Site_ID          = r.IsDBNull(1)  ? null : r.GetString(1),
                    Building_ID      = r.IsDBNull(2)  ? null : r.GetString(2),
                    Floor_ID         = r.IsDBNull(3)  ? null : r.GetString(3),
                    device_name      = r.IsDBNull(4)  ? null : r.GetString(4),
                    brand            = r.IsDBNull(5)  ? null : r.GetString(5),
                    model            = r.IsDBNull(6)  ? null : r.GetString(6),
                    serial_no        = r.IsDBNull(7)  ? null : r.GetString(7),
                    mac_address      = r.IsDBNull(8)  ? null : r.GetString(8),
                    camera_type      = r.IsDBNull(9)  ? null : r.GetString(9),
                    resolution       = r.IsDBNull(10) ? null : r.GetString(10),
                    firmware_version = r.IsDBNull(11) ? null : r.GetString(11),
                    ip_address       = r.IsDBNull(12) ? null : r.GetString(12),
                    vlan_id          = r.IsDBNull(13) ? null : r.GetInt32(13),
                    NVR_ID           = r.IsDBNull(14) ? null : r.GetString(14),
                    nvr_channel      = r.IsDBNull(15) ? null : r.GetInt32(15),
                    install_location = r.IsDBNull(16) ? null : r.GetString(16),
                    status           = r.IsDBNull(17) ? null : r.GetString(17),
                    fail_count       = r.IsDBNull(18) ? null : r.GetInt32(18),
                    last_seen        = r.IsDBNull(19) ? null : r.GetString(19),
                    notes            = r.IsDBNull(20) ? null : r.GetString(20),
                    created_at       = r.IsDBNull(21) ? null : r.GetString(21),
                    updated_at       = r.IsDBNull(22) ? null : r.GetString(22),
                    position_x       = r.IsDBNull(23) ? null : r.GetDecimal(23),
                    position_y       = r.IsDBNull(24) ? null : r.GetDecimal(24),
                });
            }
            return Ok(list);
        }

        [HttpPatch("{id}/position")]
        public IActionResult PatchPosition(int id, [FromBody] PositionRequest req)
        {
            using var conn = _db.Open();
            conn.Open();
            var cmd = new SqlCommand(
                "UPDATE cameras SET position_x = @x, position_y = @y WHERE id = @id", conn);
            cmd.Parameters.AddWithValue("@x", req.X);
            cmd.Parameters.AddWithValue("@y", req.Y);
            cmd.Parameters.AddWithValue("@id", id);
            cmd.ExecuteNonQuery();
            return Ok();
        }
    }

    public class PositionRequest { public decimal X { get; set; } public decimal Y { get; set; } }
}
```

> **Model note:** `camerasModel` needs two extra fields added:
> ```csharp
> [JsonProperty("position_x")] public decimal? position_x { get; set; }
> [JsonProperty("position_y")] public decimal? position_y { get; set; }
> ```
> Also: the model currently has `NVR_CH` (string) AND `nvr_channel` (int) — frontend uses `nvr_channel` (int). Keep both but make sure `nvr_channel` is int.

---

### NvrsController.cs

**Route:** `GET /api/nvrs` — optional `?Site_ID=`

```csharp
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Data.SqlClient;
using BNO_Survei_Monitor.Helpers;
using BNO_Survei_Monitor.Models;

namespace BNO_Survei_Monitor.Controllers
{
    [ApiController]
    [Route("api/nvrs")]
    [Authorize]
    public class NvrsController : ControllerBase
    {
        private readonly DbHelper _db;
        public NvrsController(DbHelper db) { _db = db; }

        [HttpGet]
        public IActionResult GetNvrs([FromQuery] string? Site_ID)
        {
            var sql = "SELECT NVR_ID, Site_ID, Building_ID, Floor_ID, Room_ID, Rack_ID, " +
                      "device_name, brand, model, serial_no, mac_address, ip_internet, ip_cctv, " +
                      "total_channels, active_channels, hdd_total_tb, hdd_used_pct, " +
                      "recording_res, retention_days, record_status, " +
                      "status, fail_count, last_seen, notes, created_at, updated_at FROM nvrs";
            if (Site_ID != null) sql += " WHERE Site_ID = @site";

            using var conn = _db.Open();
            conn.Open();
            var cmd = new SqlCommand(sql, conn);
            if (Site_ID != null) cmd.Parameters.AddWithValue("@site", Site_ID);

            var list = new List<nvrsModel>();
            using var r = cmd.ExecuteReader();
            while (r.Read())
            {
                list.Add(new nvrsModel
                {
                    NVR_ID          = r.IsDBNull(0)  ? null : r.GetString(0),
                    Site_ID         = r.IsDBNull(1)  ? null : r.GetString(1),
                    Building_ID     = r.IsDBNull(2)  ? null : r.GetString(2),
                    Floor_ID        = r.IsDBNull(3)  ? null : r.GetString(3),
                    Room_ID         = r.IsDBNull(4)  ? null : r.GetString(4),
                    Rack_ID         = r.IsDBNull(5)  ? null : r.GetString(5),
                    device_name     = r.IsDBNull(6)  ? null : r.GetString(6),
                    brand           = r.IsDBNull(7)  ? null : r.GetString(7),
                    model           = r.IsDBNull(8)  ? null : r.GetString(8),
                    serial_no       = r.IsDBNull(9)  ? null : r.GetString(9),
                    mac_address     = r.IsDBNull(10) ? null : r.GetString(10),
                    ip_internet     = r.IsDBNull(11) ? null : r.GetString(11),
                    ip_cctv         = r.IsDBNull(12) ? null : r.GetString(12),
                    total_channels  = r.IsDBNull(13) ? null : r.GetInt32(13),
                    active_channels = r.IsDBNull(14) ? null : r.GetInt32(14),
                    hdd_total_tb    = r.IsDBNull(15) ? null : r.GetDecimal(15),
                    hdd_used_pct    = r.IsDBNull(16) ? null : r.GetDecimal(16),
                    recording_res   = r.IsDBNull(17) ? null : r.GetString(17),
                    retention_days  = r.IsDBNull(18) ? null : r.GetInt32(18),
                    record_status   = r.IsDBNull(19) ? null : r.GetString(19),
                    status          = r.IsDBNull(20) ? null : r.GetString(20),
                    fail_count      = r.IsDBNull(21) ? null : r.GetInt32(21),
                    last_seen       = r.IsDBNull(22) ? null : r.GetString(22),
                    notes           = r.IsDBNull(23) ? null : r.GetString(23),
                    created_at      = r.IsDBNull(24) ? null : r.GetString(24),
                    updated_at      = r.IsDBNull(25) ? null : r.GetString(25),
                });
            }
            return Ok(list);
        }
    }
}
```

---

### PoeSwitchesController.cs

**Route:** `GET /api/poe-switches` — optional `?Site_ID=`

```csharp
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Data.SqlClient;
using BNO_Survei_Monitor.Helpers;
using BNO_Survei_Monitor.Models;

namespace BNO_Survei_Monitor.Controllers
{
    [ApiController]
    [Route("api/poe-switches")]
    [Authorize]
    public class PoeSwitchesController : ControllerBase
    {
        private readonly DbHelper _db;
        public PoeSwitchesController(DbHelper db) { _db = db; }

        [HttpGet]
        public IActionResult GetSwitches([FromQuery] string? Site_ID)
        {
            var sql = "SELECT SW_ID, Site_ID, Building_ID, Floor_ID, Room_ID, Rack_ID, " +
                      "device_name, switch_type, brand, model, serial_no, mac_address, ip_address, " +
                      "total_ports, poe_ports, poe_budget_w, poe_used_w, " +
                      "status, fail_count, last_seen, notes, created_at, updated_at FROM poe_switches";
            if (Site_ID != null) sql += " WHERE Site_ID = @site";

            using var conn = _db.Open();
            conn.Open();
            var cmd = new SqlCommand(sql, conn);
            if (Site_ID != null) cmd.Parameters.AddWithValue("@site", Site_ID);

            var list = new List<poeSwitchesModel>();
            using var r = cmd.ExecuteReader();
            while (r.Read())
            {
                list.Add(new poeSwitchesModel
                {
                    SW_ID       = r.IsDBNull(0)  ? null : r.GetString(0),
                    Site_ID     = r.IsDBNull(1)  ? null : r.GetString(1),
                    Building_ID = r.IsDBNull(2)  ? null : r.GetString(2),
                    Floor_ID    = r.IsDBNull(3)  ? null : r.GetString(3),
                    Room_ID     = r.IsDBNull(4)  ? null : r.GetString(4),
                    Rack_ID     = r.IsDBNull(5)  ? null : r.GetString(5),
                    device_name = r.IsDBNull(6)  ? null : r.GetString(6),
                    switch_type = r.IsDBNull(7)  ? null : r.GetString(7),
                    brand       = r.IsDBNull(8)  ? null : r.GetString(8),
                    model       = r.IsDBNull(9)  ? null : r.GetString(9),
                    serial_no   = r.IsDBNull(10) ? null : r.GetString(10),
                    mac_address = r.IsDBNull(11) ? null : r.GetString(11),
                    ip_address  = r.IsDBNull(12) ? null : r.GetString(12),
                    total_ports = r.IsDBNull(13) ? null : r.GetInt32(13),
                    poe_ports   = r.IsDBNull(14) ? null : r.GetInt32(14),
                    poe_budget_w= r.IsDBNull(15) ? null : r.GetInt32(15),
                    poe_used_w  = r.IsDBNull(16) ? null : r.GetInt32(16),
                    status      = r.IsDBNull(17) ? null : r.GetString(17),
                    fail_count  = r.IsDBNull(18) ? null : r.GetInt32(18),
                    last_seen   = r.IsDBNull(19) ? null : r.GetString(19),
                    notes       = r.IsDBNull(20) ? null : r.GetString(20),
                    created_at  = r.IsDBNull(21) ? null : r.GetString(21),
                    updated_at  = r.IsDBNull(22) ? null : r.GetString(22),
                });
            }
            return Ok(list);
        }
    }
}
```

---

### UsersController.cs

**Route:** `GET /api/users` — admin only, **must NOT return `pw_hash`**

```csharp
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Data.SqlClient;
using BNO_Survei_Monitor.Helpers;

namespace BNO_Survei_Monitor.Controllers
{
    [ApiController]
    [Route("api/users")]
    [Authorize(Roles = "admin")]
    public class UsersController : ControllerBase
    {
        private readonly DbHelper _db;
        public UsersController(DbHelper db) { _db = db; }

        [HttpGet]
        public IActionResult GetUsers()
        {
            using var conn = _db.Open();
            conn.Open();
            var cmd = new SqlCommand(
                "SELECT User_ID, username, display_name, role, is_active, last_login, created_at, updated_at FROM users",
                conn);
            // pw_hash intentionally excluded from SELECT

            var list = new List<object>();
            using var r = cmd.ExecuteReader();
            while (r.Read())
            {
                list.Add(new
                {
                    User_ID      = r.GetInt32(0),
                    username     = r.IsDBNull(1) ? null : r.GetString(1),
                    display_name = r.IsDBNull(2) ? null : r.GetString(2),
                    role         = r.IsDBNull(3) ? null : r.GetString(3),
                    is_active    = r.GetBoolean(4),
                    last_login   = r.IsDBNull(5) ? null : r.GetString(5),
                    created_at   = r.IsDBNull(6) ? null : r.GetString(6),
                    updated_at   = r.IsDBNull(7) ? null : r.GetString(7),
                });
            }
            return Ok(list);
        }
    }
}
```

---

### PingLogsController.cs

**Route:** `GET /api/ping-logs` — admin only, required: `?device_id=&device_type=`

```csharp
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Data.SqlClient;
using BNO_Survei_Monitor.Helpers;
using BNO_Survei_Monitor.Models;

namespace BNO_Survei_Monitor.Controllers
{
    [ApiController]
    [Route("api/ping-logs")]
    [Authorize(Roles = "admin")]
    public class PingLogsController : ControllerBase
    {
        private readonly DbHelper _db;
        public PingLogsController(DbHelper db) { _db = db; }

        [HttpGet]
        public IActionResult GetPingLogs([FromQuery] string device_id, [FromQuery] string device_type)
        {
            using var conn = _db.Open();
            conn.Open();
            var cmd = new SqlCommand(
                "SELECT TOP 200 id, device_type, device_id, ip_address, is_alive, latency_ms, pinged_at " +
                "FROM ping_logs WHERE device_id = @did AND device_type = @dtype " +
                "ORDER BY pinged_at DESC",
                conn);
            cmd.Parameters.AddWithValue("@did", device_id ?? "");
            cmd.Parameters.AddWithValue("@dtype", device_type ?? "");

            var list = new List<pingLogsModel>();
            using var r = cmd.ExecuteReader();
            while (r.Read())
            {
                list.Add(new pingLogsModel
                {
                    id          = r.GetInt32(0),
                    device_type = r.IsDBNull(1) ? null : r.GetString(1),
                    device_id   = r.IsDBNull(2) ? null : r.GetString(2),
                    ip_address  = r.IsDBNull(3) ? null : r.GetString(3),
                    is_alive    = r.GetBoolean(4),
                    latency_ms  = r.IsDBNull(5) ? null : r.GetDecimal(5),
                    pinged_at   = r.IsDBNull(6) ? null : r.GetString(6),
                });
            }
            return Ok(list);
        }
    }
}
```

---

### AlertLogsController.cs

**Route:** `GET /api/alert-logs` — admin only

```csharp
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Data.SqlClient;
using BNO_Survei_Monitor.Helpers;
using BNO_Survei_Monitor.Models;

namespace BNO_Survei_Monitor.Controllers
{
    [ApiController]
    [Route("api/alert-logs")]
    [Authorize(Roles = "admin")]
    public class AlertLogsController : ControllerBase
    {
        private readonly DbHelper _db;
        public AlertLogsController(DbHelper db) { _db = db; }

        [HttpGet]
        public IActionResult GetAlertLogs()
        {
            using var conn = _db.Open();
            conn.Open();
            var cmd = new SqlCommand(
                "SELECT TOP 100 id, device_type, device_id, device_name, brand, ip_address, " +
                "site_name, building_name, floor_name, alert_type, message, webhook_sent, " +
                "resolved_at, alerted_at, updated_at " +
                "FROM alert_logs ORDER BY alerted_at DESC",
                conn);

            var list = new List<alertLogsModel>();
            using var r = cmd.ExecuteReader();
            while (r.Read())
            {
                list.Add(new alertLogsModel
                {
                    id            = r.GetInt32(0),
                    device_type   = r.IsDBNull(1)  ? null : r.GetString(1),
                    device_id     = r.IsDBNull(2)  ? null : r.GetString(2),
                    device_name   = r.IsDBNull(3)  ? null : r.GetString(3),
                    brand         = r.IsDBNull(4)  ? null : r.GetString(4),
                    ip_address    = r.IsDBNull(5)  ? null : r.GetString(5),
                    site_name     = r.IsDBNull(6)  ? null : r.GetString(6),
                    building_name = r.IsDBNull(7)  ? null : r.GetString(7),
                    floor_name    = r.IsDBNull(8)  ? null : r.GetString(8),
                    alert_type    = r.IsDBNull(9)  ? null : r.GetString(9),
                    message       = r.IsDBNull(10) ?    "" : r.GetString(10),
                    webhook_sent  = r.GetBoolean(11),
                    resolved_at   = r.IsDBNull(12) ? null : r.GetString(12),
                    alerted_at    = r.IsDBNull(13) ? null : r.GetString(13),
                    updated_at    = r.IsDBNull(14) ?    "" : r.GetString(14),
                });
            }
            return Ok(list);
        }
    }
}
```

---

### DashboardController.cs

**Route:** `GET /api/dashboard/summary` — returns aggregated stats per site

```csharp
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Data.SqlClient;
using BNO_Survei_Monitor.Helpers;

namespace BNO_Survei_Monitor.Controllers
{
    [ApiController]
    [Route("api/dashboard")]
    [Authorize]
    public class DashboardController : ControllerBase
    {
        private readonly DbHelper _db;
        public DashboardController(DbHelper db) { _db = db; }

        [HttpGet("summary")]
        public IActionResult GetSummary()
        {
            using var conn = _db.Open();
            conn.Open();

            // One row per site — aggregated counts
            var cmd = new SqlCommand(@"
                SELECT
                    s.Site_ID    AS siteId,
                    s.site_code  AS siteCode,
                    s.site_name  AS siteName,
                    COUNT(DISTINCT c.id)                                            AS totalCameras,
                    SUM(CASE WHEN c.status='online'  THEN 1 ELSE 0 END)            AS camerasOnline,
                    SUM(CASE WHEN c.status='offline' THEN 1 ELSE 0 END)            AS camerasOffline,
                    SUM(CASE WHEN c.status='warning' THEN 1 ELSE 0 END)            AS camerasWarning,
                    COUNT(DISTINCT n.NVR_ID)                                        AS totalNvrs,
                    SUM(CASE WHEN n.status='offline' THEN 1 ELSE 0 END)            AS nvrsOffline,
                    COUNT(DISTINCT sw.SW_ID)                                        AS totalSwitches,
                    SUM(CASE WHEN sw.status='offline' THEN 1 ELSE 0 END)           AS switchesOffline,
                    COUNT(DISTINCT b.Building_ID)                                   AS totalBuildings,
                    COUNT(DISTINCT f.Floor_ID)                                      AS totalFloors,
                    COUNT(DISTINCT r.Room_ID)                                       AS totalRooms,
                    COUNT(DISTINCT rk.Rack_ID)                                      AS totalRacks
                FROM sites s
                LEFT JOIN cameras  c  ON c.Site_ID  = s.Site_ID
                LEFT JOIN nvrs     n  ON n.Site_ID  = s.Site_ID
                LEFT JOIN poe_switches sw ON sw.Site_ID = s.Site_ID
                LEFT JOIN buildings b ON b.Site_ID  = s.Site_ID
                LEFT JOIN floors    f ON f.Building_ID = b.Building_ID
                LEFT JOIN rooms     r ON r.Floor_ID = f.Floor_ID
                LEFT JOIN racks    rk ON rk.Room_ID = r.Room_ID
                GROUP BY s.Site_ID, s.site_code, s.site_name",
                conn);

            var list = new List<object>();
            using var r = cmd.ExecuteReader();
            while (r.Read())
            {
                list.Add(new
                {
                    siteId          = r.IsDBNull(0) ? null : r.GetString(0),
                    siteCode        = r.IsDBNull(1) ? null : r.GetString(1),
                    siteName        = r.IsDBNull(2) ? null : r.GetString(2),
                    totalCameras    = r.IsDBNull(3) ? 0 : r.GetInt32(3),
                    camerasOnline   = r.IsDBNull(4) ? 0 : r.GetInt32(4),
                    camerasOffline  = r.IsDBNull(5) ? 0 : r.GetInt32(5),
                    camerasWarning  = r.IsDBNull(6) ? 0 : r.GetInt32(6),
                    totalNvrs       = r.IsDBNull(7) ? 0 : r.GetInt32(7),
                    nvrsOffline     = r.IsDBNull(8) ? 0 : r.GetInt32(8),
                    totalSwitches   = r.IsDBNull(9) ? 0 : r.GetInt32(9),
                    switchesOffline = r.IsDBNull(10)? 0 : r.GetInt32(10),
                    totalBuildings  = r.IsDBNull(11)? 0 : r.GetInt32(11),
                    totalFloors     = r.IsDBNull(12)? 0 : r.GetInt32(12),
                    totalRooms      = r.IsDBNull(13)? 0 : r.GetInt32(13),
                    totalRacks      = r.IsDBNull(14)? 0 : r.GetInt32(14),
                });
            }
            return Ok(list);
        }
    }
}
```

---

## Step 4 — DB Table Names

Based on the model file names, assumed SQL table names:

| Model file | Assumed table name |
|---|---|
| `camerasModel.cs` | `cameras` |
| `nvrsModel.cs` | `nvrs` |
| `poeSwitchesModel.cs` | `poe_switches` |
| `usersModel.cs` | `users` |
| `pingLogsModel.cs` | `ping_logs` |
| `alertLogsModel.cs` | `alert_logs` |
| `sitesModel.cs` | `sites` |
| `buildingsModel.cs` | `buildings` |
| `floorsModel.cs` | `floors` |
| `roomsModel.cs` | `rooms` |
| `racksModel.cs` | `racks` |

> **If table names differ** — update the SQL strings in each controller accordingly.

---

## Step 5 — DB Column Additions Needed

The `cameras` table needs 2 new columns for floor plan drag-and-drop:
```sql
ALTER TABLE cameras ADD position_x DECIMAL(10,4) NULL;
ALTER TABLE cameras ADD position_y DECIMAL(10,4) NULL;
```

The `sites` table needs `site_code` and `site_name` columns (used in DashboardController).

---

## Phase 1 (Demo — must have by 2026-05-29)

| # | Controller | Route | Priority |
|---|---|---|---|
| 1 | AuthController | `POST /api/auth/login` | **CRITICAL** |
| 2 | CamerasController | `GET /api/cameras` | High |
| 3 | NvrsController | `GET /api/nvrs` | High |
| 4 | PoeSwitchesController | `GET /api/poe-switches` | High |
| 5 | UsersController | `GET /api/users` | High |
| 6 | PingLogsController | `GET /api/ping-logs` | Medium (graceful fallback exists) |
| 7 | AlertLogsController | `GET /api/alert-logs` | Medium (graceful fallback exists) |
| 8 | DashboardController | `GET /api/dashboard/summary` | Medium (graceful fallback exists) |

## Phase 2 (After demo — for full integration)

- `GET /api/sites` → SitesPage
- `GET /api/buildings?Site_ID=` → BuildingDetailPage
- `GET /api/floors?Building_ID=` → FloorPlanPage
- `GET /api/floors/{id}/floor-plan/image` → FloorPlanPage background image
- `GET /api/racks?Room_ID=` → RackDetailPage
- `GET /api/nvrs/{id}` → NVRDetailPage
- `GET /api/poe-switches/{id}` → SwitchDetailPage

---

## Port Reminder

`launchSettings.json` → `http://localhost:5205`  
Frontend `client.ts` → calling `http://localhost:5205/api`  
Make sure IIS Express / `dotnet run` uses the http profile (not https) for dev.

---

*Reply via `BACKEND_REPLY.md` in this folder. Questions about frontend types → check `src/api/types.ts`.*
