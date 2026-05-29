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
    public class buildingsController : ApiController
    {
        #region GET : buildings
        [Route("api/buildings")]
        [HttpGet]
        public IHttpActionResult GetBuildings(string Site_ID = null, string Building_ID = null)
        {
            List<buildingsModel> ListRP = new List<buildingsModel>();
            using (SqlConnection con = new SqlConnection(ConnectionDB.ConnectionStringCN))
            {
                con.Open();
                string sql = "SELECT [Building_ID],[Site_ID],[name],[code],[floor_count],[description],[image_data],[image_type],[note],[created_at],[updated_at],[lat],[lng] FROM [dbo].[buildings] WHERE 1=1";
                if (!string.IsNullOrWhiteSpace(Site_ID))     sql += " AND Site_ID = @Site_ID";
                if (!string.IsNullOrWhiteSpace(Building_ID)) sql += " AND Building_ID = @Building_ID";
                SqlCommand cmd = new SqlCommand(sql, con);
                if (!string.IsNullOrWhiteSpace(Site_ID))     cmd.Parameters.AddWithValue("@Site_ID", Site_ID);
                if (!string.IsNullOrWhiteSpace(Building_ID)) cmd.Parameters.AddWithValue("@Building_ID", Building_ID);
                using (var reader = cmd.ExecuteReader())
                {
                    while (reader.Read())
                    {
                        ListRP.Add(new buildingsModel
                        {
                            Building_ID = reader["Building_ID"].ToString(),
                            Site_ID     = reader["Site_ID"].ToString(),
                            name        = reader["name"].ToString(),
                            code        = reader["code"] == DBNull.Value ? null : reader["code"].ToString(),
                            floor_count = reader["floor_count"] == DBNull.Value ? (int?)null : Convert.ToInt32(reader["floor_count"]),
                            description = reader["description"] == DBNull.Value ? null : reader["description"].ToString(),
                            image_data  = reader["image_data"] == DBNull.Value ? null : reader["image_data"].ToString(),
                            image_type  = reader["image_type"] == DBNull.Value ? null : reader["image_type"].ToString(),
                            note        = reader["note"] == DBNull.Value ? null : reader["note"].ToString(),
                            created_at  = reader["created_at"].ToString(),
                            updated_at  = reader["updated_at"].ToString(),
                            lat         = reader["lat"]  == DBNull.Value ? (decimal?)null : Convert.ToDecimal(reader["lat"]),
                            lng         = reader["lng"]  == DBNull.Value ? (decimal?)null : Convert.ToDecimal(reader["lng"]),
                        });
                    }
                }
            }
            return Json(ListRP);
        }
        #endregion

        #region Save : buildings
        [Route("api/buildings")]
        [HttpPost]
        [RequireRole("admin")]
        public IHttpActionResult Savebuildings([FromBody] List<buildingsModel> modelList)
        {
            if (modelList == null || modelList.Count == 0)
                return BadRequest("No data provided");

            if (modelList.Any(x => string.IsNullOrWhiteSpace(x.Building_ID)))
                return BadRequest("Building_ID is required");

            int insertCount = 0;
            try
            {
                using (var con = new SqlConnection(ConnectionDB.ConnectionStringCN))
                {
                    con.Open();
                    string insertSql = @"
                        INSERT INTO [dbo].[buildings] ([Building_ID],[Site_ID],[name],[code],[floor_count],[description],[image_data],[image_type],[note])
                        VALUES (@Building_ID,@Site_ID,@name,@code,@floor_count,@description,@image_data,@image_type,@note);";

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

        private void AddParameters(SqlCommand cmd, buildingsModel item)
        {
            cmd.Parameters.AddWithValue("@Building_ID", string.IsNullOrWhiteSpace(item.Building_ID) ? (object)DBNull.Value : item.Building_ID);
            cmd.Parameters.AddWithValue("@Site_ID",     string.IsNullOrWhiteSpace(item.Site_ID)     ? (object)DBNull.Value : item.Site_ID);
            cmd.Parameters.AddWithValue("@name",        string.IsNullOrWhiteSpace(item.name)        ? (object)DBNull.Value : item.name);
            cmd.Parameters.AddWithValue("@code",        string.IsNullOrWhiteSpace(item.code)        ? (object)DBNull.Value : item.code);
            cmd.Parameters.AddWithValue("@floor_count", item.floor_count.HasValue ? (object)item.floor_count.Value : DBNull.Value);
            cmd.Parameters.AddWithValue("@description", string.IsNullOrWhiteSpace(item.description) ? (object)DBNull.Value : item.description);
            cmd.Parameters.AddWithValue("@image_data",  string.IsNullOrWhiteSpace(item.image_data)  ? (object)DBNull.Value : item.image_data);
            cmd.Parameters.AddWithValue("@image_type",  string.IsNullOrWhiteSpace(item.image_type)  ? (object)DBNull.Value : item.image_type);
            cmd.Parameters.AddWithValue("@note",        string.IsNullOrWhiteSpace(item.note)        ? (object)DBNull.Value : item.note);
        }
        #endregion

        #region Update : buildings
        [Route("api/buildings/{Building_ID}")]
        [HttpPost]
        [RequireRole("admin")]
        public IHttpActionResult Updatebuildings(string Building_ID, [FromBody] buildingsModel model)
        {
            if (model == null || string.IsNullOrWhiteSpace(model.Building_ID))
                return BadRequest("Value cannot be null");

            try
            {
                using (var con = new SqlConnection(ConnectionDB.ConnectionStringCN))
                {
                    con.Open();
                    string sql = @"
                        UPDATE [dbo].[buildings]
                        SET Site_ID     = @Site_ID,
                            name        = @name,
                            code        = @code,
                            floor_count = @floor_count,
                            description = @description,
                            image_data  = @image_data,
                            image_type  = @image_type,
                            note        = @note,
                            updated_at  = SYSUTCDATETIME()
                        WHERE Building_ID = @Building_ID;";

                    using (var cmd = new SqlCommand(sql, con))
                    {
                        cmd.Parameters.AddWithValue("@Building_ID", model.Building_ID);
                        cmd.Parameters.AddWithValue("@Site_ID",     string.IsNullOrWhiteSpace(model.Site_ID)     ? (object)DBNull.Value : model.Site_ID);
                        cmd.Parameters.AddWithValue("@name",        string.IsNullOrWhiteSpace(model.name)        ? (object)DBNull.Value : model.name);
                        cmd.Parameters.AddWithValue("@code",        string.IsNullOrWhiteSpace(model.code)        ? (object)DBNull.Value : model.code);
                        cmd.Parameters.AddWithValue("@floor_count", model.floor_count.HasValue ? (object)model.floor_count.Value : DBNull.Value);
                        cmd.Parameters.AddWithValue("@description", string.IsNullOrWhiteSpace(model.description) ? (object)DBNull.Value : model.description);
                        cmd.Parameters.AddWithValue("@image_data",  string.IsNullOrWhiteSpace(model.image_data)  ? (object)DBNull.Value : model.image_data);
                        cmd.Parameters.AddWithValue("@image_type",  string.IsNullOrWhiteSpace(model.image_type)  ? (object)DBNull.Value : model.image_type);
                        cmd.Parameters.AddWithValue("@note",        string.IsNullOrWhiteSpace(model.note)        ? (object)DBNull.Value : model.note);

                        int rows = cmd.ExecuteNonQuery();
                        if (rows == 0) return NotFound();
                    }
                }
                return Ok(new { success = true, Building_ID });
            }
            catch (Exception) { return InternalServerError(new Exception("An internal error occurred")); }
        }
        #endregion

        #region Delete : buildings
        [HttpPost]
        [Route("api/buildings/delete/{Building_ID}")]
        [RequireRole("admin")]
        public IHttpActionResult Deletebuildings(string Building_ID)
        {
            if (string.IsNullOrWhiteSpace(Building_ID))
                return BadRequest("Building_ID is required");

            try
            {
                using (var con = new SqlConnection(ConnectionDB.ConnectionStringCN))
                {
                    con.Open();
                    string pre = @"
                        DELETE FROM [dbo].[poe_switches] WHERE Building_ID = @Building_ID;
                        DELETE FROM [dbo].[nvrs]         WHERE Building_ID = @Building_ID;";
                    using (var pre_cmd = new SqlCommand(pre, con))
                    {
                        pre_cmd.Parameters.AddWithValue("@Building_ID", Building_ID);
                        pre_cmd.ExecuteNonQuery();
                    }
                    string sql = @"DELETE FROM [dbo].[buildings] WHERE Building_ID = @Building_ID;";
                    using (var cmd = new SqlCommand(sql, con))
                    {
                        cmd.Parameters.AddWithValue("@Building_ID", Building_ID);
                        int rows = cmd.ExecuteNonQuery();
                        if (rows == 0) return NotFound();
                        return Ok(new { success = true, deleted = rows, Building_ID });
                    }
                }
            }
            catch (Exception) { return InternalServerError(new Exception("An internal error occurred")); }
        }
        #endregion
    }
}

