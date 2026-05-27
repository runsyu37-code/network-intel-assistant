using BNO_Survei_MonitorAPI.ConnectDB;
using System;
using System.Collections.Generic;
using System.Data.SqlClient;
using System.Web.Http;
using RouteAttribute = System.Web.Http.RouteAttribute;
using HttpGetAttribute = System.Web.Http.HttpGetAttribute;

namespace BNO_Survei_MonitorAPI.Controllers
{
    public class dashboardController : ApiController
    {
        #region GET : dashboard/summary
        [Route("api/dashboard/summary")]
        [HttpGet]
        public IHttpActionResult GetSummary()
        {
            if (!RequestContext.Principal.IsInRole("admin"))
                return StatusCode(System.Net.HttpStatusCode.Forbidden);

            var list = new List<object>();
            try
            {
                using (var con = new SqlConnection(ConnectionDB.ConnectionStringCN))
                {
                    con.Open();
                    string sql = @"
                        SELECT
                            s.Site_ID                                                        AS siteId,
                            s.name                                                           AS siteName,
                            s.code                                                           AS siteCode,
                            COUNT(DISTINCT c.id)                                             AS totalCameras,
                            SUM(CASE WHEN c.status = 'online'  THEN 1 ELSE 0 END)           AS camerasOnline,
                            SUM(CASE WHEN c.status = 'offline' THEN 1 ELSE 0 END)           AS camerasOffline,
                            SUM(CASE WHEN c.status = 'warning' THEN 1 ELSE 0 END)           AS camerasWarning,
                            COUNT(DISTINCT n.NVR_ID)                                         AS totalNvrs,
                            SUM(CASE WHEN n.status = 'offline' THEN 1 ELSE 0 END)           AS nvrsOffline,
                            COUNT(DISTINCT sw.SW_ID)                                         AS totalSwitches,
                            SUM(CASE WHEN sw.status = 'offline' THEN 1 ELSE 0 END)          AS switchesOffline,
                            COUNT(DISTINCT b.Building_ID)                                    AS totalBuildings,
                            COUNT(DISTINCT f.Floor_ID)                                       AS totalFloors
                        FROM [dbo].[sites] s
                        LEFT JOIN [dbo].[cameras]      c  ON c.Site_ID     = s.Site_ID
                        LEFT JOIN [dbo].[nvrs]         n  ON n.Site_ID     = s.Site_ID
                        LEFT JOIN [dbo].[poe_switches] sw ON sw.Site_ID    = s.Site_ID
                        LEFT JOIN [dbo].[buildings]    b  ON b.Site_ID     = s.Site_ID
                        LEFT JOIN [dbo].[floors]       f  ON f.Building_ID = b.Building_ID
                        GROUP BY s.Site_ID, s.name, s.code
                        ORDER BY s.Site_ID";

                    using (var cmd = new SqlCommand(sql, con))
                    using (var r = cmd.ExecuteReader())
                    {
                        while (r.Read())
                        {
                            list.Add(new
                            {
                                siteId          = r["siteId"]          == DBNull.Value ? null : r["siteId"].ToString(),
                                siteName        = r["siteName"]        == DBNull.Value ? null : r["siteName"].ToString(),
                                siteCode        = r["siteCode"]        == DBNull.Value ? null : r["siteCode"].ToString(),
                                totalCameras    = r["totalCameras"]    == DBNull.Value ? 0 : Convert.ToInt32(r["totalCameras"]),
                                camerasOnline   = r["camerasOnline"]   == DBNull.Value ? 0 : Convert.ToInt32(r["camerasOnline"]),
                                camerasOffline  = r["camerasOffline"]  == DBNull.Value ? 0 : Convert.ToInt32(r["camerasOffline"]),
                                camerasWarning  = r["camerasWarning"]  == DBNull.Value ? 0 : Convert.ToInt32(r["camerasWarning"]),
                                totalNvrs       = r["totalNvrs"]       == DBNull.Value ? 0 : Convert.ToInt32(r["totalNvrs"]),
                                nvrsOffline     = r["nvrsOffline"]     == DBNull.Value ? 0 : Convert.ToInt32(r["nvrsOffline"]),
                                totalSwitches   = r["totalSwitches"]   == DBNull.Value ? 0 : Convert.ToInt32(r["totalSwitches"]),
                                switchesOffline = r["switchesOffline"] == DBNull.Value ? 0 : Convert.ToInt32(r["switchesOffline"]),
                                totalBuildings  = r["totalBuildings"]  == DBNull.Value ? 0 : Convert.ToInt32(r["totalBuildings"]),
                                totalFloors     = r["totalFloors"]     == DBNull.Value ? 0 : Convert.ToInt32(r["totalFloors"]),
                            });
                        }
                    }
                }
                return Ok(list);
            }
            catch (Exception) { return InternalServerError(new Exception("An internal error occurred")); }
        }
        #endregion
    }
}
