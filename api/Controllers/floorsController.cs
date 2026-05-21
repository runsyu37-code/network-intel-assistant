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
    public class floorsController : ApiController
    {
        #region GET : floors
        [Route("api/Getfloors")]
        [HttpGet]
        public IHttpActionResult Getfloors()
        {
            List<floorsModel> ListRP = new List<floorsModel>();
            using (SqlConnection con = new SqlConnection(ConnectionDB.ConnectionStringCN))
            {
                con.Open();
                string sql = "SELECT [Floor_ID],[Site_ID],[Building_ID],[floor_number],[name],[function],[has_cctv],[image_data],[image_type],[note],[created_at],[updated_at] FROM [dbo].[floors] WHERE 1=1";
                SqlCommand cmd = new SqlCommand(sql, con);
                using (var reader = cmd.ExecuteReader())
                {
                    while (reader.Read())
                    {
                        ListRP.Add(new floorsModel
                        {
                            Floor_ID     = reader["Floor_ID"].ToString(),
                            Site_ID      = reader["Site_ID"].ToString(),
                            Building_ID  = reader["Building_ID"].ToString(),
                            floor_number = reader["floor_number"] == DBNull.Value ? (int?)null : Convert.ToInt32(reader["floor_number"]),
                            name         = reader["name"] == DBNull.Value ? null : reader["name"].ToString(),
                            function     = reader["function"] == DBNull.Value ? null : reader["function"].ToString(),
                            has_cctv     = reader["has_cctv"] == DBNull.Value ? (bool?)null : Convert.ToBoolean(reader["has_cctv"]),
                            image_data   = reader["image_data"] == DBNull.Value ? null : reader["image_data"].ToString(),
                            image_type   = reader["image_type"] == DBNull.Value ? null : reader["image_type"].ToString(),
                            note         = reader["note"] == DBNull.Value ? null : reader["note"].ToString(),
                            created_at   = reader["created_at"].ToString(),
                            updated_at   = reader["updated_at"].ToString(),
                        });
                    }
                }
            }
            return Json(ListRP);
        }
        #endregion

        #region Save : floors
        [Route("api/Savefloors")]
        [HttpPost]
        public IHttpActionResult Savefloors([FromBody] List<floorsModel> modelList)
        {
            if (modelList == null || modelList.Count == 0)
                return BadRequest("ไม่มีข้อมูลที่ส่งมา");

            if (modelList.Any(x => string.IsNullOrWhiteSpace(x.Floor_ID)))
                return BadRequest("Floor_ID ห้ามว่าง");

            int insertCount = 0;
            try
            {
                using (var con = new SqlConnection(ConnectionDB.ConnectionStringCN))
                {
                    con.Open();
                    string insertSql = @"
                        MERGE INTO [dbo].[floors] AS T
                        USING (SELECT @Floor_ID AS Floor_ID) AS S ON T.Floor_ID = S.Floor_ID
                        WHEN MATCHED THEN
                            UPDATE SET Site_ID=@Site_ID, Building_ID=@Building_ID, floor_number=@floor_number, name=@name, [function]=@function, has_cctv=@has_cctv, image_data=@image_data, image_type=@image_type, note=@note, updated_at=SYSUTCDATETIME()
                        WHEN NOT MATCHED THEN
                            INSERT ([Floor_ID],[Site_ID],[Building_ID],[floor_number],[name],[function],[has_cctv],[image_data],[image_type],[note])
                            VALUES (@Floor_ID,@Site_ID,@Building_ID,@floor_number,@name,@function,@has_cctv,@image_data,@image_type,@note);";

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
                return Ok(new { success = true, saved = insertCount, message = $"บันทึกข้อมูลสำเร็จ {insertCount} records" });
            }
            catch (SqlException ex) { return InternalServerError(ex); }
            catch (Exception ex)    { return InternalServerError(ex); }
        }

        private void AddParameters(SqlCommand cmd, floorsModel item)
        {
            cmd.Parameters.AddWithValue("@Floor_ID",     string.IsNullOrWhiteSpace(item.Floor_ID)    ? (object)DBNull.Value : item.Floor_ID);
            cmd.Parameters.AddWithValue("@Site_ID",      string.IsNullOrWhiteSpace(item.Site_ID)     ? (object)DBNull.Value : item.Site_ID);
            cmd.Parameters.AddWithValue("@Building_ID",  string.IsNullOrWhiteSpace(item.Building_ID) ? (object)DBNull.Value : item.Building_ID);
            cmd.Parameters.AddWithValue("@floor_number", item.floor_number.HasValue ? (object)item.floor_number.Value : DBNull.Value);
            cmd.Parameters.AddWithValue("@name",         string.IsNullOrWhiteSpace(item.name)        ? (object)DBNull.Value : item.name);
            cmd.Parameters.AddWithValue("@function",     string.IsNullOrWhiteSpace(item.function)    ? (object)DBNull.Value : item.function);
            cmd.Parameters.AddWithValue("@has_cctv",     item.has_cctv.HasValue ? (object)item.has_cctv.Value : DBNull.Value);
            cmd.Parameters.AddWithValue("@image_data",   string.IsNullOrWhiteSpace(item.image_data)  ? (object)DBNull.Value : item.image_data);
            cmd.Parameters.AddWithValue("@image_type",   string.IsNullOrWhiteSpace(item.image_type)  ? (object)DBNull.Value : item.image_type);
            cmd.Parameters.AddWithValue("@note",         string.IsNullOrWhiteSpace(item.note)        ? (object)DBNull.Value : item.note);
        }
        #endregion

        #region Update : floors
        [Route("api/Updatefloors/{Floor_ID}")]
        [HttpPut]
        public IHttpActionResult Updatefloors(string Floor_ID, [FromBody] floorsModel model)
        {
            if (model == null || string.IsNullOrWhiteSpace(model.Floor_ID))
                return BadRequest("ห้าม Null");

            try
            {
                using (var con = new SqlConnection(ConnectionDB.ConnectionStringCN))
                {
                    con.Open();
                    string sql = @"
                        UPDATE [dbo].[floors]
                        SET Site_ID      = @Site_ID,
                            Building_ID  = @Building_ID,
                            floor_number = @floor_number,
                            name         = @name,
                            [function]   = @function,
                            has_cctv     = @has_cctv,
                            image_data   = @image_data,
                            image_type   = @image_type,
                            note         = @note,
                            updated_at   = SYSUTCDATETIME()
                        WHERE Floor_ID = @Floor_ID;";

                    using (var cmd = new SqlCommand(sql, con))
                    {
                        cmd.Parameters.AddWithValue("@Floor_ID",     model.Floor_ID);
                        cmd.Parameters.AddWithValue("@Site_ID",      string.IsNullOrWhiteSpace(model.Site_ID)     ? (object)DBNull.Value : model.Site_ID);
                        cmd.Parameters.AddWithValue("@Building_ID",  string.IsNullOrWhiteSpace(model.Building_ID) ? (object)DBNull.Value : model.Building_ID);
                        cmd.Parameters.AddWithValue("@floor_number", model.floor_number.HasValue ? (object)model.floor_number.Value : DBNull.Value);
                        cmd.Parameters.AddWithValue("@name",         string.IsNullOrWhiteSpace(model.name)        ? (object)DBNull.Value : model.name);
                        cmd.Parameters.AddWithValue("@function",     string.IsNullOrWhiteSpace(model.function)    ? (object)DBNull.Value : model.function);
                        cmd.Parameters.AddWithValue("@has_cctv",     model.has_cctv.HasValue ? (object)model.has_cctv.Value : DBNull.Value);
                        cmd.Parameters.AddWithValue("@image_data",   string.IsNullOrWhiteSpace(model.image_data)  ? (object)DBNull.Value : model.image_data);
                        cmd.Parameters.AddWithValue("@image_type",   string.IsNullOrWhiteSpace(model.image_type)  ? (object)DBNull.Value : model.image_type);
                        cmd.Parameters.AddWithValue("@note",         string.IsNullOrWhiteSpace(model.note)        ? (object)DBNull.Value : model.note);

                        int rows = cmd.ExecuteNonQuery();
                        if (rows == 0) return NotFound();
                    }
                }
                return Ok(new { success = true, Floor_ID });
            }
            catch (Exception ex) { return InternalServerError(ex); }
        }
        #endregion

        #region Delete : floors
        [HttpDelete]
        [Route("api/Deletefloors/{Floor_ID}")]
        public IHttpActionResult Deletefloors(string Floor_ID)
        {
            if (string.IsNullOrWhiteSpace(Floor_ID))
                return BadRequest("Floor_ID ห้ามว่าง");

            try
            {
                using (var con = new SqlConnection(ConnectionDB.ConnectionStringCN))
                {
                    con.Open();
                    string sql = @"DELETE FROM [dbo].[floors] WHERE Floor_ID = @Floor_ID;";
                    using (var cmd = new SqlCommand(sql, con))
                    {
                        cmd.Parameters.AddWithValue("@Floor_ID", Floor_ID);
                        int rows = cmd.ExecuteNonQuery();
                        if (rows == 0) return NotFound();
                        return Ok(new { success = true, deleted = rows, Floor_ID });
                    }
                }
            }
            catch (Exception ex) { return InternalServerError(ex); }
        }
        #endregion
    }
}
