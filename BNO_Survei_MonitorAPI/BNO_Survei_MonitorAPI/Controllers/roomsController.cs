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
    public class roomsController : ApiController
    {
        #region GET : rooms
        [Route("api/rooms")]
        [HttpGet]
        public IHttpActionResult GetRooms(string Floor_ID = null, string Room_ID = null)
        {
            List<roomsModel> ListRP = new List<roomsModel>();
            using (SqlConnection con = new SqlConnection(ConnectionDB.ConnectionStringCN))
            {
                con.Open();
                string sql = "SELECT [Room_ID],[Site_ID],[Building_ID],[Floor_ID],[name],[type],[has_nvr],[has_sw],[width_m],[length_m],[x],[y],[w],[h],[image_data],[image_type],[note],[created_at],[updated_at] FROM [dbo].[rooms] WHERE 1=1";
                if (!string.IsNullOrWhiteSpace(Floor_ID)) sql += " AND Floor_ID = @Floor_ID";
                if (!string.IsNullOrWhiteSpace(Room_ID))  sql += " AND Room_ID = @Room_ID";
                SqlCommand cmd = new SqlCommand(sql, con);
                if (!string.IsNullOrWhiteSpace(Floor_ID)) cmd.Parameters.AddWithValue("@Floor_ID", Floor_ID);
                if (!string.IsNullOrWhiteSpace(Room_ID))  cmd.Parameters.AddWithValue("@Room_ID", Room_ID);
                using (var reader = cmd.ExecuteReader())
                {
                    while (reader.Read())
                    {
                        ListRP.Add(new roomsModel
                        {
                            Room_ID     = reader["Room_ID"].ToString(),
                            Site_ID     = reader["Site_ID"].ToString(),
                            Building_ID = reader["Building_ID"].ToString(),
                            Floor_ID    = reader["Floor_ID"].ToString(),
                            name        = reader["name"].ToString(),
                            type        = reader["type"] == DBNull.Value ? null : reader["type"].ToString(),
                            has_nvr     = reader["has_nvr"] == DBNull.Value ? (bool?)null : Convert.ToBoolean(reader["has_nvr"]),
                            has_sw      = reader["has_sw"]  == DBNull.Value ? (bool?)null : Convert.ToBoolean(reader["has_sw"]),
                            width_m     = reader["width_m"]  == DBNull.Value ? (decimal?)null : Convert.ToDecimal(reader["width_m"]),
                            length_m    = reader["length_m"] == DBNull.Value ? (decimal?)null : Convert.ToDecimal(reader["length_m"]),
                            x           = reader["x"] == DBNull.Value ? (int?)null : Convert.ToInt32(reader["x"]),
                            y           = reader["y"] == DBNull.Value ? (int?)null : Convert.ToInt32(reader["y"]),
                            w           = reader["w"] == DBNull.Value ? (int?)null : Convert.ToInt32(reader["w"]),
                            h           = reader["h"] == DBNull.Value ? (int?)null : Convert.ToInt32(reader["h"]),
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

        #region Save : rooms
        [Route("api/rooms")]
        [HttpPost]
        public IHttpActionResult Saverooms([FromBody] List<roomsModel> modelList)
        {
            if (modelList == null || modelList.Count == 0)
                return BadRequest("à¹„à¸¡à¹ˆà¸¡à¸µà¸‚à¹‰à¸­à¸¡à¸¹à¸¥à¸—à¸µà¹ˆà¸ªà¹ˆà¸‡à¸¡à¸²");

            if (modelList.Any(x => string.IsNullOrWhiteSpace(x.Room_ID)))
                return BadRequest("Room_ID à¸«à¹‰à¸²à¸¡à¸§à¹ˆà¸²à¸‡");

            int insertCount = 0;
            try
            {
                using (var con = new SqlConnection(ConnectionDB.ConnectionStringCN))
                {
                    con.Open();
                    string insertSql = @"
                        INSERT INTO [dbo].[rooms] ([Room_ID],[Site_ID],[Building_ID],[Floor_ID],[name],[type],[has_nvr],[has_sw],[width_m],[length_m],[x],[y],[w],[h],[image_data],[image_type],[note])
                        VALUES (@Room_ID,@Site_ID,@Building_ID,@Floor_ID,@name,@type,@has_nvr,@has_sw,@width_m,@length_m,@x,@y,@w,@h,@image_data,@image_type,@note);";

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

        private void AddParameters(SqlCommand cmd, roomsModel item)
        {
            cmd.Parameters.AddWithValue("@Room_ID",     string.IsNullOrWhiteSpace(item.Room_ID)     ? (object)DBNull.Value : item.Room_ID);
            cmd.Parameters.AddWithValue("@Site_ID",     string.IsNullOrWhiteSpace(item.Site_ID)     ? (object)DBNull.Value : item.Site_ID);
            cmd.Parameters.AddWithValue("@Building_ID", string.IsNullOrWhiteSpace(item.Building_ID) ? (object)DBNull.Value : item.Building_ID);
            cmd.Parameters.AddWithValue("@Floor_ID",    string.IsNullOrWhiteSpace(item.Floor_ID)    ? (object)DBNull.Value : item.Floor_ID);
            cmd.Parameters.AddWithValue("@name",        string.IsNullOrWhiteSpace(item.name)        ? (object)DBNull.Value : item.name);
            cmd.Parameters.AddWithValue("@type",        string.IsNullOrWhiteSpace(item.type)        ? (object)DBNull.Value : item.type);
            cmd.Parameters.AddWithValue("@has_nvr",     item.has_nvr.HasValue  ? (object)item.has_nvr.Value  : DBNull.Value);
            cmd.Parameters.AddWithValue("@has_sw",      item.has_sw.HasValue   ? (object)item.has_sw.Value   : DBNull.Value);
            cmd.Parameters.AddWithValue("@width_m",     item.width_m.HasValue  ? (object)item.width_m.Value  : DBNull.Value);
            cmd.Parameters.AddWithValue("@length_m",    item.length_m.HasValue ? (object)item.length_m.Value : DBNull.Value);
            cmd.Parameters.AddWithValue("@x",           item.x.HasValue        ? (object)item.x.Value        : DBNull.Value);
            cmd.Parameters.AddWithValue("@y",           item.y.HasValue        ? (object)item.y.Value        : DBNull.Value);
            cmd.Parameters.AddWithValue("@w",           item.w.HasValue        ? (object)item.w.Value        : DBNull.Value);
            cmd.Parameters.AddWithValue("@h",           item.h.HasValue        ? (object)item.h.Value        : DBNull.Value);
            cmd.Parameters.AddWithValue("@image_data",  string.IsNullOrWhiteSpace(item.image_data)  ? (object)DBNull.Value : item.image_data);
            cmd.Parameters.AddWithValue("@image_type",  string.IsNullOrWhiteSpace(item.image_type)  ? (object)DBNull.Value : item.image_type);
            cmd.Parameters.AddWithValue("@note",        string.IsNullOrWhiteSpace(item.note)        ? (object)DBNull.Value : item.note);
        }
        #endregion

        #region Update : rooms
        [Route("api/rooms/{Room_ID}")]
        [HttpPost]
        public IHttpActionResult Updaterooms(string Room_ID, [FromBody] roomsModel model)
        {
            if (model == null || string.IsNullOrWhiteSpace(model.Room_ID))
                return BadRequest("à¸«à¹‰à¸²à¸¡ Null");

            try
            {
                using (var con = new SqlConnection(ConnectionDB.ConnectionStringCN))
                {
                    con.Open();
                    string sql = @"
                        UPDATE [dbo].[rooms]
                        SET Site_ID     = @Site_ID,
                            Building_ID = @Building_ID,
                            Floor_ID    = @Floor_ID,
                            name        = @name,
                            type        = @type,
                            has_nvr     = @has_nvr,
                            has_sw      = @has_sw,
                            width_m     = @width_m,
                            length_m    = @length_m,
                            x           = @x,
                            y           = @y,
                            w           = @w,
                            h           = @h,
                            image_data  = @image_data,
                            image_type  = @image_type,
                            note        = @note,
                            updated_at  = SYSUTCDATETIME()
                        WHERE Room_ID = @Room_ID;";

                    using (var cmd = new SqlCommand(sql, con))
                    {
                        cmd.Parameters.AddWithValue("@Room_ID",     model.Room_ID);
                        cmd.Parameters.AddWithValue("@Site_ID",     string.IsNullOrWhiteSpace(model.Site_ID)     ? (object)DBNull.Value : model.Site_ID);
                        cmd.Parameters.AddWithValue("@Building_ID", string.IsNullOrWhiteSpace(model.Building_ID) ? (object)DBNull.Value : model.Building_ID);
                        cmd.Parameters.AddWithValue("@Floor_ID",    string.IsNullOrWhiteSpace(model.Floor_ID)    ? (object)DBNull.Value : model.Floor_ID);
                        cmd.Parameters.AddWithValue("@name",        string.IsNullOrWhiteSpace(model.name)        ? (object)DBNull.Value : model.name);
                        cmd.Parameters.AddWithValue("@type",        string.IsNullOrWhiteSpace(model.type)        ? (object)DBNull.Value : model.type);
                        cmd.Parameters.AddWithValue("@has_nvr",     model.has_nvr.HasValue  ? (object)model.has_nvr.Value  : DBNull.Value);
                        cmd.Parameters.AddWithValue("@has_sw",      model.has_sw.HasValue   ? (object)model.has_sw.Value   : DBNull.Value);
                        cmd.Parameters.AddWithValue("@width_m",     model.width_m.HasValue  ? (object)model.width_m.Value  : DBNull.Value);
                        cmd.Parameters.AddWithValue("@length_m",    model.length_m.HasValue ? (object)model.length_m.Value : DBNull.Value);
                        cmd.Parameters.AddWithValue("@x",           model.x.HasValue        ? (object)model.x.Value        : DBNull.Value);
                        cmd.Parameters.AddWithValue("@y",           model.y.HasValue        ? (object)model.y.Value        : DBNull.Value);
                        cmd.Parameters.AddWithValue("@w",           model.w.HasValue        ? (object)model.w.Value        : DBNull.Value);
                        cmd.Parameters.AddWithValue("@h",           model.h.HasValue        ? (object)model.h.Value        : DBNull.Value);
                        cmd.Parameters.AddWithValue("@image_data",  string.IsNullOrWhiteSpace(model.image_data)  ? (object)DBNull.Value : model.image_data);
                        cmd.Parameters.AddWithValue("@image_type",  string.IsNullOrWhiteSpace(model.image_type)  ? (object)DBNull.Value : model.image_type);
                        cmd.Parameters.AddWithValue("@note",        string.IsNullOrWhiteSpace(model.note)        ? (object)DBNull.Value : model.note);

                        int rows = cmd.ExecuteNonQuery();
                        if (rows == 0) return NotFound();
                    }
                }
                return Ok(new { success = true, Room_ID });
            }
            catch (Exception ex) { return InternalServerError(ex); }
        }
        #endregion

        #region Delete : rooms
        [HttpPost]
        [Route("api/rooms/delete/{Room_ID}")]
        public IHttpActionResult Deleterooms(string Room_ID)
        {
            if (string.IsNullOrWhiteSpace(Room_ID))
                return BadRequest("Room_ID à¸«à¹‰à¸²à¸¡à¸§à¹ˆà¸²à¸‡");

            try
            {
                using (var con = new SqlConnection(ConnectionDB.ConnectionStringCN))
                {
                    con.Open();
                    string pre = @"
                        DELETE FROM [dbo].[poe_switches] WHERE Room_ID = @Room_ID;
                        DELETE FROM [dbo].[nvrs]         WHERE Room_ID = @Room_ID;";
                    using (var pre_cmd = new SqlCommand(pre, con))
                    {
                        pre_cmd.Parameters.AddWithValue("@Room_ID", Room_ID);
                        pre_cmd.ExecuteNonQuery();
                    }
                    string sql = @"DELETE FROM [dbo].[rooms] WHERE Room_ID = @Room_ID;";
                    using (var cmd = new SqlCommand(sql, con))
                    {
                        cmd.Parameters.AddWithValue("@Room_ID", Room_ID);
                        int rows = cmd.ExecuteNonQuery();
                        if (rows == 0) return NotFound();
                        return Ok(new { success = true, deleted = rows, Room_ID });
                    }
                }
            }
            catch (Exception ex) { return InternalServerError(ex); }
        }
        #endregion
    }
}
