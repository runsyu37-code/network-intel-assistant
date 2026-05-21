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
    public class sitesController : ApiController
    {
        #region GET : sites
        [Route("api/Getsites")]
        [HttpGet]
        public IHttpActionResult Getsites()
        {
            List<sitesModel> ListRP = new List<sitesModel>();
            using (SqlConnection con = new SqlConnection(ConnectionDB.ConnectionStringCN))
            {
                con.Open();
                string sql = "SELECT [Site_ID],[name],[code],[location],[description],[created_at],[updated_at] FROM [dbo].[sites] WHERE 1=1";
                SqlCommand cmd = new SqlCommand(sql, con);
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
        [Route("api/Savesites")]
        [HttpPost]
        public IHttpActionResult Savesites([FromBody] List<sitesModel> modelList)
        {
            if (modelList == null || modelList.Count == 0)
                return BadRequest("à¹„à¸¡à¹ˆà¸¡à¸µà¸‚à¹‰à¸­à¸¡à¸¹à¸¥à¸—à¸µà¹ˆà¸ªà¹ˆà¸‡à¸¡à¸²");

            if (modelList.Any(x => string.IsNullOrWhiteSpace(x.Site_ID)))
                return BadRequest("Site_ID à¸«à¹‰à¸²à¸¡à¸§à¹ˆà¸²à¸‡");

            int insertCount = 0;
            try
            {
                using (var con = new SqlConnection(ConnectionDB.ConnectionStringCN))
                {
                    con.Open();
                    string insertSql = @"
                        INSERT INTO [dbo].[sites] ([Site_ID],[name],[code],[location],[description])
                        VALUES (@Site_ID,@name,@code,@location,@description);";

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
        [Route("api/Updatesites/{Site_ID}")]
        [HttpPost]
        public IHttpActionResult Updatesites(string Site_ID, [FromBody] sitesModel model)
        {
            if (model == null || string.IsNullOrWhiteSpace(model.Site_ID))
                return BadRequest("à¸«à¹‰à¸²à¸¡ Null");

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
            catch (Exception ex) { return InternalServerError(ex); }
        }
        #endregion

        #region Delete : sites
        [HttpPost]
        [Route("api/Deletesites/{Site_ID}")]
        public IHttpActionResult Deletesites(string Site_ID)
        {
            if (string.IsNullOrWhiteSpace(Site_ID))
                return BadRequest("Site_ID à¸«à¹‰à¸²à¸¡à¸§à¹ˆà¸²à¸‡");

            try
            {
                using (var con = new SqlConnection(ConnectionDB.ConnectionStringCN))
                {
                    con.Open();
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
            catch (Exception ex) { return InternalServerError(ex); }
        }
        #endregion
    }
}
