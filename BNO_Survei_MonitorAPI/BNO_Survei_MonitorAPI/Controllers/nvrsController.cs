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
    public class nvrsController : ApiController
    {
        #region GET : nvrs
        [Route("api/Getnvrs")]
        [HttpGet]
        public IHttpActionResult Getnvrs()
        {
            List<nvrsModel> ListRP = new List<nvrsModel>();
            using (SqlConnection con = new SqlConnection(ConnectionDB.ConnectionStringCN))
            {
                con.Open();
                string sql = "SELECT [NVR_ID],[Site_ID],[Building_ID],[Floor_ID],[Room_ID],[Rack_ID],[u_position],[u_subposition],[u_size],[device_name],[brand],[model],[serial_no],[mac_address],[os_version],[ip_internet],[ip_cctv],[vlan_id],[subnet_mask],[gateway],[total_channels],[active_channels],[hdd_total_tb],[hdd_used_pct],[recording_res],[retention_days],[record_status],[status],[fail_count],[last_seen],[notes],[created_at],[updated_at] FROM [dbo].[nvrs] WHERE 1=1";
                SqlCommand cmd = new SqlCommand(sql, con);
                using (var reader = cmd.ExecuteReader())
                {
                    while (reader.Read())
                    {
                        ListRP.Add(new nvrsModel
                        {
                            NVR_ID          = reader["NVR_ID"].ToString(),
                            Site_ID         = reader["Site_ID"].ToString(),
                            Building_ID     = reader["Building_ID"].ToString(),
                            Floor_ID        = reader["Floor_ID"].ToString(),
                            Room_ID         = reader["Room_ID"].ToString(),
                            Rack_ID         = reader["Rack_ID"].ToString(),
                            u_position      = reader["u_position"]      == DBNull.Value ? (int?)null     : Convert.ToInt32(reader["u_position"]),
                            u_subposition   = reader["u_subposition"]   == DBNull.Value ? (int?)null     : Convert.ToInt32(reader["u_subposition"]),
                            u_size          = reader["u_size"]          == DBNull.Value ? (int?)null     : Convert.ToInt32(reader["u_size"]),
                            device_name     = reader["device_name"].ToString(),
                            brand           = reader["brand"]           == DBNull.Value ? null : reader["brand"].ToString(),
                            model           = reader["model"]           == DBNull.Value ? null : reader["model"].ToString(),
                            serial_no       = reader["serial_no"]       == DBNull.Value ? null : reader["serial_no"].ToString(),
                            mac_address     = reader["mac_address"]     == DBNull.Value ? null : reader["mac_address"].ToString(),
                            os_version      = reader["os_version"]      == DBNull.Value ? null : reader["os_version"].ToString(),
                            ip_internet     = reader["ip_internet"]     == DBNull.Value ? null : reader["ip_internet"].ToString(),
                            ip_cctv         = reader["ip_cctv"]         == DBNull.Value ? null : reader["ip_cctv"].ToString(),
                            vlan_id         = reader["vlan_id"]         == DBNull.Value ? (int?)null     : Convert.ToInt32(reader["vlan_id"]),
                            subnet_mask     = reader["subnet_mask"]     == DBNull.Value ? null : reader["subnet_mask"].ToString(),
                            gateway         = reader["gateway"]         == DBNull.Value ? null : reader["gateway"].ToString(),
                            total_channels  = reader["total_channels"]  == DBNull.Value ? (int?)null     : Convert.ToInt32(reader["total_channels"]),
                            active_channels = reader["active_channels"] == DBNull.Value ? (int?)null     : Convert.ToInt32(reader["active_channels"]),
                            hdd_total_tb    = reader["hdd_total_tb"]    == DBNull.Value ? (decimal?)null : Convert.ToDecimal(reader["hdd_total_tb"]),
                            hdd_used_pct    = reader["hdd_used_pct"]    == DBNull.Value ? (decimal?)null : Convert.ToDecimal(reader["hdd_used_pct"]),
                            recording_res   = reader["recording_res"]   == DBNull.Value ? null : reader["recording_res"].ToString(),
                            retention_days  = reader["retention_days"]  == DBNull.Value ? (int?)null     : Convert.ToInt32(reader["retention_days"]),
                            record_status   = reader["record_status"]   == DBNull.Value ? null : reader["record_status"].ToString(),
                            status          = reader["status"]          == DBNull.Value ? null : reader["status"].ToString(),
                            fail_count      = reader["fail_count"]      == DBNull.Value ? (int?)null     : Convert.ToInt32(reader["fail_count"]),
                            last_seen       = reader["last_seen"]       == DBNull.Value ? null : reader["last_seen"].ToString(),
                            notes           = reader["notes"]           == DBNull.Value ? null : reader["notes"].ToString(),
                            created_at      = reader["created_at"].ToString(),
                            updated_at      = reader["updated_at"].ToString(),
                        });
                    }
                }
            }
            return Json(ListRP);
        }
        #endregion

        #region Save : nvrs
        [Route("api/Savenvrs")]
        [HttpPost]
        public IHttpActionResult Savenvrs([FromBody] List<nvrsModel> modelList)
        {
            if (modelList == null || modelList.Count == 0)
                return BadRequest("à¹„à¸¡à¹ˆà¸¡à¸µà¸‚à¹‰à¸­à¸¡à¸¹à¸¥à¸—à¸µà¹ˆà¸ªà¹ˆà¸‡à¸¡à¸²");

            if (modelList.Any(x => string.IsNullOrWhiteSpace(x.NVR_ID)))
                return BadRequest("NVR_ID à¸«à¹‰à¸²à¸¡à¸§à¹ˆà¸²à¸‡");

            int insertCount = 0;
            try
            {
                using (var con = new SqlConnection(ConnectionDB.ConnectionStringCN))
                {
                    con.Open();
                    string insertSql = @"
                        INSERT INTO [dbo].[nvrs] ([NVR_ID],[Site_ID],[Building_ID],[Floor_ID],[Room_ID],[Rack_ID],[u_position],[u_subposition],[u_size],[device_name],[brand],[model],[serial_no],[mac_address],[os_version],[ip_internet],[ip_cctv],[vlan_id],[subnet_mask],[gateway],[total_channels],[active_channels],[hdd_total_tb],[hdd_used_pct],[recording_res],[retention_days],[record_status],[status],[fail_count],[last_seen],[notes])
                        VALUES (@NVR_ID,@Site_ID,@Building_ID,@Floor_ID,@Room_ID,@Rack_ID,@u_position,@u_subposition,@u_size,@device_name,@brand,@model,@serial_no,@mac_address,@os_version,@ip_internet,@ip_cctv,@vlan_id,@subnet_mask,@gateway,@total_channels,@active_channels,@hdd_total_tb,@hdd_used_pct,@recording_res,@retention_days,@record_status,@status,@fail_count,@last_seen,@notes);";

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

        private void AddParameters(SqlCommand cmd, nvrsModel item)
        {
            cmd.Parameters.AddWithValue("@NVR_ID",          string.IsNullOrWhiteSpace(item.NVR_ID)       ? (object)DBNull.Value : item.NVR_ID);
            cmd.Parameters.AddWithValue("@Site_ID",         string.IsNullOrWhiteSpace(item.Site_ID)      ? (object)DBNull.Value : item.Site_ID);
            cmd.Parameters.AddWithValue("@Building_ID",     string.IsNullOrWhiteSpace(item.Building_ID)  ? (object)DBNull.Value : item.Building_ID);
            cmd.Parameters.AddWithValue("@Floor_ID",        string.IsNullOrWhiteSpace(item.Floor_ID)     ? (object)DBNull.Value : item.Floor_ID);
            cmd.Parameters.AddWithValue("@Room_ID",         string.IsNullOrWhiteSpace(item.Room_ID)      ? (object)DBNull.Value : item.Room_ID);
            cmd.Parameters.AddWithValue("@Rack_ID",         string.IsNullOrWhiteSpace(item.Rack_ID)      ? (object)DBNull.Value : item.Rack_ID);
            cmd.Parameters.AddWithValue("@u_position",      item.u_position.HasValue      ? (object)item.u_position.Value      : DBNull.Value);
            cmd.Parameters.AddWithValue("@u_subposition",   item.u_subposition.HasValue   ? (object)item.u_subposition.Value   : DBNull.Value);
            cmd.Parameters.AddWithValue("@u_size",          item.u_size.HasValue          ? (object)item.u_size.Value          : DBNull.Value);
            cmd.Parameters.AddWithValue("@device_name",     string.IsNullOrWhiteSpace(item.device_name)  ? (object)DBNull.Value : item.device_name);
            cmd.Parameters.AddWithValue("@brand",           string.IsNullOrWhiteSpace(item.brand)        ? (object)DBNull.Value : item.brand);
            cmd.Parameters.AddWithValue("@model",           string.IsNullOrWhiteSpace(item.model)        ? (object)DBNull.Value : item.model);
            cmd.Parameters.AddWithValue("@serial_no",       string.IsNullOrWhiteSpace(item.serial_no)    ? (object)DBNull.Value : item.serial_no);
            cmd.Parameters.AddWithValue("@mac_address",     string.IsNullOrWhiteSpace(item.mac_address)  ? (object)DBNull.Value : item.mac_address);
            cmd.Parameters.AddWithValue("@os_version",      string.IsNullOrWhiteSpace(item.os_version)   ? (object)DBNull.Value : item.os_version);
            cmd.Parameters.AddWithValue("@ip_internet",     string.IsNullOrWhiteSpace(item.ip_internet)  ? (object)DBNull.Value : item.ip_internet);
            cmd.Parameters.AddWithValue("@ip_cctv",         string.IsNullOrWhiteSpace(item.ip_cctv)      ? (object)DBNull.Value : item.ip_cctv);
            cmd.Parameters.AddWithValue("@vlan_id",         item.vlan_id.HasValue         ? (object)item.vlan_id.Value         : DBNull.Value);
            cmd.Parameters.AddWithValue("@subnet_mask",     string.IsNullOrWhiteSpace(item.subnet_mask)  ? (object)DBNull.Value : item.subnet_mask);
            cmd.Parameters.AddWithValue("@gateway",         string.IsNullOrWhiteSpace(item.gateway)      ? (object)DBNull.Value : item.gateway);
            cmd.Parameters.AddWithValue("@total_channels",  item.total_channels.HasValue  ? (object)item.total_channels.Value  : DBNull.Value);
            cmd.Parameters.AddWithValue("@active_channels", item.active_channels.HasValue ? (object)item.active_channels.Value : DBNull.Value);
            cmd.Parameters.AddWithValue("@hdd_total_tb",    item.hdd_total_tb.HasValue    ? (object)item.hdd_total_tb.Value    : DBNull.Value);
            cmd.Parameters.AddWithValue("@hdd_used_pct",    item.hdd_used_pct.HasValue    ? (object)item.hdd_used_pct.Value    : DBNull.Value);
            cmd.Parameters.AddWithValue("@recording_res",   string.IsNullOrWhiteSpace(item.recording_res) ? (object)DBNull.Value : item.recording_res);
            cmd.Parameters.AddWithValue("@retention_days",  item.retention_days.HasValue  ? (object)item.retention_days.Value  : DBNull.Value);
            cmd.Parameters.AddWithValue("@record_status",   string.IsNullOrWhiteSpace(item.record_status) ? (object)DBNull.Value : item.record_status);
            cmd.Parameters.AddWithValue("@status",          string.IsNullOrWhiteSpace(item.status)       ? (object)DBNull.Value : item.status);
            cmd.Parameters.AddWithValue("@fail_count",      item.fail_count.HasValue      ? (object)item.fail_count.Value      : DBNull.Value);
            cmd.Parameters.AddWithValue("@last_seen",       string.IsNullOrWhiteSpace(item.last_seen)    ? (object)DBNull.Value : item.last_seen);
            cmd.Parameters.AddWithValue("@notes",           string.IsNullOrWhiteSpace(item.notes)        ? (object)DBNull.Value : item.notes);
        }
        #endregion

        #region Update : nvrs
        [Route("api/Updatenvrs/{NVR_ID}")]
        [HttpPost]
        public IHttpActionResult Updatenvrs(string NVR_ID, [FromBody] nvrsModel model)
        {
            if (model == null || string.IsNullOrWhiteSpace(model.NVR_ID))
                return BadRequest("à¸«à¹‰à¸²à¸¡ Null");

            try
            {
                using (var con = new SqlConnection(ConnectionDB.ConnectionStringCN))
                {
                    con.Open();
                    string sql = @"
                        UPDATE [dbo].[nvrs]
                        SET Site_ID         = @Site_ID,
                            Building_ID     = @Building_ID,
                            Floor_ID        = @Floor_ID,
                            Room_ID         = @Room_ID,
                            Rack_ID         = @Rack_ID,
                            u_position      = @u_position,
                            u_subposition   = @u_subposition,
                            u_size          = @u_size,
                            device_name     = @device_name,
                            brand           = @brand,
                            model           = @model,
                            serial_no       = @serial_no,
                            mac_address     = @mac_address,
                            os_version      = @os_version,
                            ip_internet     = @ip_internet,
                            ip_cctv         = @ip_cctv,
                            vlan_id         = @vlan_id,
                            subnet_mask     = @subnet_mask,
                            gateway         = @gateway,
                            total_channels  = @total_channels,
                            active_channels = @active_channels,
                            hdd_total_tb    = @hdd_total_tb,
                            hdd_used_pct    = @hdd_used_pct,
                            recording_res   = @recording_res,
                            retention_days  = @retention_days,
                            record_status   = @record_status,
                            status          = @status,
                            fail_count      = @fail_count,
                            last_seen       = @last_seen,
                            notes           = @notes,
                            updated_at      = SYSUTCDATETIME()
                        WHERE NVR_ID = @NVR_ID;";

                    using (var cmd = new SqlCommand(sql, con))
                    {
                        cmd.Parameters.AddWithValue("@NVR_ID", model.NVR_ID);
                        cmd.Parameters.AddWithValue("@Site_ID",         string.IsNullOrWhiteSpace(model.Site_ID)      ? (object)DBNull.Value : model.Site_ID);
                        cmd.Parameters.AddWithValue("@Building_ID",     string.IsNullOrWhiteSpace(model.Building_ID)  ? (object)DBNull.Value : model.Building_ID);
                        cmd.Parameters.AddWithValue("@Floor_ID",        string.IsNullOrWhiteSpace(model.Floor_ID)     ? (object)DBNull.Value : model.Floor_ID);
                        cmd.Parameters.AddWithValue("@Room_ID",         string.IsNullOrWhiteSpace(model.Room_ID)      ? (object)DBNull.Value : model.Room_ID);
                        cmd.Parameters.AddWithValue("@Rack_ID",         string.IsNullOrWhiteSpace(model.Rack_ID)      ? (object)DBNull.Value : model.Rack_ID);
                        cmd.Parameters.AddWithValue("@u_position",      model.u_position.HasValue      ? (object)model.u_position.Value      : DBNull.Value);
                        cmd.Parameters.AddWithValue("@u_subposition",   model.u_subposition.HasValue   ? (object)model.u_subposition.Value   : DBNull.Value);
                        cmd.Parameters.AddWithValue("@u_size",          model.u_size.HasValue          ? (object)model.u_size.Value          : DBNull.Value);
                        cmd.Parameters.AddWithValue("@device_name",     string.IsNullOrWhiteSpace(model.device_name)  ? (object)DBNull.Value : model.device_name);
                        cmd.Parameters.AddWithValue("@brand",           string.IsNullOrWhiteSpace(model.brand)        ? (object)DBNull.Value : model.brand);
                        cmd.Parameters.AddWithValue("@model",           string.IsNullOrWhiteSpace(model.model)        ? (object)DBNull.Value : model.model);
                        cmd.Parameters.AddWithValue("@serial_no",       string.IsNullOrWhiteSpace(model.serial_no)    ? (object)DBNull.Value : model.serial_no);
                        cmd.Parameters.AddWithValue("@mac_address",     string.IsNullOrWhiteSpace(model.mac_address)  ? (object)DBNull.Value : model.mac_address);
                        cmd.Parameters.AddWithValue("@os_version",      string.IsNullOrWhiteSpace(model.os_version)   ? (object)DBNull.Value : model.os_version);
                        cmd.Parameters.AddWithValue("@ip_internet",     string.IsNullOrWhiteSpace(model.ip_internet)  ? (object)DBNull.Value : model.ip_internet);
                        cmd.Parameters.AddWithValue("@ip_cctv",         string.IsNullOrWhiteSpace(model.ip_cctv)      ? (object)DBNull.Value : model.ip_cctv);
                        cmd.Parameters.AddWithValue("@vlan_id",         model.vlan_id.HasValue         ? (object)model.vlan_id.Value         : DBNull.Value);
                        cmd.Parameters.AddWithValue("@subnet_mask",     string.IsNullOrWhiteSpace(model.subnet_mask)  ? (object)DBNull.Value : model.subnet_mask);
                        cmd.Parameters.AddWithValue("@gateway",         string.IsNullOrWhiteSpace(model.gateway)      ? (object)DBNull.Value : model.gateway);
                        cmd.Parameters.AddWithValue("@total_channels",  model.total_channels.HasValue  ? (object)model.total_channels.Value  : DBNull.Value);
                        cmd.Parameters.AddWithValue("@active_channels", model.active_channels.HasValue ? (object)model.active_channels.Value : DBNull.Value);
                        cmd.Parameters.AddWithValue("@hdd_total_tb",    model.hdd_total_tb.HasValue    ? (object)model.hdd_total_tb.Value    : DBNull.Value);
                        cmd.Parameters.AddWithValue("@hdd_used_pct",    model.hdd_used_pct.HasValue    ? (object)model.hdd_used_pct.Value    : DBNull.Value);
                        cmd.Parameters.AddWithValue("@recording_res",   string.IsNullOrWhiteSpace(model.recording_res) ? (object)DBNull.Value : model.recording_res);
                        cmd.Parameters.AddWithValue("@retention_days",  model.retention_days.HasValue  ? (object)model.retention_days.Value  : DBNull.Value);
                        cmd.Parameters.AddWithValue("@record_status",   string.IsNullOrWhiteSpace(model.record_status) ? (object)DBNull.Value : model.record_status);
                        cmd.Parameters.AddWithValue("@status",          string.IsNullOrWhiteSpace(model.status)       ? (object)DBNull.Value : model.status);
                        cmd.Parameters.AddWithValue("@fail_count",      model.fail_count.HasValue      ? (object)model.fail_count.Value      : DBNull.Value);
                        cmd.Parameters.AddWithValue("@last_seen",       string.IsNullOrWhiteSpace(model.last_seen)    ? (object)DBNull.Value : model.last_seen);
                        cmd.Parameters.AddWithValue("@notes",           string.IsNullOrWhiteSpace(model.notes)        ? (object)DBNull.Value : model.notes);

                        int rows = cmd.ExecuteNonQuery();
                        if (rows == 0) return NotFound();
                    }
                }
                return Ok(new { success = true, NVR_ID });
            }
            catch (Exception ex) { return InternalServerError(ex); }
        }
        #endregion

        #region Delete : nvrs
        [HttpPost]
        [Route("api/Deletenvrs/{NVR_ID}")]
        public IHttpActionResult Deletenvrs(string NVR_ID)
        {
            if (string.IsNullOrWhiteSpace(NVR_ID))
                return BadRequest("NVR_ID à¸«à¹‰à¸²à¸¡à¸§à¹ˆà¸²à¸‡");

            try
            {
                using (var con = new SqlConnection(ConnectionDB.ConnectionStringCN))
                {
                    con.Open();
                    string sql = @"DELETE FROM [dbo].[nvrs] WHERE NVR_ID = @NVR_ID;";
                    using (var cmd = new SqlCommand(sql, con))
                    {
                        cmd.Parameters.AddWithValue("@NVR_ID", NVR_ID);
                        int rows = cmd.ExecuteNonQuery();
                        if (rows == 0) return NotFound();
                        return Ok(new { success = true, deleted = rows, NVR_ID });
                    }
                }
            }
            catch (Exception ex) { return InternalServerError(ex); }
        }
        #endregion
    }
}
