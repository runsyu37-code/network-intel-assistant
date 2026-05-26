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
using HttpPatchAttribute = System.Web.Http.HttpPatchAttribute;
using RouteAttribute = System.Web.Http.RouteAttribute;

namespace BNO_Survei_MonitorAPI.Controllers
{
    public class camerasController : ApiController
    {
        #region GET : cameras
        [Route("api/cameras")]
        [HttpGet]
        public IHttpActionResult GetCameras(string Site_ID = null, string Floor_ID = null, string status = null, int? id = null)
        {
            List<camerasModel> ListRP = new List<camerasModel>();
            using (SqlConnection con = new SqlConnection(ConnectionDB.ConnectionStringCN))
            {
                con.Open();
                string sql = "SELECT [id],[Site_ID],[Building_ID],[Floor_ID],[device_name],[brand],[model],[serial_no],[mac_address],[camera_type],[resolution],[firmware_version],[ip_address],[vlan_id],[subnet_mask],[gateway],[NVR_CH],[SW_ID],[poe_port_number],[NVR_ID],[nvr_channel],[install_location],[status],[fail_count],[last_seen],[notes],[created_at],[updated_at] FROM [dbo].[cameras] WHERE 1=1";
                if (!string.IsNullOrWhiteSpace(Site_ID))  sql += " AND Site_ID = @Site_ID";
                if (!string.IsNullOrWhiteSpace(Floor_ID)) sql += " AND Floor_ID = @Floor_ID";
                if (!string.IsNullOrWhiteSpace(status))   sql += " AND status = @status";
                if (id.HasValue)                          sql += " AND id = @id";
                SqlCommand cmd = new SqlCommand(sql, con);
                if (!string.IsNullOrWhiteSpace(Site_ID))  cmd.Parameters.AddWithValue("@Site_ID", Site_ID);
                if (!string.IsNullOrWhiteSpace(Floor_ID)) cmd.Parameters.AddWithValue("@Floor_ID", Floor_ID);
                if (!string.IsNullOrWhiteSpace(status))   cmd.Parameters.AddWithValue("@status", status);
                if (id.HasValue)                          cmd.Parameters.AddWithValue("@id", id.Value);
                using (var reader = cmd.ExecuteReader())
                {
                    while (reader.Read())
                    {
                        ListRP.Add(new camerasModel
                        {
                            id               = Convert.ToInt32(reader["id"]),
                            Site_ID          = reader["Site_ID"].ToString(),
                            Building_ID      = reader["Building_ID"].ToString(),
                            Floor_ID         = reader["Floor_ID"].ToString(),
                            device_name      = reader["device_name"].ToString(),
                            brand            = reader["brand"]            == DBNull.Value ? null : reader["brand"].ToString(),
                            model            = reader["model"]            == DBNull.Value ? null : reader["model"].ToString(),
                            serial_no        = reader["serial_no"]        == DBNull.Value ? null : reader["serial_no"].ToString(),
                            mac_address      = reader["mac_address"]      == DBNull.Value ? null : reader["mac_address"].ToString(),
                            camera_type      = reader["camera_type"]      == DBNull.Value ? null : reader["camera_type"].ToString(),
                            resolution       = reader["resolution"]       == DBNull.Value ? null : reader["resolution"].ToString(),
                            firmware_version = reader["firmware_version"] == DBNull.Value ? null : reader["firmware_version"].ToString(),
                            ip_address       = reader["ip_address"]       == DBNull.Value ? null : reader["ip_address"].ToString(),
                            vlan_id          = reader["vlan_id"]          == DBNull.Value ? (int?)null : Convert.ToInt32(reader["vlan_id"]),
                            subnet_mask      = reader["subnet_mask"]      == DBNull.Value ? null : reader["subnet_mask"].ToString(),
                            gateway          = reader["gateway"]          == DBNull.Value ? null : reader["gateway"].ToString(),
                            NVR_CH           = reader["NVR_CH"]           == DBNull.Value ? null : reader["NVR_CH"].ToString(),
                            SW_ID            = reader["SW_ID"]            == DBNull.Value ? null : reader["SW_ID"].ToString(),
                            poe_port_number  = reader["poe_port_number"]  == DBNull.Value ? (int?)null : Convert.ToInt32(reader["poe_port_number"]),
                            NVR_ID           = reader["NVR_ID"]           == DBNull.Value ? null : reader["NVR_ID"].ToString(),
                            nvr_channel      = reader["nvr_channel"]      == DBNull.Value ? (int?)null : Convert.ToInt32(reader["nvr_channel"]),
                            install_location = reader["install_location"] == DBNull.Value ? null : reader["install_location"].ToString(),
                            status           = reader["status"]           == DBNull.Value ? null : reader["status"].ToString(),
                            fail_count       = reader["fail_count"]       == DBNull.Value ? (int?)null : Convert.ToInt32(reader["fail_count"]),
                            last_seen        = reader["last_seen"]        == DBNull.Value ? null : reader["last_seen"].ToString(),
                            notes            = reader["notes"]            == DBNull.Value ? null : reader["notes"].ToString(),
                            created_at       = reader["created_at"].ToString(),
                            updated_at       = reader["updated_at"].ToString(),
                        });
                    }
                }
            }
            return Json(ListRP);
        }
        #endregion

        #region Save : cameras
        [Route("api/cameras")]
        [HttpPost]
        public IHttpActionResult Savecameras([FromBody] List<camerasModel> modelList)
        {
            if (modelList == null || modelList.Count == 0)
                return BadRequest("No data provided");

            if (modelList.Any(x => string.IsNullOrWhiteSpace(x.device_name)))
                return BadRequest("device_name is required");

            int insertCount = 0;
            try
            {
                using (var con = new SqlConnection(ConnectionDB.ConnectionStringCN))
                {
                    con.Open();
                    string insertSql = @"
                        INSERT INTO [dbo].[cameras] ([Site_ID],[Building_ID],[Floor_ID],[device_name],[brand],[model],[serial_no],[mac_address],[camera_type],[resolution],[firmware_version],[ip_address],[vlan_id],[subnet_mask],[gateway],[NVR_CH],[SW_ID],[poe_port_number],[NVR_ID],[nvr_channel],[install_location],[status],[fail_count],[last_seen],[notes])
                        VALUES (@Site_ID,@Building_ID,@Floor_ID,@device_name,@brand,@model,@serial_no,@mac_address,@camera_type,@resolution,@firmware_version,@ip_address,@vlan_id,@subnet_mask,@gateway,@NVR_CH,@SW_ID,@poe_port_number,@NVR_ID,@nvr_channel,@install_location,@status,@fail_count,@last_seen,@notes);";

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

        private void AddParameters(SqlCommand cmd, camerasModel item)
        {
            cmd.Parameters.AddWithValue("@Site_ID",          string.IsNullOrWhiteSpace(item.Site_ID)         ? (object)DBNull.Value : item.Site_ID);
            cmd.Parameters.AddWithValue("@Building_ID",      string.IsNullOrWhiteSpace(item.Building_ID)     ? (object)DBNull.Value : item.Building_ID);
            cmd.Parameters.AddWithValue("@Floor_ID",         string.IsNullOrWhiteSpace(item.Floor_ID)        ? (object)DBNull.Value : item.Floor_ID);
            cmd.Parameters.AddWithValue("@device_name",      string.IsNullOrWhiteSpace(item.device_name)     ? (object)DBNull.Value : item.device_name);
            cmd.Parameters.AddWithValue("@brand",            string.IsNullOrWhiteSpace(item.brand)           ? (object)DBNull.Value : item.brand);
            cmd.Parameters.AddWithValue("@model",            string.IsNullOrWhiteSpace(item.model)           ? (object)DBNull.Value : item.model);
            cmd.Parameters.AddWithValue("@serial_no",        string.IsNullOrWhiteSpace(item.serial_no)       ? (object)DBNull.Value : item.serial_no);
            cmd.Parameters.AddWithValue("@mac_address",      string.IsNullOrWhiteSpace(item.mac_address)     ? (object)DBNull.Value : item.mac_address);
            cmd.Parameters.AddWithValue("@camera_type",      string.IsNullOrWhiteSpace(item.camera_type)     ? (object)DBNull.Value : item.camera_type);
            cmd.Parameters.AddWithValue("@resolution",       string.IsNullOrWhiteSpace(item.resolution)      ? (object)DBNull.Value : item.resolution);
            cmd.Parameters.AddWithValue("@firmware_version", string.IsNullOrWhiteSpace(item.firmware_version) ? (object)DBNull.Value : item.firmware_version);
            cmd.Parameters.AddWithValue("@ip_address",       string.IsNullOrWhiteSpace(item.ip_address)      ? (object)DBNull.Value : item.ip_address);
            cmd.Parameters.AddWithValue("@vlan_id",          item.vlan_id.HasValue         ? (object)item.vlan_id.Value         : DBNull.Value);
            cmd.Parameters.AddWithValue("@subnet_mask",      string.IsNullOrWhiteSpace(item.subnet_mask)     ? (object)DBNull.Value : item.subnet_mask);
            cmd.Parameters.AddWithValue("@gateway",          string.IsNullOrWhiteSpace(item.gateway)         ? (object)DBNull.Value : item.gateway);
            cmd.Parameters.AddWithValue("@NVR_CH",           string.IsNullOrWhiteSpace(item.NVR_CH)          ? (object)DBNull.Value : item.NVR_CH);
            cmd.Parameters.AddWithValue("@SW_ID",            string.IsNullOrWhiteSpace(item.SW_ID)           ? (object)DBNull.Value : item.SW_ID);
            cmd.Parameters.AddWithValue("@poe_port_number",  item.poe_port_number.HasValue ? (object)item.poe_port_number.Value : DBNull.Value);
            cmd.Parameters.AddWithValue("@NVR_ID",           string.IsNullOrWhiteSpace(item.NVR_ID)          ? (object)DBNull.Value : item.NVR_ID);
            cmd.Parameters.AddWithValue("@nvr_channel",      item.nvr_channel.HasValue     ? (object)item.nvr_channel.Value     : DBNull.Value);
            cmd.Parameters.AddWithValue("@install_location", string.IsNullOrWhiteSpace(item.install_location) ? (object)DBNull.Value : item.install_location);
            cmd.Parameters.AddWithValue("@status",           string.IsNullOrWhiteSpace(item.status)          ? (object)DBNull.Value : item.status);
            cmd.Parameters.AddWithValue("@fail_count",       item.fail_count.HasValue      ? (object)item.fail_count.Value      : DBNull.Value);
            cmd.Parameters.AddWithValue("@last_seen",        string.IsNullOrWhiteSpace(item.last_seen)       ? (object)DBNull.Value : item.last_seen);
            cmd.Parameters.AddWithValue("@notes",            string.IsNullOrWhiteSpace(item.notes)           ? (object)DBNull.Value : item.notes);
        }
        #endregion

        #region Update : cameras
        [Route("api/cameras/{id}")]
        [HttpPost]
        public IHttpActionResult Updatecameras(int id, [FromBody] camerasModel model)
        {
            if (!RequestContext.Principal.IsInRole("admin") &&
                !RequestContext.Principal.IsInRole("user"))
                return StatusCode(System.Net.HttpStatusCode.Forbidden);

            if (model == null)
                return BadRequest("Value cannot be null");

            try
            {
                using (var con = new SqlConnection(ConnectionDB.ConnectionStringCN))
                {
                    con.Open();
                    string sql = @"
                        UPDATE [dbo].[cameras]
                        SET Site_ID          = @Site_ID,
                            Building_ID      = @Building_ID,
                            Floor_ID         = @Floor_ID,
                            device_name      = @device_name,
                            brand            = @brand,
                            model            = @model,
                            serial_no        = @serial_no,
                            mac_address      = @mac_address,
                            camera_type      = @camera_type,
                            resolution       = @resolution,
                            firmware_version = @firmware_version,
                            ip_address       = @ip_address,
                            vlan_id          = @vlan_id,
                            subnet_mask      = @subnet_mask,
                            gateway          = @gateway,
                            NVR_CH           = @NVR_CH,
                            SW_ID            = @SW_ID,
                            poe_port_number  = @poe_port_number,
                            NVR_ID           = @NVR_ID,
                            nvr_channel      = @nvr_channel,
                            install_location = @install_location,
                            status           = @status,
                            fail_count       = @fail_count,
                            last_seen        = @last_seen,
                            notes            = @notes,
                            updated_at       = SYSUTCDATETIME()
                        WHERE id = @id;";

                    using (var cmd = new SqlCommand(sql, con))
                    {
                        cmd.Parameters.AddWithValue("@id", id);
                        cmd.Parameters.AddWithValue("@Site_ID",          string.IsNullOrWhiteSpace(model.Site_ID)         ? (object)DBNull.Value : model.Site_ID);
                        cmd.Parameters.AddWithValue("@Building_ID",      string.IsNullOrWhiteSpace(model.Building_ID)     ? (object)DBNull.Value : model.Building_ID);
                        cmd.Parameters.AddWithValue("@Floor_ID",         string.IsNullOrWhiteSpace(model.Floor_ID)        ? (object)DBNull.Value : model.Floor_ID);
                        cmd.Parameters.AddWithValue("@device_name",      string.IsNullOrWhiteSpace(model.device_name)     ? (object)DBNull.Value : model.device_name);
                        cmd.Parameters.AddWithValue("@brand",            string.IsNullOrWhiteSpace(model.brand)           ? (object)DBNull.Value : model.brand);
                        cmd.Parameters.AddWithValue("@model",            string.IsNullOrWhiteSpace(model.model)           ? (object)DBNull.Value : model.model);
                        cmd.Parameters.AddWithValue("@serial_no",        string.IsNullOrWhiteSpace(model.serial_no)       ? (object)DBNull.Value : model.serial_no);
                        cmd.Parameters.AddWithValue("@mac_address",      string.IsNullOrWhiteSpace(model.mac_address)     ? (object)DBNull.Value : model.mac_address);
                        cmd.Parameters.AddWithValue("@camera_type",      string.IsNullOrWhiteSpace(model.camera_type)     ? (object)DBNull.Value : model.camera_type);
                        cmd.Parameters.AddWithValue("@resolution",       string.IsNullOrWhiteSpace(model.resolution)      ? (object)DBNull.Value : model.resolution);
                        cmd.Parameters.AddWithValue("@firmware_version", string.IsNullOrWhiteSpace(model.firmware_version) ? (object)DBNull.Value : model.firmware_version);
                        cmd.Parameters.AddWithValue("@ip_address",       string.IsNullOrWhiteSpace(model.ip_address)      ? (object)DBNull.Value : model.ip_address);
                        cmd.Parameters.AddWithValue("@vlan_id",          model.vlan_id.HasValue         ? (object)model.vlan_id.Value         : DBNull.Value);
                        cmd.Parameters.AddWithValue("@subnet_mask",      string.IsNullOrWhiteSpace(model.subnet_mask)     ? (object)DBNull.Value : model.subnet_mask);
                        cmd.Parameters.AddWithValue("@gateway",          string.IsNullOrWhiteSpace(model.gateway)         ? (object)DBNull.Value : model.gateway);
                        cmd.Parameters.AddWithValue("@NVR_CH",           string.IsNullOrWhiteSpace(model.NVR_CH)          ? (object)DBNull.Value : model.NVR_CH);
                        cmd.Parameters.AddWithValue("@SW_ID",            string.IsNullOrWhiteSpace(model.SW_ID)           ? (object)DBNull.Value : model.SW_ID);
                        cmd.Parameters.AddWithValue("@poe_port_number",  model.poe_port_number.HasValue ? (object)model.poe_port_number.Value : DBNull.Value);
                        cmd.Parameters.AddWithValue("@NVR_ID",           string.IsNullOrWhiteSpace(model.NVR_ID)          ? (object)DBNull.Value : model.NVR_ID);
                        cmd.Parameters.AddWithValue("@nvr_channel",      model.nvr_channel.HasValue     ? (object)model.nvr_channel.Value     : DBNull.Value);
                        cmd.Parameters.AddWithValue("@install_location", string.IsNullOrWhiteSpace(model.install_location) ? (object)DBNull.Value : model.install_location);
                        cmd.Parameters.AddWithValue("@status",           string.IsNullOrWhiteSpace(model.status)          ? (object)DBNull.Value : model.status);
                        cmd.Parameters.AddWithValue("@fail_count",       model.fail_count.HasValue      ? (object)model.fail_count.Value      : DBNull.Value);
                        cmd.Parameters.AddWithValue("@last_seen",        string.IsNullOrWhiteSpace(model.last_seen)       ? (object)DBNull.Value : model.last_seen);
                        cmd.Parameters.AddWithValue("@notes",            string.IsNullOrWhiteSpace(model.notes)           ? (object)DBNull.Value : model.notes);

                        int rows = cmd.ExecuteNonQuery();
                        if (rows == 0) return NotFound();
                    }
                }
                return Ok(new { success = true, id });
            }
            catch (Exception) { return InternalServerError(new Exception("An internal error occurred")); }
        }
        #endregion

        #region Delete : cameras
        [HttpPost]
        [Route("api/cameras/delete/{id}")]
        public IHttpActionResult Deletecameras(int id)
        {
            try
            {
                using (var con = new SqlConnection(ConnectionDB.ConnectionStringCN))
                {
                    con.Open();
                    string sql = @"DELETE FROM [dbo].[cameras] WHERE id = @id;";
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

        #region PATCH : cameras/{id}/position
        public class PositionRequest
        {
            public decimal? x { get; set; }
            public decimal? y { get; set; }
        }

        [HttpPatch]
        [Route("api/cameras/{id}/position")]
        public IHttpActionResult PatchPosition(int id, [FromBody] PositionRequest req)
        {
            if (!RequestContext.Principal.IsInRole("admin") && !RequestContext.Principal.IsInRole("user"))
                return StatusCode(System.Net.HttpStatusCode.Forbidden);

            if (req == null || !req.x.HasValue || !req.y.HasValue)
                return BadRequest("x and y are required");

            if (req.x < 0 || req.x > 1 || req.y < 0 || req.y > 1)
                return BadRequest("x and y must be between 0.0 and 1.0");

            var identity = RequestContext.Principal?.Identity as System.Security.Claims.ClaimsIdentity;
            var userIdStr = identity?.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value;
            int? setBy = int.TryParse(userIdStr, out int uid) ? (int?)uid : null;

            try
            {
                using (var con = new SqlConnection(ConnectionDB.ConnectionStringCN))
                {
                    con.Open();
                    using (var cmd = new SqlCommand(@"
                        UPDATE cameras
                        SET position_x = @x, position_y = @y,
                            position_set_at = GETUTCDATE(), position_set_by = @setBy
                        WHERE id = @id", con))
                    {
                        cmd.Parameters.AddWithValue("@x", req.x.Value);
                        cmd.Parameters.AddWithValue("@y", req.y.Value);
                        cmd.Parameters.AddWithValue("@setBy", setBy.HasValue ? (object)setBy.Value : DBNull.Value);
                        cmd.Parameters.AddWithValue("@id", id);
                        int rows = cmd.ExecuteNonQuery();
                        if (rows == 0) return NotFound();
                    }
                }
                return Ok(new { success = true, id, x = req.x, y = req.y });
            }
            catch (Exception) { return InternalServerError(new Exception("An internal error occurred")); }
        }
        #endregion
    }
}

