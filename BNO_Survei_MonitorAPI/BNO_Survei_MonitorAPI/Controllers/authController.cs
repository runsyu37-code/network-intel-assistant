using BNO_Survei_MonitorAPI.ConnectDB;
using BNO_Survei_MonitorAPI.Helpers;
using System;
using System.Data.SqlClient;
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

        [HttpPost]
        [Route("api/auth/login")]
        public IHttpActionResult Login([FromBody] LoginRequest req)
        {
            if (req == null || string.IsNullOrWhiteSpace(req.username) || string.IsNullOrWhiteSpace(req.password))
                return BadRequest("username and password are required");

            using (var con = new SqlConnection(ConnectionDB.ConnectionStringCN))
            {
                con.Open();
                var cmd = new SqlCommand(
                    "SELECT User_ID, username, pw_hash, display_name, role FROM users WHERE username = @username AND is_active = 1",
                    con
                );
                cmd.Parameters.AddWithValue("@username", req.username);

                using (var reader = cmd.ExecuteReader())
                {
                    if (!reader.Read())
                        return Unauthorized();

                    var storedHash = reader["pw_hash"].ToString();
                    if (!BCrypt.Net.BCrypt.Verify(req.password, storedHash))
                        return Unauthorized();

                    var userId = reader["User_ID"].ToString();
                    var username = reader["username"].ToString();
                    var role = reader["role"].ToString();
                    var displayName = reader["display_name"] == DBNull.Value ? username : reader["display_name"].ToString();

                    reader.Close();

                    // Update last_login
                    var updateCmd = new SqlCommand(
                        "UPDATE users SET last_login = GETUTCDATE() WHERE username = @username", con
                    );
                    updateCmd.Parameters.AddWithValue("@username", username);
                    updateCmd.ExecuteNonQuery();

                    var token = JwtHelper.GenerateToken(userId, username, role);

                    return Ok(new
                    {
                        token,
                        role,
                        displayName,
                        expiresIn = JwtHelper.ExpiryHours * 3600
                    });
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
