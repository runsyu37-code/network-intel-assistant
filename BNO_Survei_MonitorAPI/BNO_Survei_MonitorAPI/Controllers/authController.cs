using BNO_Survei_MonitorAPI.ConnectDB;
using BNO_Survei_MonitorAPI.Helpers;
using System;
using System.Collections.Generic;
using System.Data.SqlClient;
using System.Net;
using System.Net.Http;
using System.Web;
using System.Web.Http;

namespace BNO_Survei_MonitorAPI.Controllers
{
    [AllowAnonymous]
    public class authController : ApiController
    {
        public class LoginRequest
        {
            public string username { get; set; }
            public string password { get; set; }
        }

        private class AttemptRecord
        {
            public int FailCount;
            public DateTime WindowStart;
            public DateTime? LockedUntil;
        }

        private static readonly Dictionary<string, AttemptRecord> _attempts =
            new Dictionary<string, AttemptRecord>(StringComparer.OrdinalIgnoreCase);
        private static readonly object _lock = new object();
        private static long _requestCount = 0;
        private const int EvictionInterval = 200;

        private const int MaxFails       = 10;
        private const int WindowMinutes  = 5;
        private const int LockoutMinutes = 15;

        [HttpPost]
        [Route("api/auth/login")]
        public IHttpActionResult Login([FromBody] LoginRequest req)
        {
            if (req == null || string.IsNullOrWhiteSpace(req.username) || string.IsNullOrWhiteSpace(req.password))
                return BadRequest("username and password are required");

            var ip  = GetClientIp();
            var key = req.username.Trim(); // per-username lockout key (case-insensitive via OrdinalIgnoreCase dict)

            // Lazy stale-entry eviction every N requests
            if (System.Threading.Interlocked.Increment(ref _requestCount) % EvictionInterval == 0)
                EvictStaleEntries();

            lock (_lock)
            {
                if (_attempts.TryGetValue(key, out var rec) && rec.LockedUntil.HasValue)
                {
                    if (DateTime.UtcNow < rec.LockedUntil.Value)
                    {
                        var secs = (int)(rec.LockedUntil.Value - DateTime.UtcNow).TotalSeconds;
                        return TooManyRequests(secs);
                    }
                    _attempts.Remove(key);
                }
            }

            using (var con = new SqlConnection(ConnectionDB.ConnectionStringCN))
            {
                con.Open();
                var cmd = new SqlCommand(
                    "SELECT User_ID, username, pw_hash, display_name, role FROM users WHERE username = @username AND is_active = 1",
                    con);
                cmd.Parameters.AddWithValue("@username", req.username);

                using (var reader = cmd.ExecuteReader())
                {
                    if (!reader.Read())
                        return HandleFailedAttempt(ip, req.username);

                    var storedHash = reader["pw_hash"].ToString();
                    if (!BCrypt.Net.BCrypt.Verify(req.password, storedHash))
                        return HandleFailedAttempt(ip, req.username);

                    var userId      = reader["User_ID"].ToString();
                    var username    = reader["username"].ToString();
                    var role        = reader["role"].ToString();
                    var displayName = reader["display_name"] == DBNull.Value ? username : reader["display_name"].ToString();
                    reader.Close();

                    lock (_lock) { _attempts.Remove(key); }

                    var updateCmd = new SqlCommand(
                        "UPDATE users SET last_login = GETUTCDATE() WHERE username = @username", con);
                    updateCmd.Parameters.AddWithValue("@username", username);
                    updateCmd.ExecuteNonQuery();

                    var token = JwtHelper.GenerateToken(userId, username, role);
                    return Ok(new { token, role, displayName, expiresIn = JwtHelper.ExpiryHours * 3600 });
                }
            }
        }

        private IHttpActionResult HandleFailedAttempt(string ip, string username)
        {
            var now = DateTime.UtcNow;
            var key = username.Trim();
            bool justLocked = false;

            lock (_lock)
            {
                if (!_attempts.TryGetValue(key, out var rec) || (now - rec.WindowStart).TotalMinutes >= WindowMinutes)
                {
                    rec = new AttemptRecord { FailCount = 0, WindowStart = now };
                    _attempts[key] = rec;
                }

                rec.FailCount++;

                if (rec.FailCount >= MaxFails && !rec.LockedUntil.HasValue)
                {
                    rec.LockedUntil = now.AddMinutes(LockoutMinutes);
                    justLocked = true;
                }
            }

            if (justLocked)
                LogLockout(ip, username);

            lock (_lock)
            {
                if (_attempts.TryGetValue(key, out var current) && current.LockedUntil.HasValue)
                {
                    var secs = Math.Max(0, (int)(current.LockedUntil.Value - now).TotalSeconds);
                    return TooManyRequests(secs);
                }
            }

            return Unauthorized();
        }

        private static void EvictStaleEntries()
        {
            var now = DateTime.UtcNow;
            lock (_lock)
            {
                var toRemove = new System.Collections.Generic.List<string>();
                foreach (var kvp in _attempts)
                {
                    bool lockExpired  = !kvp.Value.LockedUntil.HasValue || kvp.Value.LockedUntil.Value <= now;
                    bool windowExpired = (now - kvp.Value.WindowStart).TotalMinutes >= WindowMinutes;
                    if (lockExpired && windowExpired)
                        toRemove.Add(kvp.Key);
                }
                foreach (var k in toRemove) _attempts.Remove(k);
            }
        }

        private IHttpActionResult TooManyRequests(int retryAfterSeconds)
        {
            var resp = Request.CreateResponse(
                (HttpStatusCode)429,
                new { Message = $"Too many failed login attempts. Try again in {LockoutMinutes} minutes." });
            resp.Headers.Add("Retry-After", retryAfterSeconds.ToString());
            return ResponseMessage(resp);
        }

        private string GetClientIp()
        {
            // X-Forwarded-For intentionally not used: no reverse proxy sits in front of IIS
            // on this intranet deployment. Trusting that header would allow any client to
            // spoof a victim IP and trigger their lockout (trivial DoS).
            // NOTE: In IIS Express (dev), UserHostAddress always returns 127.0.0.1 —
            // rate limiting during local testing is a shared counter for all localhost requests.
            // NOTE: Rate limiting state is in-memory and does not survive app pool recycles
            // or deployments. Acceptable for v1 on a 30-user intranet. Migrate to SQL-backed
            // storage if deploy frequency increases or external access is ever enabled.
            var ctx = HttpContext.Current;
            if (ctx == null) return "unknown";
            return ctx.Request.UserHostAddress ?? "unknown";
        }

        private void LogLockout(string ip, string username)
        {
            try
            {
                using (var con = new SqlConnection(ConnectionDB.ConnectionStringCN))
                {
                    con.Open();
                    var cmd = new SqlCommand(
                        @"INSERT INTO audit_logs (user_id, action, table_name, record_id, old_value, new_value)
                          VALUES (NULL, @action, 'auth', NULL, NULL, @val)", con);
                    cmd.Parameters.AddWithValue("@action", "lockout");
                    cmd.Parameters.AddWithValue("@val",
                        $"username '{username}' locked after {MaxFails} failed attempts (from IP: {ip})");
                    cmd.ExecuteNonQuery();
                }
            }
            catch (Exception ex)
            {
                // Audit DB write failed — fall back to file log (grep-able, no admin privileges needed)
                try
                {
                    var appRoot = System.Web.HttpRuntime.AppDomainAppPath;
                    var logPath = System.IO.Path.Combine(appRoot, "App_Data", "security.log");
                    var message = $"{DateTime.UtcNow:O} LOCKOUT_AUDIT_FAIL user={username} ip={ip} err={ex.Message}{Environment.NewLine}";

                    // Rotate at 10 MB so the file never grows unbounded
                    var fi = new System.IO.FileInfo(logPath);
                    if (fi.Exists && fi.Length > 10 * 1024 * 1024)
                        System.IO.File.Move(logPath, logPath + $".{DateTime.UtcNow:yyyyMMdd-HHmmss}.bak");

                    System.IO.File.AppendAllText(logPath, message);
                }
                catch (Exception fileEx)
                {
                    // File write also failed — last resort: IIS trace log (always available, no setup required)
                    System.Diagnostics.Trace.TraceError(
                        $"SECURITY CRITICAL: Lockout audit double-failure. " +
                        $"Primary: {ex.Message} | File fallback: {fileEx.Message} | " +
                        $"Event: lockout for username '{username}' (IP: {ip})");
                }
            }
        }

        [HttpGet]
        [Route("api/auth/me")]
        public IHttpActionResult Me()
        {
            var principal = RequestContext.Principal;
            if (principal == null || !principal.Identity.IsAuthenticated)
                return Unauthorized();

            return Ok(new
            {
                username = principal.Identity.Name,
                role = principal.IsInRole("admin") ? "admin" : principal.IsInRole("user") ? "user" : "viewer"
            });
        }
    }
}
