using BNO_Survei_MonitorAPI.ConnectDB;
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
    public class auditLogsController : ApiController
    {
        #region GET : audit_logs
        [Route("api/GetauditLogs")]
        [HttpGet]
        public IHttpActionResult GetauditLogs()
        {
            List<auditLogsModel> ListRP = new List<auditLogsModel>();
            using (SqlConnection con = new SqlConnection(ConnectionDB.ConnectionStringCN))
            {
                con.Open();
                string sql = "SELECT [id],[user_id],[action],[table_name],[record_id],[old_value],[new_value],[created_at] FROM [dbo].[audit_logs] WHERE 1=1";
                SqlCommand cmd = new SqlCommand(sql, con);
                using (var reader = cmd.ExecuteReader())
                {
                    while (reader.Read())
                    {
                        ListRP.Add(new auditLogsModel
                        {
                            id         = Convert.ToInt32(reader["id"]),
                            user_id    = reader["user_id"]   == DBNull.Value ? (int?)null : Convert.ToInt32(reader["user_id"]),
                            action     = reader["action"].ToString(),
                            table_name = reader["table_name"].ToString(),
                            record_id  = reader["record_id"].ToString(),
                            old_value  = reader["old_value"] == DBNull.Value ? null : reader["old_value"].ToString(),
                            new_value  = reader["new_value"] == DBNull.Value ? null : reader["new_value"].ToString(),
                            created_at = reader["created_at"].ToString(),
                        });
                    }
                }
            }
            return Json(ListRP);
        }
        #endregion

        #region Save : audit_logs
        [Route("api/SaveauditLogs")]
        [HttpPost]
        public IHttpActionResult SaveauditLogs([FromBody] List<auditLogsModel> modelList)
        {
            if (modelList == null || modelList.Count == 0)
                return BadRequest("ไม่มีข้อมูลที่ส่งมา");

            if (modelList.Any(x => string.IsNullOrWhiteSpace(x.action) || string.IsNullOrWhiteSpace(x.table_name)))
                return BadRequest("action และ table_name ห้ามว่าง");

            int insertCount = 0;
            try
            {
                using (var con = new SqlConnection(ConnectionDB.ConnectionStringCN))
                {
                    con.Open();
                    string insertSql = @"
                        INSERT INTO [dbo].[audit_logs] ([user_id],[action],[table_name],[record_id],[old_value],[new_value])
                        VALUES (@user_id,@action,@table_name,@record_id,@old_value,@new_value);";

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

        private void AddParameters(SqlCommand cmd, auditLogsModel item)
        {
            cmd.Parameters.AddWithValue("@user_id",    item.user_id.HasValue ? (object)item.user_id.Value : DBNull.Value);
            cmd.Parameters.AddWithValue("@action",     string.IsNullOrWhiteSpace(item.action)     ? (object)DBNull.Value : item.action);
            cmd.Parameters.AddWithValue("@table_name", string.IsNullOrWhiteSpace(item.table_name) ? (object)DBNull.Value : item.table_name);
            cmd.Parameters.AddWithValue("@record_id",  string.IsNullOrWhiteSpace(item.record_id)  ? (object)DBNull.Value : item.record_id);
            cmd.Parameters.AddWithValue("@old_value",  string.IsNullOrWhiteSpace(item.old_value)  ? (object)DBNull.Value : item.old_value);
            cmd.Parameters.AddWithValue("@new_value",  string.IsNullOrWhiteSpace(item.new_value)  ? (object)DBNull.Value : item.new_value);
        }
        #endregion

        #region Update : audit_logs
        [Route("api/UpdateauditLogs/{id}")]
        [HttpPut]
        public IHttpActionResult UpdateauditLogs(int id, [FromBody] auditLogsModel model)
        {
            if (model == null)
                return BadRequest("ห้าม Null");

            try
            {
                using (var con = new SqlConnection(ConnectionDB.ConnectionStringCN))
                {
                    con.Open();
                    string sql = @"
                        UPDATE [dbo].[audit_logs]
                        SET user_id    = @user_id,
                            action     = @action,
                            table_name = @table_name,
                            record_id  = @record_id,
                            old_value  = @old_value,
                            new_value  = @new_value
                        WHERE id = @id;";

                    using (var cmd = new SqlCommand(sql, con))
                    {
                        cmd.Parameters.AddWithValue("@id", id);
                        cmd.Parameters.AddWithValue("@user_id",    model.user_id.HasValue ? (object)model.user_id.Value : DBNull.Value);
                        cmd.Parameters.AddWithValue("@action",     string.IsNullOrWhiteSpace(model.action)     ? (object)DBNull.Value : model.action);
                        cmd.Parameters.AddWithValue("@table_name", string.IsNullOrWhiteSpace(model.table_name) ? (object)DBNull.Value : model.table_name);
                        cmd.Parameters.AddWithValue("@record_id",  string.IsNullOrWhiteSpace(model.record_id)  ? (object)DBNull.Value : model.record_id);
                        cmd.Parameters.AddWithValue("@old_value",  string.IsNullOrWhiteSpace(model.old_value)  ? (object)DBNull.Value : model.old_value);
                        cmd.Parameters.AddWithValue("@new_value",  string.IsNullOrWhiteSpace(model.new_value)  ? (object)DBNull.Value : model.new_value);

                        int rows = cmd.ExecuteNonQuery();
                        if (rows == 0) return NotFound();
                    }
                }
                return Ok(new { success = true, id });
            }
            catch (Exception ex) { return InternalServerError(ex); }
        }
        #endregion

        #region Delete : audit_logs
        [HttpDelete]
        [Route("api/DeleteauditLogs/{id}")]
        public IHttpActionResult DeleteauditLogs(int id)
        {
            try
            {
                using (var con = new SqlConnection(ConnectionDB.ConnectionStringCN))
                {
                    con.Open();
                    string sql = @"DELETE FROM [dbo].[audit_logs] WHERE id = @id;";
                    using (var cmd = new SqlCommand(sql, con))
                    {
                        cmd.Parameters.AddWithValue("@id", id);
                        int rows = cmd.ExecuteNonQuery();
                        if (rows == 0) return NotFound();
                        return Ok(new { success = true, deleted = rows, id });
                    }
                }
            }
            catch (Exception ex) { return InternalServerError(ex); }
        }
        #endregion
    }
}
