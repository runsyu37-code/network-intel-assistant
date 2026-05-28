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
    public class racksController : ApiController
    {
        #region GET : racks (list, enriched with JOIN + computed fields)
        [Route("api/racks")]
        [HttpGet]
        [RequireRole("admin", "user")]
        public IHttpActionResult GetRacks(string Site_ID = null, string Room_ID = null)
        {
            var list = new List<object>();
            using (var con = new SqlConnection(ConnectionDB.ConnectionStringCN))
            {
                con.Open();
                string sql = @"
                    SELECT
                        r.Rack_ID, r.name, r.Site_ID, r.Building_ID, r.Floor_ID, r.Room_ID,
                        r.total_units, r.max_power_w,
                        rm.name AS room_name,
                        s.name  AS site_name,
                        b.name  AS building_name,
                        (SELECT COUNT(*) FROM nvrs         n  WHERE n.Rack_ID  = r.Rack_ID) +
                        (SELECT COUNT(*) FROM poe_switches ps WHERE ps.Rack_ID = r.Rack_ID) AS device_count,
                        ISNULL((SELECT SUM(ISNULL(u_size,0)) FROM nvrs         n  WHERE n.Rack_ID  = r.Rack_ID),0) +
                        ISNULL((SELECT SUM(ISNULL(u_size,0)) FROM poe_switches ps WHERE ps.Rack_ID = r.Rack_ID),0) AS used_units,
                        CAST(ISNULL((SELECT SUM(ISNULL(poe_used_w,0)) FROM poe_switches ps WHERE ps.Rack_ID = r.Rack_ID),0) AS float) / 1000.0 AS power_kw,
                        CASE
                            WHEN EXISTS(SELECT 1 FROM nvrs         n  WHERE n.Rack_ID  = r.Rack_ID AND n.status  = 'offline')
                              OR EXISTS(SELECT 1 FROM poe_switches ps WHERE ps.Rack_ID = r.Rack_ID AND ps.status = 'offline') THEN 'offline'
                            WHEN EXISTS(SELECT 1 FROM nvrs         n  WHERE n.Rack_ID  = r.Rack_ID AND n.status  = 'warning')
                              OR EXISTS(SELECT 1 FROM poe_switches ps WHERE ps.Rack_ID = r.Rack_ID AND ps.status = 'warning') THEN 'warning'
                            ELSE 'online'
                        END AS status
                    FROM racks r
                    LEFT JOIN rooms     rm ON rm.Room_ID    = r.Room_ID
                    LEFT JOIN sites     s  ON s.Site_ID     = r.Site_ID
                    LEFT JOIN buildings b  ON b.Building_ID = r.Building_ID
                    WHERE 1=1";
                if (!string.IsNullOrWhiteSpace(Site_ID)) sql += " AND r.Site_ID = @Site_ID";
                if (!string.IsNullOrWhiteSpace(Room_ID)) sql += " AND r.Room_ID = @Room_ID";

                using (var cmd = new SqlCommand(sql, con))
                {
                    if (!string.IsNullOrWhiteSpace(Site_ID)) cmd.Parameters.AddWithValue("@Site_ID", Site_ID);
                    if (!string.IsNullOrWhiteSpace(Room_ID)) cmd.Parameters.AddWithValue("@Room_ID", Room_ID);
                    using (var reader = cmd.ExecuteReader())
                    {
                        while (reader.Read())
                        {
                            var maxPw = reader["max_power_w"] == DBNull.Value ? (int?)null : Convert.ToInt32(reader["max_power_w"]);
                            list.Add(new
                            {
                                Rack_ID         = reader["Rack_ID"].ToString(),
                                name            = reader["name"].ToString(),
                                Site_ID         = reader["Site_ID"].ToString(),
                                Building_ID     = reader["Building_ID"].ToString(),
                                Floor_ID        = reader["Floor_ID"].ToString(),
                                Room_ID         = reader["Room_ID"].ToString(),
                                room_name       = reader["room_name"]     == DBNull.Value ? null : reader["room_name"].ToString(),
                                site_name       = reader["site_name"]     == DBNull.Value ? null : reader["site_name"].ToString(),
                                building_name   = reader["building_name"] == DBNull.Value ? null : reader["building_name"].ToString(),
                                total_units     = Convert.ToInt32(reader["total_units"]),
                                used_units      = Convert.ToInt32(reader["used_units"]),
                                device_count    = Convert.ToInt32(reader["device_count"]),
                                power_kw        = Math.Round(Convert.ToDouble(reader["power_kw"]), 2),
                                power_budget_kw = maxPw.HasValue ? (double?)Math.Round(maxPw.Value / 1000.0, 2) : null,
                                status          = reader["status"].ToString()
                            });
                        }
                    }
                }
            }
            return Json(list);
        }
        #endregion

        #region GET : racks/{rackId} (detail with devices + alerts)
        [Route("api/racks/{rackId}")]
        [HttpGet]
        [RequireRole("admin", "user")]
        public IHttpActionResult GetRackDetail(string rackId)
        {
            string rackIdOut = null, rackName = null, siteName = null, buildingName = null, roomName = null, rackStatus = null;
            int totalUnits = 0, usedUnits = 0;
            double powerKw = 0;
            double? powerBudgetKw = null;

            var devices   = new List<object>();
            var alerts    = new List<object>();
            var deviceIds = new List<string>();

            using (var con = new SqlConnection(ConnectionDB.ConnectionStringCN))
            {
                con.Open();

                // rack header
                string rackSql = @"
                    SELECT
                        r.Rack_ID, r.name, r.total_units, r.max_power_w,
                        rm.name AS room_name,
                        s.name  AS site_name,
                        b.name  AS building_name,
                        ISNULL((SELECT SUM(ISNULL(u_size,0)) FROM nvrs         n  WHERE n.Rack_ID  = r.Rack_ID),0) +
                        ISNULL((SELECT SUM(ISNULL(u_size,0)) FROM poe_switches ps WHERE ps.Rack_ID = r.Rack_ID),0) AS used_units,
                        CAST(ISNULL((SELECT SUM(ISNULL(poe_used_w,0)) FROM poe_switches ps WHERE ps.Rack_ID = r.Rack_ID),0) AS float) / 1000.0 AS power_kw,
                        CASE
                            WHEN EXISTS(SELECT 1 FROM nvrs         n  WHERE n.Rack_ID  = r.Rack_ID AND n.status  = 'offline')
                              OR EXISTS(SELECT 1 FROM poe_switches ps WHERE ps.Rack_ID = r.Rack_ID AND ps.status = 'offline') THEN 'offline'
                            WHEN EXISTS(SELECT 1 FROM nvrs         n  WHERE n.Rack_ID  = r.Rack_ID AND n.status  = 'warning')
                              OR EXISTS(SELECT 1 FROM poe_switches ps WHERE ps.Rack_ID = r.Rack_ID AND ps.status = 'warning') THEN 'warning'
                            ELSE 'online'
                        END AS status
                    FROM racks r
                    LEFT JOIN rooms     rm ON rm.Room_ID    = r.Room_ID
                    LEFT JOIN sites     s  ON s.Site_ID     = r.Site_ID
                    LEFT JOIN buildings b  ON b.Building_ID = r.Building_ID
                    WHERE r.Rack_ID = @Rack_ID";

                using (var cmd = new SqlCommand(rackSql, con))
                {
                    cmd.Parameters.AddWithValue("@Rack_ID", rackId);
                    using (var reader = cmd.ExecuteReader())
                    {
                        if (!reader.Read()) return NotFound();
                        var maxPw = reader["max_power_w"] == DBNull.Value ? (int?)null : Convert.ToInt32(reader["max_power_w"]);
                        rackIdOut      = reader["Rack_ID"].ToString();
                        rackName       = reader["name"].ToString();
                        siteName       = reader["site_name"]     == DBNull.Value ? null : reader["site_name"].ToString();
                        buildingName   = reader["building_name"] == DBNull.Value ? null : reader["building_name"].ToString();
                        roomName       = reader["room_name"]     == DBNull.Value ? null : reader["room_name"].ToString();
                        totalUnits     = Convert.ToInt32(reader["total_units"]);
                        usedUnits      = Convert.ToInt32(reader["used_units"]);
                        powerKw        = Math.Round(Convert.ToDouble(reader["power_kw"]), 2);
                        powerBudgetKw  = maxPw.HasValue ? (double?)Math.Round(maxPw.Value / 1000.0, 2) : null;
                        rackStatus     = reader["status"].ToString();
                    }
                }

                // NVRs in rack
                using (var cmd = new SqlCommand(
                    "SELECT NVR_ID, device_name, model, status, ip_internet, u_position FROM nvrs WHERE Rack_ID = @Rack_ID", con))
                {
                    cmd.Parameters.AddWithValue("@Rack_ID", rackId);
                    using (var reader = cmd.ExecuteReader())
                    {
                        while (reader.Read())
                        {
                            var id = reader["NVR_ID"].ToString();
                            deviceIds.Add(id);
                            devices.Add(new
                            {
                                device_id   = id,
                                device_name = reader["device_name"].ToString(),
                                device_type = "nvr",
                                model       = reader["model"]       == DBNull.Value ? null : reader["model"].ToString(),
                                status      = reader["status"].ToString(),
                                ip_address  = reader["ip_internet"] == DBNull.Value ? null : reader["ip_internet"].ToString(),
                                rack_unit   = reader["u_position"]  == DBNull.Value ? (int?)null : Convert.ToInt32(reader["u_position"])
                            });
                        }
                    }
                }

                // PoE Switches in rack
                using (var cmd = new SqlCommand(
                    "SELECT SW_ID, device_name, model, status, ip_address, u_position FROM poe_switches WHERE Rack_ID = @Rack_ID", con))
                {
                    cmd.Parameters.AddWithValue("@Rack_ID", rackId);
                    using (var reader = cmd.ExecuteReader())
                    {
                        while (reader.Read())
                        {
                            var id = reader["SW_ID"].ToString();
                            deviceIds.Add(id);
                            devices.Add(new
                            {
                                device_id   = id,
                                device_name = reader["device_name"].ToString(),
                                device_type = "switch",
                                model       = reader["model"]     == DBNull.Value ? null : reader["model"].ToString(),
                                status      = reader["status"].ToString(),
                                ip_address  = reader["ip_address"] == DBNull.Value ? null : reader["ip_address"].ToString(),
                                rack_unit   = reader["u_position"] == DBNull.Value ? (int?)null : Convert.ToInt32(reader["u_position"])
                            });
                        }
                    }
                }

                // Unresolved alerts for devices in this rack
                if (deviceIds.Count > 0)
                {
                    var paramNames = deviceIds.Select((_, i) => "@did" + i).ToList();
                    string alertSql = string.Format(@"
                        SELECT alert_type, device_name, message, alerted_at
                        FROM alert_logs
                        WHERE resolved_at IS NULL
                          AND device_id IN ({0})
                        ORDER BY alerted_at DESC", string.Join(",", paramNames));

                    using (var cmd = new SqlCommand(alertSql, con))
                    {
                        for (int i = 0; i < deviceIds.Count; i++)
                            cmd.Parameters.AddWithValue("@did" + i, deviceIds[i]);
                        using (var reader = cmd.ExecuteReader())
                        {
                            while (reader.Read())
                            {
                                alerts.Add(new
                                {
                                    status      = reader["alert_type"] == DBNull.Value ? "warning" : reader["alert_type"].ToString(),
                                    device_name = reader["device_name"].ToString(),
                                    message     = reader["message"]    == DBNull.Value ? null : reader["message"].ToString(),
                                    alerted_at  = reader["alerted_at"].ToString()
                                });
                            }
                        }
                    }
                }
            }

            return Json(new
            {
                Rack_ID         = rackIdOut,
                name            = rackName,
                site_name       = siteName,
                building_name   = buildingName,
                room_name       = roomName,
                total_units     = totalUnits,
                used_units      = usedUnits,
                power_kw        = powerKw,
                power_budget_kw = powerBudgetKw,
                status          = rackStatus,
                devices         = devices,
                alerts          = alerts
            });
        }
        #endregion

        #region Save : racks
        [Route("api/racks")]
        [HttpPost]
        [RequireRole("admin")]
        public IHttpActionResult Saveracks([FromBody] List<racksModel> modelList)
        {
            if (modelList == null || modelList.Count == 0)
                return BadRequest("No data provided");

            if (modelList.Any(x => string.IsNullOrWhiteSpace(x.Rack_ID)))
                return BadRequest("Rack_ID is required");

            int insertCount = 0;
            try
            {
                using (var con = new SqlConnection(ConnectionDB.ConnectionStringCN))
                {
                    con.Open();
                    string insertSql = @"
                        INSERT INTO [dbo].[racks] ([Rack_ID],[Site_ID],[Building_ID],[Floor_ID],[Room_ID],[name],[total_units],[units_per_u],[brand],[model],[max_power_w],[image_data],[image_type],[note])
                        VALUES (@Rack_ID,@Site_ID,@Building_ID,@Floor_ID,@Room_ID,@name,@total_units,@units_per_u,@brand,@model,@max_power_w,@image_data,@image_type,@note);";

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
            catch (Exception)    { return InternalServerError(new Exception("An internal error occurred")); }
        }

        private void AddParameters(SqlCommand cmd, racksModel item)
        {
            cmd.Parameters.AddWithValue("@Rack_ID",     string.IsNullOrWhiteSpace(item.Rack_ID)     ? (object)DBNull.Value : item.Rack_ID);
            cmd.Parameters.AddWithValue("@Site_ID",     string.IsNullOrWhiteSpace(item.Site_ID)     ? (object)DBNull.Value : item.Site_ID);
            cmd.Parameters.AddWithValue("@Building_ID", string.IsNullOrWhiteSpace(item.Building_ID) ? (object)DBNull.Value : item.Building_ID);
            cmd.Parameters.AddWithValue("@Floor_ID",    string.IsNullOrWhiteSpace(item.Floor_ID)    ? (object)DBNull.Value : item.Floor_ID);
            cmd.Parameters.AddWithValue("@Room_ID",     string.IsNullOrWhiteSpace(item.Room_ID)     ? (object)DBNull.Value : item.Room_ID);
            cmd.Parameters.AddWithValue("@name",        string.IsNullOrWhiteSpace(item.name)        ? (object)DBNull.Value : item.name);
            cmd.Parameters.AddWithValue("@total_units", item.total_units);
            cmd.Parameters.AddWithValue("@units_per_u", item.units_per_u);
            cmd.Parameters.AddWithValue("@brand",       string.IsNullOrWhiteSpace(item.brand)       ? (object)DBNull.Value : item.brand);
            cmd.Parameters.AddWithValue("@model",       string.IsNullOrWhiteSpace(item.model)       ? (object)DBNull.Value : item.model);
            cmd.Parameters.AddWithValue("@max_power_w", item.max_power_w.HasValue ? (object)item.max_power_w.Value : DBNull.Value);
            cmd.Parameters.AddWithValue("@image_data",  string.IsNullOrWhiteSpace(item.image_data)  ? (object)DBNull.Value : item.image_data);
            cmd.Parameters.AddWithValue("@image_type",  string.IsNullOrWhiteSpace(item.image_type)  ? (object)DBNull.Value : item.image_type);
            cmd.Parameters.AddWithValue("@note",        string.IsNullOrWhiteSpace(item.note)        ? (object)DBNull.Value : item.note);
        }
        #endregion

        #region Update : racks
        [Route("api/racks/{Rack_ID}")]
        [HttpPost]
        [RequireRole("admin")]
        public IHttpActionResult Updateracks(string Rack_ID, [FromBody] racksModel model)
        {
            if (model == null || string.IsNullOrWhiteSpace(model.Rack_ID))
                return BadRequest("Value cannot be null");

            try
            {
                using (var con = new SqlConnection(ConnectionDB.ConnectionStringCN))
                {
                    con.Open();
                    string sql = @"
                        UPDATE [dbo].[racks]
                        SET Site_ID     = @Site_ID,
                            Building_ID = @Building_ID,
                            Floor_ID    = @Floor_ID,
                            Room_ID     = @Room_ID,
                            name        = @name,
                            total_units = @total_units,
                            units_per_u = @units_per_u,
                            brand       = @brand,
                            model       = @model,
                            max_power_w = @max_power_w,
                            image_data  = @image_data,
                            image_type  = @image_type,
                            note        = @note,
                            updated_at  = SYSUTCDATETIME()
                        WHERE Rack_ID = @Rack_ID;";

                    using (var cmd = new SqlCommand(sql, con))
                    {
                        cmd.Parameters.AddWithValue("@Rack_ID",     model.Rack_ID);
                        cmd.Parameters.AddWithValue("@Site_ID",     string.IsNullOrWhiteSpace(model.Site_ID)     ? (object)DBNull.Value : model.Site_ID);
                        cmd.Parameters.AddWithValue("@Building_ID", string.IsNullOrWhiteSpace(model.Building_ID) ? (object)DBNull.Value : model.Building_ID);
                        cmd.Parameters.AddWithValue("@Floor_ID",    string.IsNullOrWhiteSpace(model.Floor_ID)    ? (object)DBNull.Value : model.Floor_ID);
                        cmd.Parameters.AddWithValue("@Room_ID",     string.IsNullOrWhiteSpace(model.Room_ID)     ? (object)DBNull.Value : model.Room_ID);
                        cmd.Parameters.AddWithValue("@name",        string.IsNullOrWhiteSpace(model.name)        ? (object)DBNull.Value : model.name);
                        cmd.Parameters.AddWithValue("@total_units", model.total_units);
                        cmd.Parameters.AddWithValue("@units_per_u", model.units_per_u);
                        cmd.Parameters.AddWithValue("@brand",       string.IsNullOrWhiteSpace(model.brand)       ? (object)DBNull.Value : model.brand);
                        cmd.Parameters.AddWithValue("@model",       string.IsNullOrWhiteSpace(model.model)       ? (object)DBNull.Value : model.model);
                        cmd.Parameters.AddWithValue("@max_power_w", model.max_power_w.HasValue ? (object)model.max_power_w.Value : DBNull.Value);
                        cmd.Parameters.AddWithValue("@image_data",  string.IsNullOrWhiteSpace(model.image_data)  ? (object)DBNull.Value : model.image_data);
                        cmd.Parameters.AddWithValue("@image_type",  string.IsNullOrWhiteSpace(model.image_type)  ? (object)DBNull.Value : model.image_type);
                        cmd.Parameters.AddWithValue("@note",        string.IsNullOrWhiteSpace(model.note)        ? (object)DBNull.Value : model.note);

                        int rows = cmd.ExecuteNonQuery();
                        if (rows == 0) return NotFound();
                    }
                }
                return Ok(new { success = true, Rack_ID });
            }
            catch (Exception) { return InternalServerError(new Exception("An internal error occurred")); }
        }
        #endregion

        #region Delete : racks
        [HttpPost]
        [Route("api/racks/delete/{Rack_ID}")]
        [RequireRole("admin")]
        public IHttpActionResult Deleteracks(string Rack_ID)
        {
            if (string.IsNullOrWhiteSpace(Rack_ID))
                return BadRequest("Rack_ID is required");

            try
            {
                using (var con = new SqlConnection(ConnectionDB.ConnectionStringCN))
                {
                    con.Open();
                    string pre = @"
                        DELETE FROM [dbo].[poe_switches] WHERE Rack_ID = @Rack_ID;
                        DELETE FROM [dbo].[nvrs]         WHERE Rack_ID = @Rack_ID;";
                    using (var pre_cmd = new SqlCommand(pre, con))
                    {
                        pre_cmd.Parameters.AddWithValue("@Rack_ID", Rack_ID);
                        pre_cmd.ExecuteNonQuery();
                    }
                    string sql = @"DELETE FROM [dbo].[racks] WHERE Rack_ID = @Rack_ID;";
                    using (var cmd = new SqlCommand(sql, con))
                    {
                        cmd.Parameters.AddWithValue("@Rack_ID", Rack_ID);
                        int rows = cmd.ExecuteNonQuery();
                        if (rows == 0) return NotFound();
                        return Ok(new { success = true, deleted = rows, Rack_ID });
                    }
                }
            }
            catch (Exception) { return InternalServerError(new Exception("An internal error occurred")); }
        }
        #endregion
    }
}
