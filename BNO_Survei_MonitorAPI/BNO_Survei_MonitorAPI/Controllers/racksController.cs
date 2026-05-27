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
        #region GET : racks
        [Route("api/racks")]
        [HttpGet]
        [RequireRole("admin", "user")]
        public IHttpActionResult GetRacks(string Room_ID = null, string Rack_ID = null)
        {
            List<racksModel> ListRP = new List<racksModel>();
            using (SqlConnection con = new SqlConnection(ConnectionDB.ConnectionStringCN))
            {
                con.Open();
                string sql = "SELECT [Rack_ID],[Site_ID],[Building_ID],[Floor_ID],[Room_ID],[name],[total_units],[units_per_u],[brand],[model],[max_power_w],[image_data],[image_type],[note],[created_at],[updated_at] FROM [dbo].[racks] WHERE 1=1";
                if (!string.IsNullOrWhiteSpace(Room_ID)) sql += " AND Room_ID = @Room_ID";
                if (!string.IsNullOrWhiteSpace(Rack_ID)) sql += " AND Rack_ID = @Rack_ID";
                SqlCommand cmd = new SqlCommand(sql, con);
                if (!string.IsNullOrWhiteSpace(Room_ID)) cmd.Parameters.AddWithValue("@Room_ID", Room_ID);
                if (!string.IsNullOrWhiteSpace(Rack_ID)) cmd.Parameters.AddWithValue("@Rack_ID", Rack_ID);
                using (var reader = cmd.ExecuteReader())
                {
                    while (reader.Read())
                    {
                        ListRP.Add(new racksModel
                        {
                            Rack_ID     = reader["Rack_ID"].ToString(),
                            Site_ID     = reader["Site_ID"].ToString(),
                            Building_ID = reader["Building_ID"].ToString(),
                            Floor_ID    = reader["Floor_ID"].ToString(),
                            Room_ID     = reader["Room_ID"].ToString(),
                            name        = reader["name"].ToString(),
                            total_units = Convert.ToInt32(reader["total_units"]),
                            units_per_u = Convert.ToInt32(reader["units_per_u"]),
                            brand       = reader["brand"]       == DBNull.Value ? null : reader["brand"].ToString(),
                            model       = reader["model"]       == DBNull.Value ? null : reader["model"].ToString(),
                            max_power_w = reader["max_power_w"] == DBNull.Value ? (int?)null : Convert.ToInt32(reader["max_power_w"]),
                            image_data  = reader["image_data"]  == DBNull.Value ? null : reader["image_data"].ToString(),
                            image_type  = reader["image_type"]  == DBNull.Value ? null : reader["image_type"].ToString(),
                            note        = reader["note"]        == DBNull.Value ? null : reader["note"].ToString(),
                            created_at  = reader["created_at"].ToString(),
                            updated_at  = reader["updated_at"].ToString(),
                        });
                    }
                }
            }
            return Json(ListRP);
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
            catch (Exception) { return InternalServerError(new Exception("An internal error occurred")); }
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

