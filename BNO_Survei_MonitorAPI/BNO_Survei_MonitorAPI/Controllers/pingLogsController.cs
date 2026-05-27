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
    public class pingLogsController : ApiController
    {
        #region GET : ping_logs
        [Route("api/ping-logs")]
        [HttpGet]
        public IHttpActionResult GetPingLogs(string device_id = null, string device_type = null)
        {
            if (!RequestContext.Principal.IsInRole("admin"))
                return StatusCode(System.Net.HttpStatusCode.Forbidden);

            List<pingLogsModel> ListRP = new List<pingLogsModel>();
            using (SqlConnection con = new SqlConnection(ConnectionDB.ConnectionStringCN))
            {
                con.Open();
                string sql = "SELECT [id],[device_type],[device_id],[ip_address],[is_alive],[latency_ms],[pinged_at] FROM [dbo].[ping_logs] WHERE 1=1";
                if (!string.IsNullOrWhiteSpace(device_id))   sql += " AND device_id = @device_id";
                if (!string.IsNullOrWhiteSpace(device_type)) sql += " AND device_type = @device_type";
                SqlCommand cmd = new SqlCommand(sql, con);
                if (!string.IsNullOrWhiteSpace(device_id))   cmd.Parameters.AddWithValue("@device_id", device_id);
                if (!string.IsNullOrWhiteSpace(device_type)) cmd.Parameters.AddWithValue("@device_type", device_type);
                using (var reader = cmd.ExecuteReader())
                {
                    while (reader.Read())
                    {
                        ListRP.Add(new pingLogsModel
                        {
                            id          = Convert.ToInt32(reader["id"]),
                            device_type = reader["device_type"].ToString(),
                            device_id   = reader["device_id"].ToString(),
                            ip_address  = reader["ip_address"].ToString(),
                            is_alive    = Convert.ToBoolean(reader["is_alive"]),
                            latency_ms  = reader["latency_ms"] == DBNull.Value ? (decimal?)null : Convert.ToDecimal(reader["latency_ms"]),
                            pinged_at   = reader["pinged_at"].ToString(),
                        });
                    }
                }
            }
            return Json(ListRP);
        }
        #endregion

        #region Save : ping_logs
        [Route("api/ping-logs")]
        [HttpPost]
        public IHttpActionResult SavepingLogs([FromBody] List<pingLogsModel> modelList)
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
                        INSERT INTO [dbo].[ping_logs] ([device_type],[device_id],[ip_address],[is_alive],[latency_ms])
                        VALUES (@device_type,@device_id,@ip_address,@is_alive,@latency_ms);";

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

        private void AddParameters(SqlCommand cmd, pingLogsModel item)
        {
            cmd.Parameters.AddWithValue("@device_type", string.IsNullOrWhiteSpace(item.device_type) ? (object)DBNull.Value : item.device_type);
            cmd.Parameters.AddWithValue("@device_id",   string.IsNullOrWhiteSpace(item.device_id)   ? (object)DBNull.Value : item.device_id);
            cmd.Parameters.AddWithValue("@ip_address",  string.IsNullOrWhiteSpace(item.ip_address)  ? (object)DBNull.Value : item.ip_address);
            cmd.Parameters.AddWithValue("@is_alive",    item.is_alive);
            cmd.Parameters.AddWithValue("@latency_ms",  item.latency_ms.HasValue ? (object)item.latency_ms.Value : DBNull.Value);
        }
        #endregion

        #region Update : ping_logs
        [Route("api/ping-logs/{id}")]
        [HttpPost]
        public IHttpActionResult UpdatepingLogs(int id, [FromBody] pingLogsModel model)
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
                        UPDATE [dbo].[ping_logs]
                        SET device_type = @device_type,
                            device_id   = @device_id,
                            ip_address  = @ip_address,
                            is_alive    = @is_alive,
                            latency_ms  = @latency_ms
                        WHERE id = @id;";

                    using (var cmd = new SqlCommand(sql, con))
                    {
                        cmd.Parameters.AddWithValue("@id", id);
                        cmd.Parameters.AddWithValue("@device_type", string.IsNullOrWhiteSpace(model.device_type) ? (object)DBNull.Value : model.device_type);
                        cmd.Parameters.AddWithValue("@device_id",   string.IsNullOrWhiteSpace(model.device_id)   ? (object)DBNull.Value : model.device_id);
                        cmd.Parameters.AddWithValue("@ip_address",  string.IsNullOrWhiteSpace(model.ip_address)  ? (object)DBNull.Value : model.ip_address);
                        cmd.Parameters.AddWithValue("@is_alive",    model.is_alive);
                        cmd.Parameters.AddWithValue("@latency_ms",  model.latency_ms.HasValue ? (object)model.latency_ms.Value : DBNull.Value);

                        int rows = cmd.ExecuteNonQuery();
                        if (rows == 0) return NotFound();
                    }
                }
                return Ok(new { success = true, id });
            }
            catch (Exception) { return InternalServerError(new Exception("An internal error occurred")); }
        }
        #endregion

        #region Delete : ping_logs
        [HttpPost]
        [Route("api/ping-logs/delete/{id}")]
        public IHttpActionResult DeletepingLogs(int id)
        {
                        if (!RequestContext.Principal.IsInRole("admin"))
                return StatusCode(System.Net.HttpStatusCode.Forbidden);

try
            {
                using (var con = new SqlConnection(ConnectionDB.ConnectionStringCN))
                {
                    con.Open();
                    string sql = @"DELETE FROM [dbo].[ping_logs] WHERE id = @id;";
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

