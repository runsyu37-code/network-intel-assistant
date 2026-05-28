using BNO_Survei_MonitorAPI.ConnectDB;
using BNO_Survei_MonitorAPI.Filters;
using BNO_Survei_MonitorAPI.Constants;
using System;
using System.Collections.Generic;
using System.Data.SqlClient;
using System.Linq;
using System.Web.Http;

namespace BNO_Survei_MonitorAPI.Controllers
{
    public class hierarchyController : ApiController
    {
        // ---------------------------------------------------------------
        // GET /api/hierarchy/tree
        // Returns full Site → Building → Floor nested tree in one call.
        // Used by Topology page and sidebar initial load.
        // ---------------------------------------------------------------
        [HttpGet]
        [Route("api/hierarchy/tree")]
        public IHttpActionResult GetTree()
        {
            var sites = new List<SiteTreeDto>();
            var buildings = new List<BuildingTreeDto>();
            var floors = new List<FloorTreeDto>();

            using (var con = new SqlConnection(ConnectionDB.ConnectionStringCN))
            {
                con.Open();

                // 1. Sites with alert counts
                using (var cmd = new SqlCommand(@"
                    SELECT s.Site_ID, s.name, s.code, s.location,
                           ISNULL(d.cameras_offline,0) + ISNULL(d.nvrs_offline,0) + ISNULL(d.switches_offline,0) AS alert_count,
                           ISNULL(d.total_cameras,0) + ISNULL(d.total_nvrs,0) + ISNULL(d.total_switches,0) AS total_devices
                    FROM sites s
                    LEFT JOIN vw_dashboard_summary d ON d.Site_ID = s.Site_ID
                    ORDER BY s.name", con))
                using (var r = cmd.ExecuteReader())
                    while (r.Read())
                        sites.Add(new SiteTreeDto
                        {
                            siteId = r["Site_ID"].ToString(),
                            siteName = r["name"].ToString(),
                            siteCode = r["code"] == DBNull.Value ? null : r["code"].ToString(),
                            location = r["location"] == DBNull.Value ? null : r["location"].ToString(),
                            alertCount = Convert.ToInt32(r["alert_count"]),
                            totalDevices = Convert.ToInt32(r["total_devices"])
                        });

                // 2. All buildings
                using (var cmd = new SqlCommand(@"
                    SELECT b.Building_ID, b.Site_ID, b.name, b.code, b.floor_count,
                           (SELECT COUNT(*) FROM cameras WHERE Building_ID = b.Building_ID AND status IN ('offline','warning'))
                           + (SELECT COUNT(*) FROM nvrs WHERE Building_ID = b.Building_ID AND status IN ('offline','warning'))
                           + (SELECT COUNT(*) FROM poe_switches WHERE Building_ID = b.Building_ID AND status IN ('offline','warning'))
                           AS alert_count,
                           (SELECT COUNT(*) FROM cameras WHERE Building_ID = b.Building_ID) AS camera_count,
                           (SELECT COUNT(*) FROM nvrs WHERE Building_ID = b.Building_ID) AS nvr_count
                    FROM buildings b ORDER BY b.name", con))
                using (var r = cmd.ExecuteReader())
                    while (r.Read())
                        buildings.Add(new BuildingTreeDto
                        {
                            buildingId = r["Building_ID"].ToString(),
                            siteId = r["Site_ID"].ToString(),
                            buildingName = r["name"].ToString(),
                            buildingCode = r["code"] == DBNull.Value ? null : r["code"].ToString(),
                            floorCount = r["floor_count"] == DBNull.Value ? 0 : Convert.ToInt32(r["floor_count"]),
                            alertCount = Convert.ToInt32(r["alert_count"]),
                            cameraCount = Convert.ToInt32(r["camera_count"]),
                            nvrCount = Convert.ToInt32(r["nvr_count"])
                        });

                // 3. All floors with camera count and alert count
                using (var cmd = new SqlCommand(@"
                    SELECT f.Floor_ID, f.Building_ID, f.floor_number, f.name, f.main_function,
                           (SELECT COUNT(*) FROM cameras WHERE Floor_ID = f.Floor_ID) AS camera_count,
                           (SELECT COUNT(*) FROM cameras WHERE Floor_ID = f.Floor_ID AND status IN ('offline','warning')) AS alert_count
                    FROM floors f ORDER BY f.floor_number", con))
                using (var r = cmd.ExecuteReader())
                    while (r.Read())
                        floors.Add(new FloorTreeDto
                        {
                            floorId = r["Floor_ID"].ToString(),
                            buildingId = r["Building_ID"].ToString(),
                            floorNumber = r["floor_number"] == DBNull.Value ? 0 : Convert.ToInt32(r["floor_number"]),
                            floorName = r["name"] == DBNull.Value ? null : r["name"].ToString(),
                            mainFunction = r["main_function"] == DBNull.Value ? null : r["main_function"].ToString(),
                            cameraCount = Convert.ToInt32(r["camera_count"]),
                            alertCount = Convert.ToInt32(r["alert_count"])
                        });
            }

            // Nest in memory — no N+1
            var buildingsByFloor = floors.GroupBy(f => f.buildingId).ToDictionary(g => g.Key, g => g.ToList());
            var floorsByBuilding = buildings.Select(b =>
            {
                b.floors = buildingsByFloor.ContainsKey(b.buildingId) ? buildingsByFloor[b.buildingId] : new List<FloorTreeDto>();
                return b;
            }).GroupBy(b => b.siteId).ToDictionary(g => g.Key, g => g.ToList());

            foreach (var site in sites)
                site.buildings = floorsByBuilding.ContainsKey(site.siteId) ? floorsByBuilding[site.siteId] : new List<BuildingTreeDto>();

            return Json(sites);
        }

        // ---------------------------------------------------------------
        // GET /api/status/devices
        // Lightweight status snapshot — used for 30-second polling.
        // Returns only id, type, name, status, last_seen. Avoids full reload.
        // ---------------------------------------------------------------
        [HttpGet]
        [Route("api/status/devices")]
        public IHttpActionResult GetDeviceStatus()
        {
            var result = new List<DeviceStatusDto>();

            using (var con = new SqlConnection(ConnectionDB.ConnectionStringCN))
            {
                con.Open();
                using (var cmd = new SqlCommand($@"
                    SELECT CAST(id AS NVARCHAR(20)) AS device_id, '{DeviceTypes.Camera}' AS device_type, device_name, status, last_seen, Site_ID
                    FROM cameras
                    UNION ALL
                    SELECT NVR_ID, '{DeviceTypes.Nvr}', device_name, status, last_seen, Site_ID FROM nvrs
                    UNION ALL
                    SELECT SW_ID, '{DeviceTypes.PoeSwitch}', device_name, status, last_seen, Site_ID FROM poe_switches
                    ORDER BY status, device_name", con))
                using (var r = cmd.ExecuteReader())
                    while (r.Read())
                        result.Add(new DeviceStatusDto
                        {
                            id = r["device_id"].ToString(),
                            type = r["device_type"].ToString(),
                            name = r["device_name"].ToString(),
                            status = r["status"].ToString(),
                            lastSeen = r["last_seen"] == DBNull.Value ? null : r["last_seen"].ToString(),
                            siteId = r["Site_ID"].ToString()
                        });
            }

            return Json(result);
        }

        // ---------------------------------------------------------------
        // GET /api/{type}/{id}/breadcrumb
        // Returns ancestor chain for any entity. Used by Breadcrumb component.
        // type: cameras | nvrs | poe-switches | floors | rooms | racks | buildings | sites
        // ---------------------------------------------------------------
        [HttpGet]
        [Route("api/{type}/{id}/breadcrumb")]
        public IHttpActionResult GetBreadcrumb(string type, string id)
        {
            var crumbs = new List<BreadcrumbDto>();

            using (var con = new SqlConnection(ConnectionDB.ConnectionStringCN))
            {
                con.Open();
                switch (type.ToLower())
                {
                    case "cameras":
                        AddCameraBreadcrumb(con, id, crumbs);
                        break;
                    case "nvrs":
                        AddNvrBreadcrumb(con, id, crumbs);
                        break;
                    case "poe-switches":
                        AddSwitchBreadcrumb(con, id, crumbs);
                        break;
                    case "floors":
                        AddFloorBreadcrumb(con, id, crumbs);
                        break;
                    case "rooms":
                        AddRoomBreadcrumb(con, id, crumbs);
                        break;
                    case "racks":
                        AddRackBreadcrumb(con, id, crumbs);
                        break;
                    case "buildings":
                        AddBuildingBreadcrumb(con, id, crumbs);
                        break;
                    case "sites":
                        AddSiteBreadcrumb(con, id, crumbs);
                        break;
                    default:
                        return BadRequest($"Unknown type: {type}");
                }
            }

            if (crumbs.Count == 0) return NotFound();
            return Json(crumbs);
        }

        // ---------------------------------------------------------------
        // GET /api/dashboard/summary
        // Per-site aggregate stats from vw_dashboard_summary.
        // ---------------------------------------------------------------
        [HttpGet]
        [Route("api/dashboard/summary")]
        public IHttpActionResult GetDashboardSummary()
        {
            var result = new List<object>();
            using (var con = new SqlConnection(ConnectionDB.ConnectionStringCN))
            {
                con.Open();
                using (var cmd = new SqlCommand("SELECT * FROM vw_dashboard_summary", con))
                using (var r = cmd.ExecuteReader())
                    while (r.Read())
                        result.Add(new
                        {
                            siteId = r["Site_ID"].ToString(),
                            siteCode = r["site_code"].ToString(),
                            siteName = r["site_name"].ToString(),
                            totalCameras = Convert.ToInt32(r["total_cameras"]),
                            camerasOnline = Convert.ToInt32(r["cameras_online"]),
                            camerasOffline = Convert.ToInt32(r["cameras_offline"]),
                            camerasWarning = Convert.ToInt32(r["cameras_warning"]),
                            totalNvrs = Convert.ToInt32(r["total_nvrs"]),
                            nvrsOffline = Convert.ToInt32(r["nvrs_offline"]),
                            totalSwitches = Convert.ToInt32(r["total_switches"]),
                            switchesOffline = Convert.ToInt32(r["switches_offline"]),
                            totalBuildings = Convert.ToInt32(r["total_buildings"]),
                            totalFloors = Convert.ToInt32(r["total_floors"]),
                            totalRooms = Convert.ToInt32(r["total_rooms"]),
                            totalRacks = Convert.ToInt32(r["total_racks"])
                        });
            }
            return Json(result);
        }

        // ---- Breadcrumb helpers ----------------------------------------

        private void AddSiteBreadcrumb(SqlConnection con, string id, List<BreadcrumbDto> crumbs)
        {
            using (var cmd = new SqlCommand("SELECT Site_ID, name FROM sites WHERE Site_ID = @id", con))
            {
                cmd.Parameters.AddWithValue("@id", id);
                using (var r = cmd.ExecuteReader())
                    if (r.Read())
                        crumbs.Add(new BreadcrumbDto { type = "site", id = r["Site_ID"].ToString(), name = r["name"].ToString() });
            }
        }

        private void AddBuildingBreadcrumb(SqlConnection con, string id, List<BreadcrumbDto> crumbs)
        {
            using (var cmd = new SqlCommand(@"
                SELECT b.Building_ID, b.name AS bname, s.Site_ID, s.name AS sname
                FROM buildings b JOIN sites s ON s.Site_ID = b.Site_ID
                WHERE b.Building_ID = @id", con))
            {
                cmd.Parameters.AddWithValue("@id", id);
                using (var r = cmd.ExecuteReader())
                    if (r.Read())
                    {
                        crumbs.Add(new BreadcrumbDto { type = "site", id = r["Site_ID"].ToString(), name = r["sname"].ToString() });
                        crumbs.Add(new BreadcrumbDto { type = "building", id = r["Building_ID"].ToString(), name = r["bname"].ToString() });
                    }
            }
        }

        private void AddFloorBreadcrumb(SqlConnection con, string id, List<BreadcrumbDto> crumbs)
        {
            using (var cmd = new SqlCommand(@"
                SELECT f.Floor_ID, f.name AS fname, f.floor_number,
                       b.Building_ID, b.name AS bname, s.Site_ID, s.name AS sname
                FROM floors f JOIN buildings b ON b.Building_ID = f.Building_ID
                              JOIN sites s ON s.Site_ID = b.Site_ID
                WHERE f.Floor_ID = @id", con))
            {
                cmd.Parameters.AddWithValue("@id", id);
                using (var r = cmd.ExecuteReader())
                    if (r.Read())
                    {
                        crumbs.Add(new BreadcrumbDto { type = "site", id = r["Site_ID"].ToString(), name = r["sname"].ToString() });
                        crumbs.Add(new BreadcrumbDto { type = "building", id = r["Building_ID"].ToString(), name = r["bname"].ToString() });
                        crumbs.Add(new BreadcrumbDto { type = "floor", id = r["Floor_ID"].ToString(), name = r["fname"] == DBNull.Value ? $"Floor {r["floor_number"]}" : r["fname"].ToString() });
                    }
            }
        }

        private void AddRoomBreadcrumb(SqlConnection con, string id, List<BreadcrumbDto> crumbs)
        {
            using (var cmd = new SqlCommand(@"
                SELECT r.Room_ID, r.name AS rname,
                       f.Floor_ID, f.name AS fname, f.floor_number,
                       b.Building_ID, b.name AS bname, s.Site_ID, s.name AS sname
                FROM rooms r JOIN floors f ON f.Floor_ID = r.Floor_ID
                             JOIN buildings b ON b.Building_ID = f.Building_ID
                             JOIN sites s ON s.Site_ID = b.Site_ID
                WHERE r.Room_ID = @id", con))
            {
                cmd.Parameters.AddWithValue("@id", id);
                using (var r = cmd.ExecuteReader())
                    if (r.Read())
                    {
                        crumbs.Add(new BreadcrumbDto { type = "site", id = r["Site_ID"].ToString(), name = r["sname"].ToString() });
                        crumbs.Add(new BreadcrumbDto { type = "building", id = r["Building_ID"].ToString(), name = r["bname"].ToString() });
                        crumbs.Add(new BreadcrumbDto { type = "floor", id = r["Floor_ID"].ToString(), name = r["fname"] == DBNull.Value ? $"Floor {r["floor_number"]}" : r["fname"].ToString() });
                        crumbs.Add(new BreadcrumbDto { type = "room", id = r["Room_ID"].ToString(), name = r["rname"].ToString() });
                    }
            }
        }

        private void AddRackBreadcrumb(SqlConnection con, string id, List<BreadcrumbDto> crumbs)
        {
            using (var cmd = new SqlCommand(@"
                SELECT rk.Rack_ID, rk.name AS rkname,
                       r.Room_ID, r.name AS rname,
                       f.Floor_ID, f.name AS fname, f.floor_number,
                       b.Building_ID, b.name AS bname, s.Site_ID, s.name AS sname
                FROM racks rk JOIN rooms r ON r.Room_ID = rk.Room_ID
                              JOIN floors f ON f.Floor_ID = r.Floor_ID
                              JOIN buildings b ON b.Building_ID = f.Building_ID
                              JOIN sites s ON s.Site_ID = b.Site_ID
                WHERE rk.Rack_ID = @id", con))
            {
                cmd.Parameters.AddWithValue("@id", id);
                using (var r = cmd.ExecuteReader())
                    if (r.Read())
                    {
                        crumbs.Add(new BreadcrumbDto { type = "site", id = r["Site_ID"].ToString(), name = r["sname"].ToString() });
                        crumbs.Add(new BreadcrumbDto { type = "building", id = r["Building_ID"].ToString(), name = r["bname"].ToString() });
                        crumbs.Add(new BreadcrumbDto { type = "floor", id = r["Floor_ID"].ToString(), name = r["fname"] == DBNull.Value ? $"Floor {r["floor_number"]}" : r["fname"].ToString() });
                        crumbs.Add(new BreadcrumbDto { type = "room", id = r["Room_ID"].ToString(), name = r["rname"].ToString() });
                        crumbs.Add(new BreadcrumbDto { type = "rack", id = r["Rack_ID"].ToString(), name = r["rkname"].ToString() });
                    }
            }
        }

        private void AddCameraBreadcrumb(SqlConnection con, string id, List<BreadcrumbDto> crumbs)
        {
            using (var cmd = new SqlCommand(@"
                SELECT camera_id, camera_name, Site_ID, site_name, Building_ID, building_name,
                       Floor_ID, floor_number, floor_name
                FROM vw_camera_full_path WHERE camera_id = @id", con))
            {
                cmd.Parameters.AddWithValue("@id", id);
                using (var r = cmd.ExecuteReader())
                    if (r.Read())
                    {
                        crumbs.Add(new BreadcrumbDto { type = "site", id = r["Site_ID"].ToString(), name = r["site_name"].ToString() });
                        crumbs.Add(new BreadcrumbDto { type = "building", id = r["Building_ID"].ToString(), name = r["building_name"].ToString() });
                        crumbs.Add(new BreadcrumbDto { type = "floor", id = r["Floor_ID"].ToString(), name = r["floor_name"] == DBNull.Value ? $"Floor {r["floor_number"]}" : r["floor_name"].ToString() });
                        crumbs.Add(new BreadcrumbDto { type = "camera", id = r["camera_id"].ToString(), name = r["camera_name"].ToString() });
                    }
            }
        }

        private void AddNvrBreadcrumb(SqlConnection con, string id, List<BreadcrumbDto> crumbs)
        {
            using (var cmd = new SqlCommand(@"
                SELECT NVR_ID, nvr_name, Site_ID, site_name, Building_ID, building_name,
                       Floor_ID, floor_number, floor_name, Room_ID, room_name, Rack_ID, rack_name
                FROM vw_nvr_full_path WHERE NVR_ID = @id", con))
            {
                cmd.Parameters.AddWithValue("@id", id);
                using (var r = cmd.ExecuteReader())
                    if (r.Read())
                    {
                        crumbs.Add(new BreadcrumbDto { type = "site", id = r["Site_ID"].ToString(), name = r["site_name"].ToString() });
                        crumbs.Add(new BreadcrumbDto { type = "building", id = r["Building_ID"].ToString(), name = r["building_name"].ToString() });
                        crumbs.Add(new BreadcrumbDto { type = "floor", id = r["Floor_ID"].ToString(), name = r["floor_name"] == DBNull.Value ? $"Floor {r["floor_number"]}" : r["floor_name"].ToString() });
                        crumbs.Add(new BreadcrumbDto { type = "room", id = r["Room_ID"].ToString(), name = r["room_name"].ToString() });
                        crumbs.Add(new BreadcrumbDto { type = "rack", id = r["Rack_ID"].ToString(), name = r["rack_name"].ToString() });
                        crumbs.Add(new BreadcrumbDto { type = "nvr", id = r["NVR_ID"].ToString(), name = r["nvr_name"].ToString() });
                    }
            }
        }

        private void AddSwitchBreadcrumb(SqlConnection con, string id, List<BreadcrumbDto> crumbs)
        {
            using (var cmd = new SqlCommand(@"
                SELECT SW_ID, switch_name, Site_ID, site_name, Building_ID, building_name,
                       Floor_ID, floor_number, floor_name, Room_ID, room_name, Rack_ID, rack_name
                FROM vw_switch_full_path WHERE SW_ID = @id", con))
            {
                cmd.Parameters.AddWithValue("@id", id);
                using (var r = cmd.ExecuteReader())
                    if (r.Read())
                    {
                        crumbs.Add(new BreadcrumbDto { type = "site", id = r["Site_ID"].ToString(), name = r["site_name"].ToString() });
                        crumbs.Add(new BreadcrumbDto { type = "building", id = r["Building_ID"].ToString(), name = r["building_name"].ToString() });
                        crumbs.Add(new BreadcrumbDto { type = "floor", id = r["Floor_ID"].ToString(), name = r["floor_name"] == DBNull.Value ? $"Floor {r["floor_number"]}" : r["floor_name"].ToString() });
                        crumbs.Add(new BreadcrumbDto { type = "room", id = r["Room_ID"].ToString(), name = r["room_name"].ToString() });
                        crumbs.Add(new BreadcrumbDto { type = "rack", id = r["Rack_ID"].ToString(), name = r["rack_name"].ToString() });
                        crumbs.Add(new BreadcrumbDto { type = "poe-switch", id = r["SW_ID"].ToString(), name = r["switch_name"].ToString() });
                    }
            }
        }

        // ---- DTOs -------------------------------------------------------

        private class SiteTreeDto
        {
            public string siteId { get; set; }
            public string siteName { get; set; }
            public string siteCode { get; set; }
            public string location { get; set; }
            public int alertCount { get; set; }
            public int totalDevices { get; set; }
            public List<BuildingTreeDto> buildings { get; set; } = new List<BuildingTreeDto>();
        }

        private class BuildingTreeDto
        {
            public string buildingId { get; set; }
            public string siteId { get; set; }
            public string buildingName { get; set; }
            public string buildingCode { get; set; }
            public int floorCount { get; set; }
            public int alertCount { get; set; }
            public int cameraCount { get; set; }
            public int nvrCount { get; set; }
            public List<FloorTreeDto> floors { get; set; } = new List<FloorTreeDto>();
        }

        private class FloorTreeDto
        {
            public string floorId { get; set; }
            public string buildingId { get; set; }
            public int floorNumber { get; set; }
            public string floorName { get; set; }
            public string mainFunction { get; set; }
            public int cameraCount { get; set; }
            public int alertCount { get; set; }
        }

        private class DeviceStatusDto
        {
            public string id { get; set; }
            public string type { get; set; }
            public string name { get; set; }
            public string status { get; set; }
            public string lastSeen { get; set; }
            public string siteId { get; set; }
        }

        private class BreadcrumbDto
        {
            public string type { get; set; }
            public string id { get; set; }
            public string name { get; set; }
        }
    }
}
