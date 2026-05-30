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
    public class sitesController : ApiController
    {
        #region GET : sites
        [Route("api/sites")]
        [HttpGet]
        public IHttpActionResult GetSites(string Site_ID = null)
        {
            List<sitesModel> ListRP = new List<sitesModel>();
            using (SqlConnection con = new SqlConnection(ConnectionDB.ConnectionStringCN))
            {
                con.Open();
                string sql = "SELECT [Site_ID],[name],[code],[location],[description],[topology_x],[topology_y],[created_at],[updated_at] FROM [dbo].[sites] WHERE 1=1";
                if (!string.IsNullOrWhiteSpace(Site_ID)) sql += " AND Site_ID = @Site_ID";
                SqlCommand cmd = new SqlCommand(sql, con);
                if (!string.IsNullOrWhiteSpace(Site_ID)) cmd.Parameters.AddWithValue("@Site_ID", Site_ID);
                using (var reader = cmd.ExecuteReader())
                {
                    while (reader.Read())
                    {
                        ListRP.Add(new sitesModel
                        {
                            Site_ID     = reader["Site_ID"].ToString(),
                            name        = reader["name"].ToString(),
                            code        = reader["code"]        == DBNull.Value ? null : reader["code"].ToString(),
                            location    = reader["location"]    == DBNull.Value ? null : reader["location"].ToString(),
                            description = reader["description"] == DBNull.Value ? null : reader["description"].ToString(),
                            topology_x  = reader["topology_x"] == DBNull.Value ? (double?)null : Convert.ToDouble(reader["topology_x"]),
                            topology_y  = reader["topology_y"] == DBNull.Value ? (double?)null : Convert.ToDouble(reader["topology_y"]),
                            created_at  = reader["created_at"].ToString(),
                            updated_at  = reader["updated_at"].ToString(),
                        });
                    }
                }
            }
            return Json(ListRP);
        }
        #endregion

        #region Save : sites
        [Route("api/sites")]
        [HttpPost]
        [RequireRole("admin")]
        public IHttpActionResult Savesites([FromBody] List<sitesModel> modelList)
        {
            if (modelList == null || modelList.Count == 0)
                return BadRequest("No data provided");

            if (modelList.Any(x => string.IsNullOrWhiteSpace(x.Site_ID)))
                return BadRequest("Site_ID is required");

            int insertCount = 0;
            try
            {
                using (var con = new SqlConnection(ConnectionDB.ConnectionStringCN))
                {
                    con.Open();
                    string insertSql = @"
                        INSERT INTO [dbo].[sites] ([Site_ID],[name],[code],[location],[description])
                        VALUES (@Site_ID,@name,@code,@location,@description);";

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

        private void AddParameters(SqlCommand cmd, sitesModel item)
        {
            cmd.Parameters.AddWithValue("@Site_ID",     string.IsNullOrWhiteSpace(item.Site_ID)     ? (object)DBNull.Value : item.Site_ID);
            cmd.Parameters.AddWithValue("@name",        string.IsNullOrWhiteSpace(item.name)        ? (object)DBNull.Value : item.name);
            cmd.Parameters.AddWithValue("@code",        string.IsNullOrWhiteSpace(item.code)        ? (object)DBNull.Value : item.code);
            cmd.Parameters.AddWithValue("@location",    string.IsNullOrWhiteSpace(item.location)    ? (object)DBNull.Value : item.location);
            cmd.Parameters.AddWithValue("@description", string.IsNullOrWhiteSpace(item.description) ? (object)DBNull.Value : item.description);
        }
        #endregion

        #region Update : sites
        [Route("api/sites/{Site_ID}")]
        [HttpPost]
        [RequireRole("admin")]
        public IHttpActionResult Updatesites(string Site_ID, [FromBody] sitesModel model)
        {
            if (model == null || string.IsNullOrWhiteSpace(model.Site_ID))
                return BadRequest("Value cannot be null");

            try
            {
                using (var con = new SqlConnection(ConnectionDB.ConnectionStringCN))
                {
                    con.Open();
                    string sql = @"
                        UPDATE [dbo].[sites]
                        SET name        = @name,
                            code        = @code,
                            location    = @location,
                            description = @description,
                            updated_at  = SYSUTCDATETIME()
                        WHERE Site_ID = @Site_ID;";

                    using (var cmd = new SqlCommand(sql, con))
                    {
                        cmd.Parameters.AddWithValue("@Site_ID",     model.Site_ID);
                        cmd.Parameters.AddWithValue("@name",        string.IsNullOrWhiteSpace(model.name)        ? (object)DBNull.Value : model.name);
                        cmd.Parameters.AddWithValue("@code",        string.IsNullOrWhiteSpace(model.code)        ? (object)DBNull.Value : model.code);
                        cmd.Parameters.AddWithValue("@location",    string.IsNullOrWhiteSpace(model.location)    ? (object)DBNull.Value : model.location);
                        cmd.Parameters.AddWithValue("@description", string.IsNullOrWhiteSpace(model.description) ? (object)DBNull.Value : model.description);

                        int rows = cmd.ExecuteNonQuery();
                        if (rows == 0) return NotFound();
                    }
                }
                return Ok(new { success = true, Site_ID });
            }
            catch (Exception) { return InternalServerError(new Exception("An internal error occurred")); }
        }
        #endregion

        #region PATCH : sites/{Site_ID}/position
        public class SitePositionRequest
        {
            public double? x { get; set; }
            public double? y { get; set; }
        }

        [HttpPatch]
        [Route("api/sites/{Site_ID}/position")]
        [RequireRole("admin")]
        public IHttpActionResult PatchSitePosition(string Site_ID, [FromBody] SitePositionRequest req)
        {
            if (req == null || !req.x.HasValue || !req.y.HasValue)
                return BadRequest("x and y are required");

            try
            {
                using (var con = new SqlConnection(ConnectionDB.ConnectionStringCN))
                {
                    con.Open();
                    using (var cmd = new SqlCommand(@"
                        UPDATE [dbo].[sites]
                        SET topology_x = @x, topology_y = @y, updated_at = SYSUTCDATETIME()
                        WHERE Site_ID = @Site_ID", con))
                    {
                        cmd.Parameters.AddWithValue("@x", req.x.Value);
                        cmd.Parameters.AddWithValue("@y", req.y.Value);
                        cmd.Parameters.AddWithValue("@Site_ID", Site_ID);
                        int rows = cmd.ExecuteNonQuery();
                        if (rows == 0) return NotFound();
                    }
                }
                return Ok(new { success = true, Site_ID, x = req.x, y = req.y });
            }
            catch (Exception) { return InternalServerError(new Exception("An internal error occurred")); }
        }
        #endregion

        #region Delete : sites
        [HttpPost]
        [Route("api/sites/delete/{Site_ID}")]
        [RequireRole("admin")]
        public IHttpActionResult Deletesites(string Site_ID)
        {
            if (string.IsNullOrWhiteSpace(Site_ID))
                return BadRequest("Site_ID is required");

            try
            {
                using (var con = new SqlConnection(ConnectionDB.ConnectionStringCN))
                {
                    con.Open();
                    string pre = @"
                        DELETE FROM [dbo].[poe_switches] WHERE Site_ID = @Site_ID;
                        DELETE FROM [dbo].[nvrs]         WHERE Site_ID = @Site_ID;";
                    using (var pre_cmd = new SqlCommand(pre, con))
                    {
                        pre_cmd.Parameters.AddWithValue("@Site_ID", Site_ID);
                        pre_cmd.ExecuteNonQuery();
                    }
                    string sql = @"DELETE FROM [dbo].[sites] WHERE Site_ID = @Site_ID;";
                    using (var cmd = new SqlCommand(sql, con))
                    {
                        cmd.Parameters.AddWithValue("@Site_ID", Site_ID);
                        int rows = cmd.ExecuteNonQuery();
                        if (rows == 0) return NotFound();
                        return Ok(new { success = true, deleted = rows, Site_ID });
                    }
                }
            }
            catch (Exception) { return InternalServerError(new Exception("An internal error occurred")); }
        }
        #endregion
    }
}

