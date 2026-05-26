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
            new Dictionary<string, AttemptRecord>(StringComparer.Ordinal);
        private static readonly object _lock = new object();

        private const int MaxFails       = 10;
        private const int WindowMinutes  = 5;
        private const int LockoutMinutes = 15;

        [HttpPost]
        [Route("api/auth/login")]
        public IHttpActionResult Login([FromBody] LoginRequest req)
        {
            if (req == null || string.IsNullOrWhiteSpace(req.username) || string.IsNullOrWhiteSpace(req.password))
                return BadRequest("username and password are required");

            var ip = GetClientIp();

            lock (_lock)
            {
                if (_attempts.TryGetValue(ip, out var rec) && rec.LockedUntil.HasValue)
                {
                    if (DateTime.UtcNow < rec.LockedUntil.Value)
                    {
                        var secs = (int)(rec.LockedUntil.Value - DateTime.UtcNow).TotalSeconds;
                        return TooManyRequests(secs);
                    }
                    _attempts.Remove(ip);
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

                    lock (_lock) { _attempts.Remove(ip); }

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
            bool justLocked = false;

            lock (_lock)
            {
                if (!_attempts.TryGetValue(ip, out var rec) || (now - rec.WindowStart).TotalMinutes >= WindowMinutes)
                {
                    rec = new AttemptRecord { FailCount = 0, WindowStart = now };
                    _attempts[ip] = rec;
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
                if (_attempts.TryGetValue(ip, out var current) && current.LockedUntil.HasValue)
                {
                    var secs = Math.Max(0, (int)(current.LockedUntil.Value - now).TotalSeconds);
                    return TooManyRequests(secs);
                }
            }

            return Unauthorized();
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
            var ctx = HttpContext.Current;
            if (ctx == null) return "unknown";
            var forwarded = ctx.Request.Headers["X-Forwarded-For"];
            if (!string.IsNullOrWhiteSpace(forwarded))
                return forwarded.Split(',')[0].Trim();
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
                        $"IP {ip} locked after {MaxFails} failed attempts (username: '{username}')");
                    cmd.ExecuteNonQuery();
                }
            }
            catch { }
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
