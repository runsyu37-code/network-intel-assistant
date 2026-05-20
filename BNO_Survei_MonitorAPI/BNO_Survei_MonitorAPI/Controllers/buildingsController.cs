using BNO_Survei_MonitorAPI.ConnectDB;
using System;
using System.Collections.Generic;
using System.Data.SqlClient;
using System.Linq;
using System.Web.Http;
using TestAPBNO_Survei_MonitorAPI.Models;
using HttpGetAttribute = System.Web.Http.HttpGetAttribute;
using HttpPostAttribute = System.Web.Http.HttpPostAttribute;
using RouteAttribute = System.Web.Http.RouteAttribute;

namespace BNO_Survei_MonitorAPI.Controllers
{
    public class buildingsController : ApiController
    {
        #region GET : buildings
        [Route("api/Getbuildings")]
        [HttpGet]
        public IHttpActionResult Getbuildings()
        {
            List<buildingsModel> ListRP = new List<buildingsModel>();
            using (SqlConnection con = new SqlConnection(ConnectionDB.ConnectionStringCN))
            {
                con.Open();
                string sql = "SELECT [Building_ID],[Site_ID],[name],[code],[floor_count],[description],[image_data],[image_type],[note],[created_at],[updated_at] FROM [dbo].[buildings] WHERE 1=1";
                SqlCommand cmd = new SqlCommand(sql, con);
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
                        });
                    }
                }
            }
            return Json(ListRP);
        }
        #endregion

        #region Save : buildings
        [Route("api/Savebuildings")]
        [HttpPost]
        public IHttpActionResult Savebuildings([FromBody] List<buildingsModel> modelList)
        {
            if (modelList == null || modelList.Count == 0)
                return BadRequest("ไม่มีข้อมูลที่ส่งมา");

            if (modelList.Any(x => string.IsNullOrWhiteSpace(x.Building_ID)))
                return BadRequest("Building_ID ห้ามว่าง");

            int insertCount = 0;
            try
            {
                using (var con = new SqlConnection(ConnectionDB.ConnectionStringCN))
                {
                    con.Open();
                    string insertSql = @"
                        INSERT INTO [dbo].[buildings] ([Building_ID],[Site_ID],[name],[code],[floor_count],[description],[image_data],[image_type],[note])
                        VALUES (@Building_ID,@Site_ID,@name,@code,@floor_count,@description,@image_data,@image_type,@note);";

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
                return Ok(new { success = true, inserted = insertCount, message = $"เพิ่มข้อมูลใหม่สำเร็จ {insertCount} records" });
            }
            catch (SqlException ex) { return InternalServerError(ex); }
            catch (Exception ex)    { return InternalServerError(ex); }
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
        [Route("api/Updatebuildings/{Building_ID}")]
        [HttpPost]
        public IHttpActionResult Updatebuildings(string Building_ID, [FromBody] buildingsModel model)
        {
            if (model == null || string.IsNullOrWhiteSpace(model.Building_ID))
                return BadRequest("ห้าม Null");

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
            catch (Exception ex) { return InternalServerError(ex); }
        }
        #endregion

        #region Delete : buildings
        [HttpPost]
        [Route("api/Deletebuildings/{Building_ID}")]
        public IHttpActionResult Deletebuildings(string Building_ID)
        {
            if (string.IsNullOrWhiteSpace(Building_ID))
                return BadRequest("Building_ID ห้ามว่าง");

            try
            {
                using (var con = new SqlConnection(ConnectionDB.ConnectionStringCN))
                {
                    con.Open();
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
            catch (Exception ex) { return InternalServerError(ex); }
        }
        #endregion
    }
}
