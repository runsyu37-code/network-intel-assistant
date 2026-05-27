using BNO_Survei_MonitorAPI.ConnectDB;
using BNO_Survei_MonitorAPI.Filters;
using System;
using System.Collections.Generic;
using System.Data.SqlClient;
using System.Linq;
using System.Web.Http;
using TestAPBNO_Survei_MonitorAPI.Models;
using HttpGetAttribute = System.Web.Http.HttpGetAttribute;
using HttpPostAttribute = System.Web.Http.HttpPostAttribute;
using HttpPutAttribute = System.Web.Http.HttpPutAttribute;
using HttpDeleteAttribute = System.Web.Http.HttpDeleteAttribute;
using RouteAttribute = System.Web.Http.RouteAttribute;

namespace BNO_Survei_MonitorAPI.Controllers
{
    public class usersController : ApiController
    {
        #region GET : users
        [Route("api/users")]
        [HttpGet]
        [RequireRole("admin")]
        public IHttpActionResult GetUsers(string role = null, int? User_ID = null)
        {
            List<usersModel> ListRP = new List<usersModel>();
            using (SqlConnection con = new SqlConnection(ConnectionDB.ConnectionStringCN))
            {
                con.Open();
                string sql = "SELECT [User_ID],[username],[display_name],[role],[is_active],[last_login],[created_at],[updated_at] FROM [dbo].[users] WHERE 1=1";
                if (!string.IsNullOrWhiteSpace(role)) sql += " AND role = @role";
                if (User_ID.HasValue)                 sql += " AND User_ID = @User_ID";
                SqlCommand cmd = new SqlCommand(sql, con);
                if (!string.IsNullOrWhiteSpace(role)) cmd.Parameters.AddWithValue("@role", role);
                if (User_ID.HasValue)                 cmd.Parameters.AddWithValue("@User_ID", User_ID.Value);
                using (var reader = cmd.ExecuteReader())
                {
                    while (reader.Read())
                    {
                        ListRP.Add(new usersModel
                        {
                            User_ID      = Convert.ToInt32(reader["User_ID"]),
                            username     = reader["username"].ToString(),
                            display_name = reader["display_name"] == DBNull.Value ? null : reader["display_name"].ToString(),
                            role         = reader["role"].ToString(),
                            is_active    = Convert.ToBoolean(reader["is_active"]),
                            last_login   = reader["last_login"] == DBNull.Value ? null : reader["last_login"].ToString(),
                            created_at   = reader["created_at"].ToString(),
                            updated_at   = reader["updated_at"].ToString(),
                        });
                    }
                }
            }
            return Json(ListRP);
        }
        #endregion

        #region Save : users
        [Route("api/users")]
        [HttpPost]
        [RequireRole("admin")]
        public IHttpActionResult Saveusers([FromBody] List<usersModel> modelList)
        {
            if (modelList == null || modelList.Count == 0)
                return BadRequest("No data provided");

            if (modelList.Any(x => string.IsNullOrWhiteSpace(x.username)))
                return BadRequest("username is required");

            if (modelList.Any(x => string.IsNullOrWhiteSpace(x.password)))
                return BadRequest("password is required");

            if (modelList.Any(x => string.IsNullOrWhiteSpace(x.role)))
                return BadRequest("role is required");

            var invalidRole = modelList.FirstOrDefault(x => !ValidRoles.Contains(x.role));
            if (invalidRole != null)
                return BadRequest($"Invalid role value: {invalidRole.role}");

            int insertCount = 0;
            try
            {
                using (var con = new SqlConnection(ConnectionDB.ConnectionStringCN))
                {
                    con.Open();
                    string insertSql = @"
                        INSERT INTO [dbo].[users] ([username],[pw_hash],[display_name],[role],[is_active],[last_login])
                        VALUES (@username,@pw_hash,@display_name,@role,@is_active,@last_login);";

                    using (var tx = con.BeginTransaction())
                    {
                        foreach (var item in modelList)
                        {
                            using (var cmd = new SqlCommand(insertSql, con, tx))
                            {
                                AddParameters(cmd, item);
                                cmd.ExecuteNonQuery();
                                insertCount++;
                            }
                        }
                        tx.Commit();
                    }
                }
                return Ok(new { success = true, inserted = insertCount });
            }
            catch (SqlException) { return InternalServerError(new Exception("Database error during save")); }
            catch (Exception) { return InternalServerError(new Exception("An internal error occurred")); }
        }

        private static readonly HashSet<string> ValidRoles =
            new HashSet<string>(StringComparer.Ordinal) { "admin", "user", "viewer" };

        private void AddParameters(SqlCommand cmd, usersModel item)
        {
            cmd.Parameters.AddWithValue("@username", string.IsNullOrWhiteSpace(item.username) ? (object)DBNull.Value : item.username);
            cmd.Parameters.AddWithValue("@pw_hash",  BCrypt.Net.BCrypt.HashPassword(item.password));
            cmd.Parameters.AddWithValue("@display_name", string.IsNullOrWhiteSpace(item.display_name) ? (object)DBNull.Value : item.display_name);
            cmd.Parameters.AddWithValue("@role",         string.IsNullOrWhiteSpace(item.role)         ? (object)DBNull.Value : item.role);
            cmd.Parameters.AddWithValue("@is_active",    item.is_active);
            cmd.Parameters.AddWithValue("@last_login",   string.IsNullOrWhiteSpace(item.last_login)   ? (object)DBNull.Value : item.last_login);
        }
        #endregion

        #region Update : users
        [Route("api/users/{User_ID}")]
        [HttpPost]
        [RequireRole("admin")]
        public IHttpActionResult Updateusers(int User_ID, [FromBody] usersModel model)
        {
            if (model == null || string.IsNullOrWhiteSpace(model.username))
                return BadRequest("username is required");

            // role is optional on update — omit or null to keep existing role
            if (!string.IsNullOrWhiteSpace(model.role) && !ValidRoles.Contains(model.role))
                return BadRequest($"Invalid role value: {model.role}");

            try
            {
                using (var con = new SqlConnection(ConnectionDB.ConnectionStringCN))
                {
                    con.Open();
                    string sql = @"
                        UPDATE [dbo].[users]
                        SET username     = @username,
                            pw_hash      = CASE WHEN @newPwHash IS NULL THEN pw_hash ELSE @newPwHash END,
                            display_name = @display_name,
                            role         = CASE WHEN @role IS NULL THEN role ELSE @role END,
                            is_active    = @is_active,
                            last_login   = @last_login,
                            updated_at   = SYSUTCDATETIME()
                        WHERE User_ID = @User_ID;";

                    using (var cmd = new SqlCommand(sql, con))
                    {
                        cmd.Parameters.AddWithValue("@User_ID",   User_ID);
                        cmd.Parameters.AddWithValue("@username",  string.IsNullOrWhiteSpace(model.username) ? (object)DBNull.Value : model.username);
                        cmd.Parameters.AddWithValue("@newPwHash", string.IsNullOrWhiteSpace(model.password) ? (object)DBNull.Value : BCrypt.Net.BCrypt.HashPassword(model.password));
                        cmd.Parameters.AddWithValue("@display_name", string.IsNullOrWhiteSpace(model.display_name) ? (object)DBNull.Value : model.display_name);
                        cmd.Parameters.AddWithValue("@role",         string.IsNullOrWhiteSpace(model.role) ? (object)DBNull.Value : model.role);
                        cmd.Parameters.AddWithValue("@is_active",    model.is_active);
                        cmd.Parameters.AddWithValue("@last_login",   string.IsNullOrWhiteSpace(model.last_login)   ? (object)DBNull.Value : model.last_login);

                        int rows = cmd.ExecuteNonQuery();
                        if (rows == 0) return NotFound();
                    }
                }
                return Ok(new { success = true, User_ID });
            }
            catch (Exception) { return InternalServerError(new Exception("An internal error occurred")); }
        }
        #endregion

        #region Delete : users
        [HttpPost]
        [Route("api/users/delete/{User_ID}")]
        [RequireRole("admin")]
        public IHttpActionResult Deleteusers(int User_ID)
        {
            try
            {
                using (var con = new SqlConnection(ConnectionDB.ConnectionStringCN))
                {
                    con.Open();
                    string sql = @"DELETE FROM [dbo].[users] WHERE User_ID = @User_ID;";
                    using (var cmd = new SqlCommand(sql, con))
                    {
                        cmd.Parameters.AddWithValue("@User_ID", User_ID);
                        int rows = cmd.ExecuteNonQuery();
                        if (rows == 0) return NotFound();
                        return Ok(new { success = true, deleted = rows, User_ID });
                    }
                }
            }
            catch (Exception) { return InternalServerError(new Exception("An internal error occurred")); }
        }
        #endregion
    }
}

