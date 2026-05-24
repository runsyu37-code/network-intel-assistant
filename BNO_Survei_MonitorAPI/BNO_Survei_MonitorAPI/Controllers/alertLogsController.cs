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
    public class alertLogsController : ApiController
    {
        #region GET : alert_logs
        [Route("api/GetAlertLogs")]
        [HttpGet]
        public IHttpActionResult GetAlertLogs(string device_type = null, bool active_only = false)
        {
            List<alertLogsModel> ListRP = new List<alertLogsModel>();
            using (SqlConnection con = new SqlConnection(ConnectionDB.ConnectionStringCN))
            {
                con.Open();
                string sql = "SELECT [id],[device_type],[device_id],[device_name],[brand],[ip_address],[site_name],[building_name],[floor_name],[room_name],[poe_switch_name],[poe_port],[alert_type],[message],[webhook_sent],[resolved_at],[alerted_at],[updated_at] FROM [dbo].[alert_logs] WHERE 1=1";
                if (!string.IsNullOrWhiteSpace(device_type)) sql += " AND device_type = @device_type";
                if (active_only)                             sql += " AND resolved_at IS NULL";
                SqlCommand cmd = new SqlCommand(sql, con);
                if (!string.IsNullOrWhiteSpace(device_type)) cmd.Parameters.AddWithValue("@device_type", device_type);
                using (var reader = cmd.ExecuteReader())
                {
                    while (reader.Read())
                    {
                        ListRP.Add(new alertLogsModel
                        {
                            id              = Convert.ToInt32(reader["id"]),
                            device_type     = reader["device_type"].ToString(),
                            device_id       = reader["device_id"].ToString(),
                            device_name     = reader["device_name"].ToString(),
                            brand           = reader["brand"]           == DBNull.Value ? null : reader["brand"].ToString(),
                            ip_address      = reader["ip_address"]      == DBNull.Value ? null : reader["ip_address"].ToString(),
                            site_name       = reader["site_name"]       == DBNull.Value ? null : reader["site_name"].ToString(),
                            building_name   = reader["building_name"]   == DBNull.Value ? null : reader["building_name"].ToString(),
                            floor_name      = reader["floor_name"]      == DBNull.Value ? null : reader["floor_name"].ToString(),
                            room_name       = reader["room_name"]       == DBNull.Value ? null : reader["room_name"].ToString(),
                            poe_switch_name = reader["poe_switch_name"] == DBNull.Value ? null : reader["poe_switch_name"].ToString(),
                            poe_port        = reader["poe_port"]        == DBNull.Value ? (int?)null : Convert.ToInt32(reader["poe_port"]),
                            alert_type      = reader["alert_type"]      == DBNull.Value ? null : reader["alert_type"].ToString(),
                            message         = reader["message"]         == DBNull.Value ? null : reader["message"].ToString(),
                            webhook_sent    = Convert.ToBoolean(reader["webhook_sent"]),
                            resolved_at     = reader["resolved_at"]     == DBNull.Value ? null : reader["resolved_at"].ToString(),
                            alerted_at      = reader["alerted_at"].ToString(),
                            updated_at      = reader["updated_at"].ToString(),
                        });
                    }
                }
            }
            return Json(ListRP);
        }
        #endregion

        #region Save : alert_logs
        [Route("api/SaveAlertLogs")]
        [HttpPost]
        public IHttpActionResult SavealertLogs([FromBody] List<alertLogsModel> modelList)
        {
            if (modelList == null || modelList.Count == 0)
                return BadRequest("à¹„à¸¡à¹ˆà¸¡à¸µà¸‚à¹‰à¸­à¸¡à¸¹à¸¥à¸—à¸µà¹ˆà¸ªà¹ˆà¸‡à¸¡à¸²");

            if (modelList.Any(x => string.IsNullOrWhiteSpace(x.device_type) || string.IsNullOrWhiteSpace(x.device_name)))
                return BadRequest("device_type à¹à¸¥à¸° device_name à¸«à¹‰à¸²à¸¡à¸§à¹ˆà¸²à¸‡");

            int insertCount = 0;
            try
            {
                using (var con = new SqlConnection(ConnectionDB.ConnectionStringCN))
                {
                    con.Open();
                    string insertSql = @"
                        INSERT INTO [dbo].[alert_logs] ([device_type],[device_id],[device_name],[brand],[ip_address],[site_name],[building_name],[floor_name],[room_name],[poe_switch_name],[poe_port],[alert_type],[message],[webhook_sent],[resolved_at])
                        VALUES (@device_type,@device_id,@device_name,@brand,@ip_address,@site_name,@building_name,@floor_name,@room_name,@poe_switch_name,@poe_port,@alert_type,@message,@webhook_sent,@resolved_at);";

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
                return Ok(new { success = true, inserted = insertCount, message = $"à¹€à¸žà¸´à¹ˆà¸¡à¸‚à¹‰à¸­à¸¡à¸¹à¸¥à¹ƒà¸«à¸¡à¹ˆà¸ªà¸³à¹€à¸£à¹‡à¸ˆ {insertCount} records" });
            }
            catch (SqlException ex) { return InternalServerError(ex); }
            catch (Exception ex)    { return InternalServerError(ex); }
        }

        private void AddParameters(SqlCommand cmd, alertLogsModel item)
        {
            cmd.Parameters.AddWithValue("@device_type",     string.IsNullOrWhiteSpace(item.device_type)     ? (object)DBNull.Value : item.device_type);
            cmd.Parameters.AddWithValue("@device_id",       string.IsNullOrWhiteSpace(item.device_id)       ? (object)DBNull.Value : item.device_id);
            cmd.Parameters.AddWithValue("@device_name",     string.IsNullOrWhiteSpace(item.device_name)     ? (object)DBNull.Value : item.device_name);
            cmd.Parameters.AddWithValue("@brand",           string.IsNullOrWhiteSpace(item.brand)           ? (object)DBNull.Value : item.brand);
            cmd.Parameters.AddWithValue("@ip_address",      string.IsNullOrWhiteSpace(item.ip_address)      ? (object)DBNull.Value : item.ip_address);
            cmd.Parameters.AddWithValue("@site_name",       string.IsNullOrWhiteSpace(item.site_name)       ? (object)DBNull.Value : item.site_name);
            cmd.Parameters.AddWithValue("@building_name",   string.IsNullOrWhiteSpace(item.building_name)   ? (object)DBNull.Value : item.building_name);
            cmd.Parameters.AddWithValue("@floor_name",      string.IsNullOrWhiteSpace(item.floor_name)      ? (object)DBNull.Value : item.floor_name);
            cmd.Parameters.AddWithValue("@room_name",       string.IsNullOrWhiteSpace(item.room_name)       ? (object)DBNull.Value : item.room_name);
            cmd.Parameters.AddWithValue("@poe_switch_name", string.IsNullOrWhiteSpace(item.poe_switch_name) ? (object)DBNull.Value : item.poe_switch_name);
            cmd.Parameters.AddWithValue("@poe_port",        item.poe_port.HasValue ? (object)item.poe_port.Value : DBNull.Value);
            cmd.Parameters.AddWithValue("@alert_type",      string.IsNullOrWhiteSpace(item.alert_type)      ? (object)DBNull.Value : item.alert_type);
            cmd.Parameters.AddWithValue("@message",         string.IsNullOrWhiteSpace(item.message)         ? (object)DBNull.Value : item.message);
            cmd.Parameters.AddWithValue("@webhook_sent",    item.webhook_sent);
            cmd.Parameters.AddWithValue("@resolved_at",     string.IsNullOrWhiteSpace(item.resolved_at)     ? (object)DBNull.Value : item.resolved_at);
        }
        #endregion

        #region Update : alert_logs
        [Route("api/UpdateAlertLogs/{id}")]
        [HttpPost]
        public IHttpActionResult UpdatealertLogs(int id, [FromBody] alertLogsModel model)
        {
            if (model == null)
                return BadRequest("à¸«à¹‰à¸²à¸¡ Null");

            try
            {
                using (var con = new SqlConnection(ConnectionDB.ConnectionStringCN))
                {
                    con.Open();
                    string sql = @"
                        UPDATE [dbo].[alert_logs]
                        SET device_type     = @device_type,
                            device_id       = @device_id,
                            device_name     = @device_name,
                            brand           = @brand,
                            ip_address      = @ip_address,
                            site_name       = @site_name,
                            building_name   = @building_name,
                            floor_name      = @floor_name,
                            room_name       = @room_name,
                            poe_switch_name = @poe_switch_name,
                            poe_port        = @poe_port,
                            alert_type      = @alert_type,
                            message         = @message,
                            webhook_sent    = @webhook_sent,
                            resolved_at     = @resolved_at,
                            updated_at      = SYSUTCDATETIME()
                        WHERE id = @id;";

                    using (var cmd = new SqlCommand(sql, con))
                    {
                        cmd.Parameters.AddWithValue("@id", id);
                        cmd.Parameters.AddWithValue("@device_type",     string.IsNullOrWhiteSpace(model.device_type)     ? (object)DBNull.Value : model.device_type);
                        cmd.Parameters.AddWithValue("@device_id",       string.IsNullOrWhiteSpace(model.device_id)       ? (object)DBNull.Value : model.device_id);
                        cmd.Parameters.AddWithValue("@device_name",     string.IsNullOrWhiteSpace(model.device_name)     ? (object)DBNull.Value : model.device_name);
                        cmd.Parameters.AddWithValue("@brand",           string.IsNullOrWhiteSpace(model.brand)           ? (object)DBNull.Value : model.brand);
                        cmd.Parameters.AddWithValue("@ip_address",      string.IsNullOrWhiteSpace(model.ip_address)      ? (object)DBNull.Value : model.ip_address);
                        cmd.Parameters.AddWithValue("@site_name",       string.IsNullOrWhiteSpace(model.site_name)       ? (object)DBNull.Value : model.site_name);
                        cmd.Parameters.AddWithValue("@building_name",   string.IsNullOrWhiteSpace(model.building_name)   ? (object)DBNull.Value : model.building_name);
                        cmd.Parameters.AddWithValue("@floor_name",      string.IsNullOrWhiteSpace(model.floor_name)      ? (object)DBNull.Value : model.floor_name);
                        cmd.Parameters.AddWithValue("@room_name",       string.IsNullOrWhiteSpace(model.room_name)       ? (object)DBNull.Value : model.room_name);
                        cmd.Parameters.AddWithValue("@poe_switch_name", string.IsNullOrWhiteSpace(model.poe_switch_name) ? (object)DBNull.Value : model.poe_switch_name);
                        cmd.Parameters.AddWithValue("@poe_port",        model.poe_port.HasValue ? (object)model.poe_port.Value : DBNull.Value);
                        cmd.Parameters.AddWithValue("@alert_type",      string.IsNullOrWhiteSpace(model.alert_type)      ? (object)DBNull.Value : model.alert_type);
                        cmd.Parameters.AddWithValue("@message",         string.IsNullOrWhiteSpace(model.message)         ? (object)DBNull.Value : model.message);
                        cmd.Parameters.AddWithValue("@webhook_sent",    model.webhook_sent);
                        cmd.Parameters.AddWithValue("@resolved_at",     string.IsNullOrWhiteSpace(model.resolved_at)     ? (object)DBNull.Value : model.resolved_at);

                        int rows = cmd.ExecuteNonQuery();
                        if (rows == 0) return NotFound();
                    }
                }
                return Ok(new { success = true, id });
            }
            catch (Exception ex) { return InternalServerError(ex); }
        }
        #endregion

        #region Delete : alert_logs
        [HttpPost]
        [Route("api/DeleteAlertLogs/{id}")]
        public IHttpActionResult DeletealertLogs(int id)
        {
            try
            {
                using (var con = new SqlConnection(ConnectionDB.ConnectionStringCN))
                {
                    con.Open();
                    string sql = @"DELETE FROM [dbo].[alert_logs] WHERE id = @id;";
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
