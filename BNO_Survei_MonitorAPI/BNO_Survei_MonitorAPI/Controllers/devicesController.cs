using BNO_Survei_MonitorAPI.ConnectDB;
using BNO_Survei_MonitorAPI.Constants;
using BNO_Survei_MonitorAPI.Filters;
using System;
using System.Collections.Generic;
using System.Data.SqlClient;
using System.Linq;
using System.Web.Http;
using TestAPBNO_Survei_MonitorAPI.Models;
using HttpGetAttribute = System.Web.Http.HttpGetAttribute;
using RouteAttribute = System.Web.Http.RouteAttribute;

namespace BNO_Survei_MonitorAPI.Controllers
{
    public class devicesController : ApiController
    {
        #region GET : devices (unified search)
        [Route("api/devices")]
        [HttpGet]
        [RequireRole("admin")]
        public IHttpActionResult GetDevices(
            string device_type  = null,
            string Site_ID      = null,
            string Building_ID  = null,
            string Floor_ID     = null,
            string device_name  = null,
            string ip_address   = null,
            string status       = null)
        {
            var types = string.IsNullOrWhiteSpace(device_type)
                ? new HashSet<string> { DeviceTypes.Camera, DeviceTypes.Nvr, DeviceTypes.PoeSwitch }
                : new HashSet<string>(device_type.Split(',').Select(t => t.Trim().ToLower()));

            var parts = new List<string>();

            if (types.Contains("camera"))
            {
                string q = @"SELECT 'camera' AS device_type,
                             CAST(id AS NVARCHAR(50)) AS device_id,
                             device_name, ip_address, status,
                             Site_ID, Building_ID, Floor_ID,
                             NULL AS Rack_ID, brand, model
                             FROM [dbo].[cameras] WHERE 1=1";
                if (!string.IsNullOrWhiteSpace(Site_ID))     q += " AND Site_ID = @Site_ID";
                if (!string.IsNullOrWhiteSpace(Building_ID)) q += " AND Building_ID = @Building_ID";
                if (!string.IsNullOrWhiteSpace(Floor_ID))    q += " AND Floor_ID = @Floor_ID";
                if (!string.IsNullOrWhiteSpace(device_name)) q += " AND device_name LIKE @device_name";
                if (!string.IsNullOrWhiteSpace(ip_address))  q += " AND ip_address LIKE @ip_address";
                if (!string.IsNullOrWhiteSpace(status))      q += " AND status = @status";
                parts.Add(q);
            }

            if (types.Contains("nvr"))
            {
                string q = @"SELECT 'nvr' AS device_type,
                             NVR_ID AS device_id,
                             device_name, ip_cctv AS ip_address, status,
                             Site_ID, Building_ID, Floor_ID,
                             Rack_ID, brand, model
                             FROM [dbo].[nvrs] WHERE 1=1";
                if (!string.IsNullOrWhiteSpace(Site_ID))     q += " AND Site_ID = @Site_ID";
                if (!string.IsNullOrWhiteSpace(Building_ID)) q += " AND Building_ID = @Building_ID";
                if (!string.IsNullOrWhiteSpace(Floor_ID))    q += " AND Floor_ID = @Floor_ID";
                if (!string.IsNullOrWhiteSpace(device_name)) q += " AND device_name LIKE @device_name";
                if (!string.IsNullOrWhiteSpace(ip_address))  q += " AND ip_cctv LIKE @ip_address";
                if (!string.IsNullOrWhiteSpace(status))      q += " AND status = @status";
                parts.Add(q);
            }

            if (types.Contains(DeviceTypes.PoeSwitch))
            {
                string q = $@"SELECT '{DeviceTypes.PoeSwitch}' AS device_type,
                             SW_ID AS device_id,
                             device_name, ip_address, status,
                             Site_ID, Building_ID, Floor_ID,
                             Rack_ID, brand, model
                             FROM [dbo].[poe_switches] WHERE 1=1";
                if (!string.IsNullOrWhiteSpace(Site_ID))     q += " AND Site_ID = @Site_ID";
                if (!string.IsNullOrWhiteSpace(Building_ID)) q += " AND Building_ID = @Building_ID";
                if (!string.IsNullOrWhiteSpace(Floor_ID))    q += " AND Floor_ID = @Floor_ID";
                if (!string.IsNullOrWhiteSpace(device_name)) q += " AND device_name LIKE @device_name";
                if (!string.IsNullOrWhiteSpace(ip_address))  q += " AND ip_address LIKE @ip_address";
                if (!string.IsNullOrWhiteSpace(status))      q += " AND status = @status";
                parts.Add(q);
            }

            if (parts.Count == 0)
                return Ok(new List<deviceSearchModel>());

            string sql = string.Join(" UNION ALL ", parts);

            var list = new List<deviceSearchModel>();
            try
            {
                using (var con = new SqlConnection(ConnectionDB.ConnectionStringCN))
                {
                    con.Open();
                    using (var cmd = new SqlCommand(sql, con))
                    {
                        if (!string.IsNullOrWhiteSpace(Site_ID))     cmd.Parameters.AddWithValue("@Site_ID", Site_ID);
                        if (!string.IsNullOrWhiteSpace(Building_ID)) cmd.Parameters.AddWithValue("@Building_ID", Building_ID);
                        if (!string.IsNullOrWhiteSpace(Floor_ID))    cmd.Parameters.AddWithValue("@Floor_ID", Floor_ID);
                        if (!string.IsNullOrWhiteSpace(device_name)) cmd.Parameters.AddWithValue("@device_name", "%" + device_name + "%");
                        if (!string.IsNullOrWhiteSpace(ip_address))  cmd.Parameters.AddWithValue("@ip_address",  "%" + ip_address  + "%");
                        if (!string.IsNullOrWhiteSpace(status))      cmd.Parameters.AddWithValue("@status", status);

                        using (var reader = cmd.ExecuteReader())
                        {
                            while (reader.Read())
                            {
                                list.Add(new deviceSearchModel
                                {
                                    device_type = reader["device_type"].ToString(),
                                    device_id   = reader["device_id"].ToString(),
                                    device_name = reader["device_name"].ToString(),
                                    ip_address  = reader["ip_address"]  == DBNull.Value ? null : reader["ip_address"].ToString(),
                                    status      = reader["status"]      == DBNull.Value ? null : reader["status"].ToString(),
                                    Site_ID     = reader["Site_ID"].ToString(),
                                    Building_ID = reader["Building_ID"].ToString(),
                                    Floor_ID    = reader["Floor_ID"].ToString(),
                                    Rack_ID     = reader["Rack_ID"]     == DBNull.Value ? null : reader["Rack_ID"].ToString(),
                                    brand       = reader["brand"]       == DBNull.Value ? null : reader["brand"].ToString(),
                                    model       = reader["model"]       == DBNull.Value ? null : reader["model"].ToString(),
                                });
                            }
                        }
                    }
                }
            }
            catch (Exception) { return InternalServerError(new Exception("An internal error occurred")); }

            return Json(list);
        }
        #endregion
    }
}
