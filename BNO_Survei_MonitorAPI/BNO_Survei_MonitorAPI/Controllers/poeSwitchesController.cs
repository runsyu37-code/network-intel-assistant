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
    public class poeSwitchesController : ApiController
    {
        #region GET : poe_switches
        [Route("api/poe-switches")]
        [HttpGet]
        public IHttpActionResult GetPoeSwitches(string Site_ID = null, string Rack_ID = null, string status = null, string SW_ID = null)
        {
            List<poeSwitchesModel> ListRP = new List<poeSwitchesModel>();
            using (SqlConnection con = new SqlConnection(ConnectionDB.ConnectionStringCN))
            {
                con.Open();
                string sql = "SELECT [SW_ID],[Site_ID],[Building_ID],[Floor_ID],[Room_ID],[Rack_ID],[u_position],[u_subposition],[u_size],[device_name],[switch_type],[brand],[model],[serial_no],[mac_address],[os_version],[ip_address],[vlan_id],[subnet_mask],[gateway],[total_ports],[poe_ports],[poe_budget_w],[poe_used_w],[uplink_port],[status],[fail_count],[last_seen],[notes],[created_at],[updated_at] FROM [dbo].[poe_switches] WHERE 1=1";
                if (!string.IsNullOrWhiteSpace(Site_ID)) sql += " AND Site_ID = @Site_ID";
                if (!string.IsNullOrWhiteSpace(Rack_ID)) sql += " AND Rack_ID = @Rack_ID";
                if (!string.IsNullOrWhiteSpace(status))  sql += " AND status = @status";
                if (!string.IsNullOrWhiteSpace(SW_ID))   sql += " AND SW_ID = @SW_ID";
                SqlCommand cmd = new SqlCommand(sql, con);
                if (!string.IsNullOrWhiteSpace(Site_ID)) cmd.Parameters.AddWithValue("@Site_ID", Site_ID);
                if (!string.IsNullOrWhiteSpace(Rack_ID)) cmd.Parameters.AddWithValue("@Rack_ID", Rack_ID);
                if (!string.IsNullOrWhiteSpace(status))  cmd.Parameters.AddWithValue("@status", status);
                if (!string.IsNullOrWhiteSpace(SW_ID))   cmd.Parameters.AddWithValue("@SW_ID", SW_ID);
                using (var reader = cmd.ExecuteReader())
                {
                    while (reader.Read())
                    {
                        ListRP.Add(new poeSwitchesModel
                        {
                            SW_ID         = reader["SW_ID"].ToString(),
                            Site_ID       = reader["Site_ID"].ToString(),
                            Building_ID   = reader["Building_ID"].ToString(),
                            Floor_ID      = reader["Floor_ID"].ToString(),
                            Room_ID       = reader["Room_ID"].ToString(),
                            Rack_ID       = reader["Rack_ID"].ToString(),
                            u_position    = reader["u_position"]    == DBNull.Value ? (int?)null : Convert.ToInt32(reader["u_position"]),
                            u_subposition = reader["u_subposition"] == DBNull.Value ? (int?)null : Convert.ToInt32(reader["u_subposition"]),
                            u_size        = reader["u_size"]        == DBNull.Value ? (int?)null : Convert.ToInt32(reader["u_size"]),
                            device_name   = reader["device_name"].ToString(),
                            switch_type   = reader["switch_type"]   == DBNull.Value ? null : reader["switch_type"].ToString(),
                            brand         = reader["brand"]         == DBNull.Value ? null : reader["brand"].ToString(),
                            model         = reader["model"]         == DBNull.Value ? null : reader["model"].ToString(),
                            serial_no     = reader["serial_no"]     == DBNull.Value ? null : reader["serial_no"].ToString(),
                            mac_address   = reader["mac_address"]   == DBNull.Value ? null : reader["mac_address"].ToString(),
                            os_version    = reader["os_version"]    == DBNull.Value ? null : reader["os_version"].ToString(),
                            ip_address    = reader["ip_address"]    == DBNull.Value ? null : reader["ip_address"].ToString(),
                            vlan_id       = reader["vlan_id"]       == DBNull.Value ? (int?)null : Convert.ToInt32(reader["vlan_id"]),
                            subnet_mask   = reader["subnet_mask"]   == DBNull.Value ? null : reader["subnet_mask"].ToString(),
                            gateway       = reader["gateway"]       == DBNull.Value ? null : reader["gateway"].ToString(),
                            total_ports   = reader["total_ports"]   == DBNull.Value ? (int?)null : Convert.ToInt32(reader["total_ports"]),
                            poe_ports     = reader["poe_ports"]     == DBNull.Value ? (int?)null : Convert.ToInt32(reader["poe_ports"]),
                            poe_budget_w  = reader["poe_budget_w"]  == DBNull.Value ? (int?)null : Convert.ToInt32(reader["poe_budget_w"]),
                            poe_used_w    = reader["poe_used_w"]    == DBNull.Value ? (int?)null : Convert.ToInt32(reader["poe_used_w"]),
                            uplink_port   = reader["uplink_port"]   == DBNull.Value ? null : reader["uplink_port"].ToString(),
                            status        = reader["status"]        == DBNull.Value ? null : reader["status"].ToString(),
                            fail_count    = reader["fail_count"]    == DBNull.Value ? (int?)null : Convert.ToInt32(reader["fail_count"]),
                            last_seen     = reader["last_seen"]     == DBNull.Value ? null : reader["last_seen"].ToString(),
                            notes         = reader["notes"]         == DBNull.Value ? null : reader["notes"].ToString(),
                            created_at    = reader["created_at"].ToString(),
                            updated_at    = reader["updated_at"].ToString(),
                        });
                    }
                }
            }
            return Json(ListRP);
        }
        #endregion

        #region Save : poe_switches
        [Route("api/poe-switches")]
        [HttpPost]
        public IHttpActionResult SavepoeSwitches([FromBody] List<poeSwitchesModel> modelList)
        {
            if (modelList == null || modelList.Count == 0)
                return BadRequest("No data provided");

            if (modelList.Any(x => string.IsNullOrWhiteSpace(x.SW_ID)))
                return BadRequest("SW_ID is required");

            int insertCount = 0;
            try
            {
                using (var con = new SqlConnection(ConnectionDB.ConnectionStringCN))
                {
                    con.Open();
                    string insertSql = @"
                        INSERT INTO [dbo].[poe_switches] ([SW_ID],[Site_ID],[Building_ID],[Floor_ID],[Room_ID],[Rack_ID],[u_position],[u_subposition],[u_size],[device_name],[switch_type],[brand],[model],[serial_no],[mac_address],[os_version],[ip_address],[vlan_id],[subnet_mask],[gateway],[total_ports],[poe_ports],[poe_budget_w],[poe_used_w],[uplink_port],[status],[fail_count],[last_seen],[notes])
                        VALUES (@SW_ID,@Site_ID,@Building_ID,@Floor_ID,@Room_ID,@Rack_ID,@u_position,@u_subposition,@u_size,@device_name,@switch_type,@brand,@model,@serial_no,@mac_address,@os_version,@ip_address,@vlan_id,@subnet_mask,@gateway,@total_ports,@poe_ports,@poe_budget_w,@poe_used_w,@uplink_port,@status,@fail_count,@last_seen,@notes);";

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

        private void AddParameters(SqlCommand cmd, poeSwitchesModel item)
        {
            cmd.Parameters.AddWithValue("@SW_ID",         string.IsNullOrWhiteSpace(item.SW_ID)       ? (object)DBNull.Value : item.SW_ID);
            cmd.Parameters.AddWithValue("@Site_ID",       string.IsNullOrWhiteSpace(item.Site_ID)     ? (object)DBNull.Value : item.Site_ID);
            cmd.Parameters.AddWithValue("@Building_ID",   string.IsNullOrWhiteSpace(item.Building_ID) ? (object)DBNull.Value : item.Building_ID);
            cmd.Parameters.AddWithValue("@Floor_ID",      string.IsNullOrWhiteSpace(item.Floor_ID)    ? (object)DBNull.Value : item.Floor_ID);
            cmd.Parameters.AddWithValue("@Room_ID",       string.IsNullOrWhiteSpace(item.Room_ID)     ? (object)DBNull.Value : item.Room_ID);
            cmd.Parameters.AddWithValue("@Rack_ID",       string.IsNullOrWhiteSpace(item.Rack_ID)     ? (object)DBNull.Value : item.Rack_ID);
            cmd.Parameters.AddWithValue("@u_position",    item.u_position.HasValue    ? (object)item.u_position.Value    : DBNull.Value);
            cmd.Parameters.AddWithValue("@u_subposition", item.u_subposition.HasValue ? (object)item.u_subposition.Value : DBNull.Value);
            cmd.Parameters.AddWithValue("@u_size",        item.u_size.HasValue        ? (object)item.u_size.Value        : DBNull.Value);
            cmd.Parameters.AddWithValue("@device_name",   string.IsNullOrWhiteSpace(item.device_name) ? (object)DBNull.Value : item.device_name);
            cmd.Parameters.AddWithValue("@switch_type",   string.IsNullOrWhiteSpace(item.switch_type) ? (object)DBNull.Value : item.switch_type);
            cmd.Parameters.AddWithValue("@brand",         string.IsNullOrWhiteSpace(item.brand)       ? (object)DBNull.Value : item.brand);
            cmd.Parameters.AddWithValue("@model",         string.IsNullOrWhiteSpace(item.model)       ? (object)DBNull.Value : item.model);
            cmd.Parameters.AddWithValue("@serial_no",     string.IsNullOrWhiteSpace(item.serial_no)   ? (object)DBNull.Value : item.serial_no);
            cmd.Parameters.AddWithValue("@mac_address",   string.IsNullOrWhiteSpace(item.mac_address) ? (object)DBNull.Value : item.mac_address);
            cmd.Parameters.AddWithValue("@os_version",    string.IsNullOrWhiteSpace(item.os_version)  ? (object)DBNull.Value : item.os_version);
            cmd.Parameters.AddWithValue("@ip_address",    string.IsNullOrWhiteSpace(item.ip_address)  ? (object)DBNull.Value : item.ip_address);
            cmd.Parameters.AddWithValue("@vlan_id",       item.vlan_id.HasValue      ? (object)item.vlan_id.Value      : DBNull.Value);
            cmd.Parameters.AddWithValue("@subnet_mask",   string.IsNullOrWhiteSpace(item.subnet_mask) ? (object)DBNull.Value : item.subnet_mask);
            cmd.Parameters.AddWithValue("@gateway",       string.IsNullOrWhiteSpace(item.gateway)     ? (object)DBNull.Value : item.gateway);
            cmd.Parameters.AddWithValue("@total_ports",   item.total_ports.HasValue   ? (object)item.total_ports.Value   : DBNull.Value);
            cmd.Parameters.AddWithValue("@poe_ports",     item.poe_ports.HasValue     ? (object)item.poe_ports.Value     : DBNull.Value);
            cmd.Parameters.AddWithValue("@poe_budget_w",  item.poe_budget_w.HasValue  ? (object)item.poe_budget_w.Value  : DBNull.Value);
            cmd.Parameters.AddWithValue("@poe_used_w",    item.poe_used_w.HasValue    ? (object)item.poe_used_w.Value    : DBNull.Value);
            cmd.Parameters.AddWithValue("@uplink_port",   string.IsNullOrWhiteSpace(item.uplink_port) ? (object)DBNull.Value : item.uplink_port);
            cmd.Parameters.AddWithValue("@status",        string.IsNullOrWhiteSpace(item.status)      ? (object)DBNull.Value : item.status);
            cmd.Parameters.AddWithValue("@fail_count",    item.fail_count.HasValue    ? (object)item.fail_count.Value    : DBNull.Value);
            cmd.Parameters.AddWithValue("@last_seen",     string.IsNullOrWhiteSpace(item.last_seen)   ? (object)DBNull.Value : item.last_seen);
            cmd.Parameters.AddWithValue("@notes",         string.IsNullOrWhiteSpace(item.notes)       ? (object)DBNull.Value : item.notes);
        }
        #endregion

        #region Update : poe_switches
        [Route("api/poe-switches/{SW_ID}")]
        [HttpPost]
        public IHttpActionResult UpdatepoeSwitches(string SW_ID, [FromBody] poeSwitchesModel model)
        {
            if (model == null || string.IsNullOrWhiteSpace(model.SW_ID))
                return BadRequest("Value cannot be null");

            try
            {
                using (var con = new SqlConnection(ConnectionDB.ConnectionStringCN))
                {
                    con.Open();
                    string sql = @"
                        UPDATE [dbo].[poe_switches]
                        SET Site_ID       = @Site_ID,
                            Building_ID   = @Building_ID,
                            Floor_ID      = @Floor_ID,
                            Room_ID       = @Room_ID,
                            Rack_ID       = @Rack_ID,
                            u_position    = @u_position,
                            u_subposition = @u_subposition,
                            u_size        = @u_size,
                            device_name   = @device_name,
                            switch_type   = @switch_type,
                            brand         = @brand,
                            model         = @model,
                            serial_no     = @serial_no,
                            mac_address   = @mac_address,
                            os_version    = @os_version,
                            ip_address    = @ip_address,
                            vlan_id       = @vlan_id,
                            subnet_mask   = @subnet_mask,
                            gateway       = @gateway,
                            total_ports   = @total_ports,
                            poe_ports     = @poe_ports,
                            poe_budget_w  = @poe_budget_w,
                            poe_used_w    = @poe_used_w,
                            uplink_port   = @uplink_port,
                            status        = @status,
                            fail_count    = @fail_count,
                            last_seen     = @last_seen,
                            notes         = @notes,
                            updated_at    = SYSUTCDATETIME()
                        WHERE SW_ID = @SW_ID;";

                    using (var cmd = new SqlCommand(sql, con))
                    {
                        cmd.Parameters.AddWithValue("@SW_ID", model.SW_ID);
                        cmd.Parameters.AddWithValue("@Site_ID",       string.IsNullOrWhiteSpace(model.Site_ID)     ? (object)DBNull.Value : model.Site_ID);
                        cmd.Parameters.AddWithValue("@Building_ID",   string.IsNullOrWhiteSpace(model.Building_ID) ? (object)DBNull.Value : model.Building_ID);
                        cmd.Parameters.AddWithValue("@Floor_ID",      string.IsNullOrWhiteSpace(model.Floor_ID)    ? (object)DBNull.Value : model.Floor_ID);
                        cmd.Parameters.AddWithValue("@Room_ID",       string.IsNullOrWhiteSpace(model.Room_ID)     ? (object)DBNull.Value : model.Room_ID);
                        cmd.Parameters.AddWithValue("@Rack_ID",       string.IsNullOrWhiteSpace(model.Rack_ID)     ? (object)DBNull.Value : model.Rack_ID);
                        cmd.Parameters.AddWithValue("@u_position",    model.u_position.HasValue    ? (object)model.u_position.Value    : DBNull.Value);
                        cmd.Parameters.AddWithValue("@u_subposition", model.u_subposition.HasValue ? (object)model.u_subposition.Value : DBNull.Value);
                        cmd.Parameters.AddWithValue("@u_size",        model.u_size.HasValue        ? (object)model.u_size.Value        : DBNull.Value);
                        cmd.Parameters.AddWithValue("@device_name",   string.IsNullOrWhiteSpace(model.device_name) ? (object)DBNull.Value : model.device_name);
                        cmd.Parameters.AddWithValue("@switch_type",   string.IsNullOrWhiteSpace(model.switch_type) ? (object)DBNull.Value : model.switch_type);
                        cmd.Parameters.AddWithValue("@brand",         string.IsNullOrWhiteSpace(model.brand)       ? (object)DBNull.Value : model.brand);
                        cmd.Parameters.AddWithValue("@model",         string.IsNullOrWhiteSpace(model.model)       ? (object)DBNull.Value : model.model);
                        cmd.Parameters.AddWithValue("@serial_no",     string.IsNullOrWhiteSpace(model.serial_no)   ? (object)DBNull.Value : model.serial_no);
                        cmd.Parameters.AddWithValue("@mac_address",   string.IsNullOrWhiteSpace(model.mac_address) ? (object)DBNull.Value : model.mac_address);
                        cmd.Parameters.AddWithValue("@os_version",    string.IsNullOrWhiteSpace(model.os_version)  ? (object)DBNull.Value : model.os_version);
                        cmd.Parameters.AddWithValue("@ip_address",    string.IsNullOrWhiteSpace(model.ip_address)  ? (object)DBNull.Value : model.ip_address);
                        cmd.Parameters.AddWithValue("@vlan_id",       model.vlan_id.HasValue      ? (object)model.vlan_id.Value      : DBNull.Value);
                        cmd.Parameters.AddWithValue("@subnet_mask",   string.IsNullOrWhiteSpace(model.subnet_mask) ? (object)DBNull.Value : model.subnet_mask);
                        cmd.Parameters.AddWithValue("@gateway",       string.IsNullOrWhiteSpace(model.gateway)     ? (object)DBNull.Value : model.gateway);
                        cmd.Parameters.AddWithValue("@total_ports",   model.total_ports.HasValue   ? (object)model.total_ports.Value   : DBNull.Value);
                        cmd.Parameters.AddWithValue("@poe_ports",     model.poe_ports.HasValue     ? (object)model.poe_ports.Value     : DBNull.Value);
                        cmd.Parameters.AddWithValue("@poe_budget_w",  model.poe_budget_w.HasValue  ? (object)model.poe_budget_w.Value  : DBNull.Value);
                        cmd.Parameters.AddWithValue("@poe_used_w",    model.poe_used_w.HasValue    ? (object)model.poe_used_w.Value    : DBNull.Value);
                        cmd.Parameters.AddWithValue("@uplink_port",   string.IsNullOrWhiteSpace(model.uplink_port) ? (object)DBNull.Value : model.uplink_port);
                        cmd.Parameters.AddWithValue("@status",        string.IsNullOrWhiteSpace(model.status)      ? (object)DBNull.Value : model.status);
                        cmd.Parameters.AddWithValue("@fail_count",    model.fail_count.HasValue    ? (object)model.fail_count.Value    : DBNull.Value);
                        cmd.Parameters.AddWithValue("@last_seen",     string.IsNullOrWhiteSpace(model.last_seen)   ? (object)DBNull.Value : model.last_seen);
                        cmd.Parameters.AddWithValue("@notes",         string.IsNullOrWhiteSpace(model.notes)       ? (object)DBNull.Value : model.notes);

                        int rows = cmd.ExecuteNonQuery();
                        if (rows == 0) return NotFound();
                    }
                }
                return Ok(new { success = true, SW_ID });
            }
            catch (Exception) { return InternalServerError(new Exception("An internal error occurred")); }
        }
        #endregion

        #region Delete : poe_switches
        [HttpPost]
        [Route("api/poe-switches/delete/{SW_ID}")]
        public IHttpActionResult DeletepoeSwitches(string SW_ID)
        {
            if (string.IsNullOrWhiteSpace(SW_ID))
                return BadRequest("SW_ID is required");

            try
            {
                using (var con = new SqlConnection(ConnectionDB.ConnectionStringCN))
                {
                    con.Open();
                    string sql = @"DELETE FROM [dbo].[poe_switches] WHERE SW_ID = @SW_ID;";
                    using (var cmd = new SqlCommand(sql, con))
                    {
                        cmd.Parameters.AddWithValue("@SW_ID", SW_ID);
                        int rows = cmd.ExecuteNonQuery();
                        if (rows == 0) return NotFound();
                        return Ok(new { success = true, deleted = rows, SW_ID });
                    }
                }
            }
            catch (Exception) { return InternalServerError(new Exception("An internal error occurred")); }
        }
        #endregion
    }
}

