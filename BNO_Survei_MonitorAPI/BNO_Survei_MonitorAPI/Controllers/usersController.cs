using BNO_Survei_MonitorAPI.ConnectDB;
using System;
using System.Collections.Generic;
using System.Data.SqlClient;
using System.Linq;
using System.Web.Http;
using TestAPBNO_Survei_MonitorAPI.Models;
using HttpGetAttribute = System.Web.Http.HttpGetAttribute;
using HttpPostAttribute = System.Web.Http.HttpPostAttribute;
using RouteAttribute = System.Web.Http.RouteAttribute;

namespace BNO_Survei_MonitorAPI.Controllers
{
    public class usersController : ApiController
    {
        #region GET : users
        [Route("api/Getusers")]
        [HttpGet]
        public IHttpActionResult Getusers()
        {
            List<usersModel> ListRP = new List<usersModel>();
            using (SqlConnection con = new SqlConnection(ConnectionDB.ConnectionStringCN))
            {
                con.Open();
                string sql = "SELECT [User_ID],[username],[pw_hash],[display_name],[role],[is_active],[last_login],[created_at],[updated_at] FROM [dbo].[users] WHERE 1=1";
                SqlCommand cmd = new SqlCommand(sql, con);
                using (var reader = cmd.ExecuteReader())
                {
                    while (reader.Read())
                    {
                        ListRP.Add(new usersModel
                        {
                            User_ID      = Convert.ToInt32(reader["User_ID"]),
                            username     = reader["username"].ToString(),
                            pw_hash      = reader["pw_hash"].ToString(),
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
        [Route("api/Saveusers")]
        [HttpPost]
        public IHttpActionResult Saveusers([FromBody] List<usersModel> modelList)
        {
            if (modelList == null || modelList.Count == 0)
                return BadRequest("ไม่มีข้อมูลที่ส่งมา");

            if (modelList.Any(x => string.IsNullOrWhiteSpace(x.username)))
                return BadRequest("username ห้ามว่าง");

            int insertCount = 0;
            try
            {
                using (var con = new SqlConnection(ConnectionDB.ConnectionStringCN))
                {
                    con.Open();
                    string insertSql = @"
                        INSERT INTO [dbo].[users] ([username],[pw_hash],[display_name],[role],[is_active],[last_login])
                        VALUES (@username,@pw_hash,@display_name,@role,@is_active,@last_login);";

                    foreach (var item in modelList)
                    {
                        using (var cmd = new SqlCommand(insertSql, con))
                        {
                            AddParameters(cmd, item);
                            cmd.ExecuteNonQuery();
                            insertCount++;
                        }
                    }
                }
                return Ok(new { success = true, inserted = insertCount, message = $"เพิ่มข้อมูลใหม่สำเร็จ {insertCount} records" });
            }
            catch (SqlException ex) { return InternalServerError(ex); }
            catch (Exception ex)    { return InternalServerError(ex); }
        }

        private void AddParameters(SqlCommand cmd, usersModel item)
        {
            cmd.Parameters.AddWithValue("@username",     string.IsNullOrWhiteSpace(item.username)     ? (object)DBNull.Value : item.username);
            cmd.Parameters.AddWithValue("@pw_hash",      string.IsNullOrWhiteSpace(item.pw_hash)      ? (object)DBNull.Value : item.pw_hash);
            cmd.Parameters.AddWithValue("@display_name", string.IsNullOrWhiteSpace(item.display_name) ? (object)DBNull.Value : item.display_name);
            cmd.Parameters.AddWithValue("@role",         string.IsNullOrWhiteSpace(item.role)         ? (object)DBNull.Value : item.role);
            cmd.Parameters.AddWithValue("@is_active",    item.is_active);
            cmd.Parameters.AddWithValue("@last_login",   string.IsNullOrWhiteSpace(item.last_login)   ? (object)DBNull.Value : item.last_login);
        }
        #endregion

        #region Update : users
        [Route("api/Updateusers/{User_ID}")]
        [HttpPost]
        public IHttpActionResult Updateusers(int User_ID, [FromBody] usersModel model)
        {
            if (model == null || string.IsNullOrWhiteSpace(model.username))
                return BadRequest("ห้าม Null");

            try
            {
                using (var con = new SqlConnection(ConnectionDB.ConnectionStringCN))
                {
                    con.Open();
                    string sql = @"
                        UPDATE [dbo].[users]
                        SET username     = @username,
                            pw_hash      = @pw_hash,
                            display_name = @display_name,
                            role         = @role,
                            is_active    = @is_active,
                            last_login   = @last_login,
                            updated_at   = SYSUTCDATETIME()
                        WHERE User_ID = @User_ID;";

                    using (var cmd = new SqlCommand(sql, con))
                    {
                        cmd.Parameters.AddWithValue("@User_ID",      User_ID);
                        cmd.Parameters.AddWithValue("@username",     string.IsNullOrWhiteSpace(model.username)     ? (object)DBNull.Value : model.username);
                        cmd.Parameters.AddWithValue("@pw_hash",      string.IsNullOrWhiteSpace(model.pw_hash)      ? (object)DBNull.Value : model.pw_hash);
                        cmd.Parameters.AddWithValue("@display_name", string.IsNullOrWhiteSpace(model.display_name) ? (object)DBNull.Value : model.display_name);
                        cmd.Parameters.AddWithValue("@role",         string.IsNullOrWhiteSpace(model.role)         ? (object)DBNull.Value : model.role);
                        cmd.Parameters.AddWithValue("@is_active",    model.is_active);
                        cmd.Parameters.AddWithValue("@last_login",   string.IsNullOrWhiteSpace(model.last_login)   ? (object)DBNull.Value : model.last_login);

                        int rows = cmd.ExecuteNonQuery();
                        if (rows == 0) return NotFound();
                    }
                }
                return Ok(new { success = true, User_ID });
            }
            catch (Exception ex) { return InternalServerError(ex); }
        }
        #endregion

        #region Delete : users
        [HttpPost]
        [Route("api/Deleteusers/{User_ID}")]
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
            catch (Exception ex) { return InternalServerError(ex); }
        }
        #endregion
    }
}
