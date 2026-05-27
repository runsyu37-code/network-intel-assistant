using BNO_Survei_MonitorAPI.ConnectDB;
using BNO_Survei_MonitorAPI.Filters;
using System;
using System.Data.SqlClient;
using System.IO;
using System.Net;
using System.Net.Http;
using System.Security.Claims;
using System.Threading.Tasks;
using System.Web;
using System.Web.Http;

namespace BNO_Survei_MonitorAPI.Controllers
{
    public class floorPlansController : ApiController
    {
        private static readonly string[] AllowedExtensions = { ".jpg", ".jpeg", ".png" };
        private static readonly string[] AllowedMimeTypes  = { "image/jpeg", "image/png" };
        private const long MaxBytes = 10 * 1024 * 1024; // 10 MB

        // ---------------------------------------------------------------
        // GET /api/floors/{floorId}/floor-plan
        // Returns the active floor plan metadata for a floor.
        // ---------------------------------------------------------------
        [HttpGet]
        [Route("api/floors/{floorId}/floor-plan")]
        public IHttpActionResult GetFloorPlan(string floorId)
        {
            using (var con = new SqlConnection(ConnectionDB.ConnectionStringCN))
            {
                con.Open();
                using (var cmd = new SqlCommand(@"
                    SELECT floor_plan_id, floor_id, image_path, image_width, image_height,
                           file_size_bytes, version, uploaded_at, uploaded_by, notes
                    FROM floor_plans WHERE floor_id = @floorId AND is_active = 1", con))
                {
                    cmd.Parameters.AddWithValue("@floorId", floorId);
                    using (var r = cmd.ExecuteReader())
                    {
                        if (!r.Read()) return NotFound();
                        return Json(new
                        {
                            floorPlanId    = r["floor_plan_id"],
                            floorId        = r["floor_id"].ToString(),
                            imagePath      = $"/api/floors/{r["floor_id"]}/floor-plan/image",
                            imageWidth     = r["image_width"]     == DBNull.Value ? (int?)null : Convert.ToInt32(r["image_width"]),
                            imageHeight    = r["image_height"]    == DBNull.Value ? (int?)null : Convert.ToInt32(r["image_height"]),
                            fileSizeBytes  = r["file_size_bytes"] == DBNull.Value ? (long?)null : Convert.ToInt64(r["file_size_bytes"]),
                            version        = Convert.ToInt32(r["version"]),
                            uploadedAt     = r["uploaded_at"].ToString(),
                            uploadedBy     = r["uploaded_by"]     == DBNull.Value ? (int?)null : Convert.ToInt32(r["uploaded_by"]),
                            notes          = r["notes"]           == DBNull.Value ? null : r["notes"].ToString()
                        });
                    }
                }
            }
        }

        // ---------------------------------------------------------------
        // POST /api/floors/{floorId}/floor-plan
        // Upload a new floor plan image (multipart/form-data).
        // Only admin role may call this endpoint.
        // Layer 1: auth (JwtAuthFilter handles this globally)
        // Layer 2: role — admin only
        // Layer 3: floor exists
        // Layer 4: file extension + MIME type whitelist
        // Layer 5: file size ≤ 10 MB
        // Layer 6: magic bytes verification (JPEG/PNG header)
        // ---------------------------------------------------------------
        [HttpPost]
        [Route("api/floors/{floorId}/floor-plan")]
        [RequireRole("admin")]
        public async Task<IHttpActionResult> UploadFloorPlan(string floorId)
        {
            if (!Request.Content.IsMimeMultipartContent())
                return BadRequest("Multipart form data required");

            // Layer 3: floor exists
            if (!FloorExists(floorId))
                return NotFound();

            var provider = new MultipartMemoryStreamProvider();
            await Request.Content.ReadAsMultipartAsync(provider);

            HttpContent filePart = null;
            foreach (var part in provider.Contents)
            {
                var disposition = part.Headers.ContentDisposition;
                if (disposition?.Name?.Trim('"') == "file")
                {
                    filePart = part;
                    break;
                }
            }

            if (filePart == null)
                return BadRequest("No file part named 'file' found");

            var fileName = filePart.Headers.ContentDisposition?.FileName?.Trim('"') ?? "upload";
            var mimeType = filePart.Headers.ContentType?.MediaType ?? "";

            // Layer 4a: extension whitelist
            var ext = Path.GetExtension(fileName).ToLowerInvariant();
            if (Array.IndexOf(AllowedExtensions, ext) < 0)
                return BadRequest($"File type not allowed. Allowed: {string.Join(", ", AllowedExtensions)}");

            // Layer 4b: MIME type whitelist
            if (Array.IndexOf(AllowedMimeTypes, mimeType) < 0)
                return BadRequest("MIME type not allowed");

            var bytes = await filePart.ReadAsByteArrayAsync();

            // Layer 5: size limit
            if (bytes.Length > MaxBytes)
                return BadRequest($"File exceeds {MaxBytes / 1024 / 1024} MB limit");

            // Layer 6: magic bytes
            if (!HasValidImageHeader(bytes, ext))
                return BadRequest("File content does not match declared type");

            // Save to disk — canonical upload root to prevent path traversal
            var uploadRoot = HttpContext.Current.Server.MapPath("~/uploads/floor-plans");
            Directory.CreateDirectory(uploadRoot);

            // Generate safe filename — no user-supplied name touches the FS path
            var safeFileName = $"{floorId}_{DateTime.UtcNow:yyyyMMddHHmmssffff}{ext}";
            var destPath = Path.Combine(uploadRoot, safeFileName);

            // TOCTOU: write to temp, then move atomically
            var tempPath = destPath + ".tmp";
            File.WriteAllBytes(tempPath, bytes);
            File.Move(tempPath, destPath);

            var relativePath = $"uploads/floor-plans/{safeFileName}";

            // Get image dimensions (basic BMP-free parse)
            GetImageDimensions(bytes, ext, out int width, out int height);

            var identity = RequestContext.Principal?.Identity as ClaimsIdentity;
            var userIdStr = identity?.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            int? uploadedBy = int.TryParse(userIdStr, out int uid) ? (int?)uid : null;

            int newId;
            using (var con = new SqlConnection(ConnectionDB.ConnectionStringCN))
            {
                con.Open();
                using (var tx = con.BeginTransaction())
                {
                    // Deactivate existing active plan
                    using (var cmd = new SqlCommand(
                        "UPDATE floor_plans SET is_active = 0 WHERE floor_id = @fid AND is_active = 1", con, tx))
                    {
                        cmd.Parameters.AddWithValue("@fid", floorId);
                        cmd.ExecuteNonQuery();
                    }

                    // Get next version number
                    int version = 1;
                    using (var cmd = new SqlCommand(
                        "SELECT ISNULL(MAX(version), 0) + 1 FROM floor_plans WHERE floor_id = @fid", con, tx))
                    {
                        cmd.Parameters.AddWithValue("@fid", floorId);
                        version = Convert.ToInt32(cmd.ExecuteScalar());
                    }

                    // Insert new active plan
                    using (var cmd = new SqlCommand(@"
                        INSERT INTO floor_plans
                            (floor_id, image_path, image_width, image_height, file_size_bytes, version, uploaded_by)
                        OUTPUT INSERTED.floor_plan_id
                        VALUES (@fid, @path, @w, @h, @size, @version, @by)", con, tx))
                    {
                        cmd.Parameters.AddWithValue("@fid",     floorId);
                        cmd.Parameters.AddWithValue("@path",    relativePath);
                        cmd.Parameters.AddWithValue("@w",       width > 0  ? (object)width  : DBNull.Value);
                        cmd.Parameters.AddWithValue("@h",       height > 0 ? (object)height : DBNull.Value);
                        cmd.Parameters.AddWithValue("@size",    bytes.Length);
                        cmd.Parameters.AddWithValue("@version", version);
                        cmd.Parameters.AddWithValue("@by",      uploadedBy.HasValue ? (object)uploadedBy.Value : DBNull.Value);
                        newId = Convert.ToInt32(cmd.ExecuteScalar());
                    }

                    tx.Commit();
                }
            }

            return Ok(new
            {
                success     = true,
                floorPlanId = newId,
                floorId,
                imagePath   = $"/api/floors/{floorId}/floor-plan/image",
                imageWidth  = width > 0  ? (int?)width  : null,
                imageHeight = height > 0 ? (int?)height : null,
                fileSizeBytes = bytes.Length
            });
        }

        // ---------------------------------------------------------------
        // GET /api/floors/{floorId}/floor-plan/image
        // Serves the actual image bytes through the API pipeline (requires JWT).
        // Direct IIS access to ~/uploads/ is blocked via hiddenSegment in web.config.
        // ---------------------------------------------------------------
        [HttpGet]
        [Route("api/floors/{floorId}/floor-plan/image")]
        public IHttpActionResult GetFloorPlanImage(string floorId)
        {
            string imagePath;
            using (var con = new SqlConnection(ConnectionDB.ConnectionStringCN))
            {
                con.Open();
                using (var cmd = new SqlCommand(
                    "SELECT image_path FROM floor_plans WHERE floor_id = @fid AND is_active = 1", con))
                {
                    cmd.Parameters.AddWithValue("@fid", floorId);
                    var result = cmd.ExecuteScalar();
                    if (result == null || result == DBNull.Value) return NotFound();
                    imagePath = result.ToString();
                }
            }

            var fullPath = System.Web.HttpContext.Current.Server.MapPath("~/" + imagePath);
            if (!System.IO.File.Exists(fullPath)) return NotFound();

            var bytes = System.IO.File.ReadAllBytes(fullPath);
            var ext = System.IO.Path.GetExtension(fullPath).ToLowerInvariant();
            var mimeType = ext == ".png" ? "image/png" : "image/jpeg";

            var response = new System.Net.Http.HttpResponseMessage(System.Net.HttpStatusCode.OK)
            {
                Content = new System.Net.Http.ByteArrayContent(bytes)
            };
            response.Content.Headers.ContentType =
                new System.Net.Http.Headers.MediaTypeHeaderValue(mimeType);
            return ResponseMessage(response);
        }

        // ---------------------------------------------------------------
        // DELETE /api/floors/{floorId}/floor-plan
        // Deactivates the current active floor plan (soft delete).
        // Admin only.
        // ---------------------------------------------------------------
        [HttpDelete]
        [Route("api/floors/{floorId}/floor-plan")]
        [RequireRole("admin")]
        public IHttpActionResult DeleteFloorPlan(string floorId)
        {
            using (var con = new SqlConnection(ConnectionDB.ConnectionStringCN))
            {
                con.Open();
                using (var cmd = new SqlCommand(
                    "UPDATE floor_plans SET is_active = 0 WHERE floor_id = @fid AND is_active = 1", con))
                {
                    cmd.Parameters.AddWithValue("@fid", floorId);
                    int rows = cmd.ExecuteNonQuery();
                    if (rows == 0) return NotFound();
                    return Ok(new { success = true, floorId });
                }
            }
        }

        // ---- Helpers --------------------------------------------------------

        private bool FloorExists(string floorId)
        {
            using (var con = new SqlConnection(ConnectionDB.ConnectionStringCN))
            {
                con.Open();
                using (var cmd = new SqlCommand("SELECT 1 FROM floors WHERE Floor_ID = @id", con))
                {
                    cmd.Parameters.AddWithValue("@id", floorId);
                    return cmd.ExecuteScalar() != null;
                }
            }
        }

        private static bool HasValidImageHeader(byte[] bytes, string ext)
        {
            if (bytes.Length < 4) return false;
            if (ext == ".png")
                return bytes[0] == 0x89 && bytes[1] == 0x50 && bytes[2] == 0x4E && bytes[3] == 0x47;
            // JPEG: FF D8 FF
            return bytes[0] == 0xFF && bytes[1] == 0xD8 && bytes[2] == 0xFF;
        }

        private static void GetImageDimensions(byte[] bytes, string ext, out int width, out int height)
        {
            width = 0; height = 0;
            try
            {
                if (ext == ".png" && bytes.Length >= 24)
                {
                    width  = (bytes[16] << 24) | (bytes[17] << 16) | (bytes[18] << 8) | bytes[19];
                    height = (bytes[20] << 24) | (bytes[21] << 16) | (bytes[22] << 8) | bytes[23];
                    return;
                }
                // JPEG: scan for SOF0/SOF2 markers
                if ((ext == ".jpg" || ext == ".jpeg") && bytes.Length > 10)
                {
                    int i = 2;
                    while (i < bytes.Length - 8)
                    {
                        if (bytes[i] != 0xFF) break;
                        byte marker = bytes[i + 1];
                        int segLen = (bytes[i + 2] << 8) | bytes[i + 3];
                        if ((marker == 0xC0 || marker == 0xC2) && bytes.Length >= i + 9)
                        {
                            height = (bytes[i + 5] << 8) | bytes[i + 6];
                            width  = (bytes[i + 7] << 8) | bytes[i + 8];
                            return;
                        }
                        i += 2 + segLen;
                    }
                }
            }
            catch { /* if parse fails, store 0/0 — non-fatal */ }
        }
    }
}
