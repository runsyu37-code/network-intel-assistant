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
    public class syncLogsController : ApiController
    {
        #region GET : sync_logs
        [Route("api/sync-logs")]
        [HttpGet]
        public IHttpActionResult GetSyncLogs(string device_type = null, string device_id = null, string status = null)
        {
            if (!RequestContext.Principal.IsInRole("admin"))
                return StatusCode(System.Net.HttpStatusCode.Forbidden);

            List<syncLogsModel> ListRP = new List<syncLogsModel>();
            using (SqlConnection con = new SqlConnection(ConnectionDB.ConnectionStringCN))
            {
                con.Open();
                string sql = "SELECT [id],[device_type],[device_id],[synced_by],[sync_type],[fields_updated],[status],[message],[created_at] FROM [dbo].[sync_logs] WHERE 1=1";
                if (!string.IsNullOrWhiteSpace(device_type)) sql += " AND device_type = @device_type";
                if (!string.IsNullOrWhiteSpace(device_id))   sql += " AND device_id = @device_id";
                if (!string.IsNullOrWhiteSpace(status))      sql += " AND status = @status";
                SqlCommand cmd = new SqlCommand(sql, con);
                if (!string.IsNullOrWhiteSpace(device_type)) cmd.Parameters.AddWithValue("@device_type", device_type);
                if (!string.IsNullOrWhiteSpace(device_id))   cmd.Parameters.AddWithValue("@device_id", device_id);
                if (!string.IsNullOrWhiteSpace(status))      cmd.Parameters.AddWithValue("@status", status);
                using (var reader = cmd.ExecuteReader())
                {
                    while (reader.Read())
                    {
                        ListRP.Add(new syncLogsModel
                        {
                            id             = Convert.ToInt32(reader["id"]),
                            device_type    = reader["device_type"].ToString(),
                            device_id      = reader["device_id"].ToString(),
                            synced_by      = reader["synced_by"]      == DBNull.Value ? (int?)null : Convert.ToInt32(reader["synced_by"]),
                            sync_type      = reader["sync_type"]      == DBNull.Value ? null : reader["sync_type"].ToString(),
                            fields_updated = reader["fields_updated"] == DBNull.Value ? null : reader["fields_updated"].ToString(),
                            status         = reader["status"]         == DBNull.Value ? null : reader["status"].ToString(),
                            message        = reader["message"]        == DBNull.Value ? null : reader["message"].ToString(),
                            created_at     = reader["created_at"].ToString(),
                        });
                    }
                }
            }
            return Json(ListRP);
        }
        #endregion

        #region Save : sync_logs
        [Route("api/sync-logs")]
        [HttpPost]
        public IHttpActionResult SavesyncLogs([FromBody] List<syncLogsModel> modelList)
        {
                        if (!RequestContext.Principal.IsInRole("admin"))
                return StatusCode(System.Net.HttpStatusCode.Forbidden);

if (modelList == null || modelList.Count == 0)
                return BadRequest("No data provided");

            if (modelList.Any(x => string.IsNullOrWhiteSpace(x.device_type) || string.IsNullOrWhiteSpace(x.device_id)))
                return BadRequest("device_type and device_id are required");

            int insertCount = 0;
            try
            {
                using (var con = new SqlConnection(ConnectionDB.ConnectionStringCN))
                {
                    con.Open();
                    string insertSql = @"
                        INSERT INTO [dbo].[sync_logs] ([device_type],[device_id],[synced_by],[sync_type],[fields_updated],[status],[message])
                        VALUES (@device_type,@device_id,@synced_by,@sync_type,@fields_updated,@status,@message);";

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

        private void AddParameters(SqlCommand cmd, syncLogsModel item)
        {
            cmd.Parameters.AddWithValue("@device_type",    string.IsNullOrWhiteSpace(item.device_type)    ? (object)DBNull.Value : item.device_type);
            cmd.Parameters.AddWithValue("@device_id",      string.IsNullOrWhiteSpace(item.device_id)      ? (object)DBNull.Value : item.device_id);
            cmd.Parameters.AddWithValue("@synced_by",      item.synced_by.HasValue ? (object)item.synced_by.Value : DBNull.Value);
            cmd.Parameters.AddWithValue("@sync_type",      string.IsNullOrWhiteSpace(item.sync_type)      ? (object)DBNull.Value : item.sync_type);
            cmd.Parameters.AddWithValue("@fields_updated", string.IsNullOrWhiteSpace(item.fields_updated) ? (object)DBNull.Value : item.fields_updated);
            cmd.Parameters.AddWithValue("@status",         string.IsNullOrWhiteSpace(item.status)         ? (object)DBNull.Value : item.status);
            cmd.Parameters.AddWithValue("@message",        string.IsNullOrWhiteSpace(item.message)        ? (object)DBNull.Value : item.message);
        }
        #endregion

        #region Update : sync_logs
        [Route("api/sync-logs/{id}")]
        [HttpPost]
        public IHttpActionResult UpdatesyncLogs(int id, [FromBody] syncLogsModel model)
        {
                        if (!RequestContext.Principal.IsInRole("admin"))
                return StatusCode(System.Net.HttpStatusCode.Forbidden);

if (model == null)
                return BadRequest("Value cannot be null");

            try
            {
                using (var con = new SqlConnection(ConnectionDB.ConnectionStringCN))
                {
                    con.Open();
                    string sql = @"
                        UPDATE [dbo].[sync_logs]
                        SET device_type    = @device_type,
                            device_id      = @device_id,
                            synced_by      = @synced_by,
                            sync_type      = @sync_type,
                            fields_updated = @fields_updated,
                            status         = @status,
                            message        = @message
                        WHERE id = @id;";

                    using (var cmd = new SqlCommand(sql, con))
                    {
                        cmd.Parameters.AddWithValue("@id", id);
                        cmd.Parameters.AddWithValue("@device_type",    string.IsNullOrWhiteSpace(model.device_type)    ? (object)DBNull.Value : model.device_type);
                        cmd.Parameters.AddWithValue("@device_id",      string.IsNullOrWhiteSpace(model.device_id)      ? (object)DBNull.Value : model.device_id);
                        cmd.Parameters.AddWithValue("@synced_by",      model.synced_by.HasValue ? (object)model.synced_by.Value : DBNull.Value);
                        cmd.Parameters.AddWithValue("@sync_type",      string.IsNullOrWhiteSpace(model.sync_type)      ? (object)DBNull.Value : model.sync_type);
                        cmd.Parameters.AddWithValue("@fields_updated", string.IsNullOrWhiteSpace(model.fields_updated) ? (object)DBNull.Value : model.fields_updated);
                        cmd.Parameters.AddWithValue("@status",         string.IsNullOrWhiteSpace(model.status)         ? (object)DBNull.Value : model.status);
                        cmd.Parameters.AddWithValue("@message",        string.IsNullOrWhiteSpace(model.message)        ? (object)DBNull.Value : model.message);

                        int rows = cmd.ExecuteNonQuery();
                        if (rows == 0) return NotFound();
                    }
                }
                return Ok(new { success = true, id });
            }
            catch (Exception) { return InternalServerError(new Exception("An internal error occurred")); }
        }
        #endregion

        #region Delete : sync_logs
        [HttpPost]
        [Route("api/sync-logs/delete/{id}")]
        public IHttpActionResult DeletesyncLogs(int id)
        {
                        if (!RequestContext.Principal.IsInRole("admin"))
                return StatusCode(System.Net.HttpStatusCode.Forbidden);

try
            {
                using (var con = new SqlConnection(ConnectionDB.ConnectionStringCN))
                {
                    con.Open();
                    string sql = @"DELETE FROM [dbo].[sync_logs] WHERE id = @id;";
                    using (var cmd = new SqlCommand(sql, con))
                    {
                        cmd.Parameters.AddWithValue("@id", id);
                        int rows = cmd.ExecuteNonQuery();
                        if (rows == 0) return NotFound();
                        return Ok(new { success = true, deleted = rows, id });
                    }
                }
            }
            catch (Exception) { return InternalServerError(new Exception("An internal error occurred")); }
        }
        #endregion
    }
}

