using BNO_Survei_MonitorAPI.ConnectDB;
using System;
using System.Collections.Generic;
using System.Data.SqlClient;
using System.Net.NetworkInformation;
using System.Threading;

namespace BNO_Survei_MonitorAPI.Services
{
    public static class PingService
    {
        private static Timer  _timer;
        private static int    _running = 0; // 0 = idle, 1 = running (Interlocked flag)

        private const int IntervalMs     = 30_000;
        private const int FailThreshold  = 3;
        private const int PingTimeoutMs  = 2_000;

        // ---------------------------------------------------------------
        // Lifecycle
        // ---------------------------------------------------------------

        public static void Start()
        {
            // first fire after 5 s so the API is fully up; then every 30 s
            _timer = new Timer(_ => TryRunCycle(), null, 5_000, IntervalMs);
        }

        public static void Stop()
        {
            _timer?.Dispose();
            _timer = null;
        }

        // ---------------------------------------------------------------
        // Cycle guard — skip if previous cycle is still running
        // ---------------------------------------------------------------

        private static void TryRunCycle()
        {
            if (Interlocked.CompareExchange(ref _running, 1, 0) != 0) return;
            try   { RunCycle(); }
            catch { /* never crash the web process */ }
            finally { Interlocked.Exchange(ref _running, 0); }
        }

        // ---------------------------------------------------------------
        // Main cycle
        // ---------------------------------------------------------------

        private static void RunCycle()
        {
            foreach (var d in LoadDevices())
            {
                if (string.IsNullOrWhiteSpace(d.IpAddress)) continue;
                try
                {
                    bool alive = TryPing(d.IpAddress, out long latencyMs);
                    WritePingLog(d, alive, latencyMs);
                    UpdateDeviceStatus(d, alive);
                    if (alive) ResolveOpenAlerts(d);
                    else       HandleOffline(d);
                }
                catch (Exception ex)
                {
                    WriteErrorLog(d.DeviceType, d.DeviceId, d.IpAddress, ex);
                }
            }
        }

        private static void WriteErrorLog(string deviceType, string deviceId, string ip, Exception ex)
        {
            try
            {
                const string sql = @"
                    INSERT INTO ping_logs (device_type, device_id, ip_address, is_alive, latency_ms)
                    VALUES ('_error', @did, @ip, 0, NULL)";
                using (var con = new SqlConnection(ConnectionDB.ConnectionStringCN))
                {
                    con.Open();
                    using (var cmd = new SqlCommand(sql, con))
                    {
                        // store error info in device_id field (truncated)
                        string errMsg = $"{deviceType}:{deviceId} — {ex.GetType().Name}: {ex.Message}";
                        cmd.Parameters.AddWithValue("@did", errMsg.Length > 200 ? errMsg.Substring(0, 200) : errMsg);
                        cmd.Parameters.AddWithValue("@ip",  (object)ip ?? DBNull.Value);
                        cmd.ExecuteNonQuery();
                    }
                }
            }
            catch { /* absolute last resort — ignore */ }
        }

        // ---------------------------------------------------------------
        // Device info container
        // ---------------------------------------------------------------

        private sealed class DeviceInfo
        {
            public string DeviceType;   // "camera" | "nvr" | "poe_switch"
            public string DeviceId;
            public string DeviceName;
            public string Brand;
            public string IpAddress;
            public int    FailCount;    // value from DB before this cycle
            public string SiteName;
            public string BuildingName;
            public string FloorName;
            public string RoomName;
        }

        // ---------------------------------------------------------------
        // Load all pingable devices (cameras + nvrs + poe_switches)
        // ---------------------------------------------------------------

        private static List<DeviceInfo> LoadDevices()
        {
            var list = new List<DeviceInfo>();
            using (var con = new SqlConnection(ConnectionDB.ConnectionStringCN))
            {
                con.Open();

                // cameras — ip_address
                const string sqlCam = @"
                    SELECT c.id, c.device_name, c.brand, c.ip_address, ISNULL(c.fail_count,0) AS fail_count,
                           s.name AS site_name, b.name AS building_name, f.name AS floor_name, NULL AS room_name
                    FROM   cameras c
                    LEFT JOIN sites     s ON c.Site_ID     = s.Site_ID
                    LEFT JOIN buildings b ON c.Building_ID = b.Building_ID
                    LEFT JOIN floors    f ON c.Floor_ID    = f.Floor_ID";
                using (var cmd = new SqlCommand(sqlCam, con))
                using (var r = cmd.ExecuteReader())
                    while (r.Read())
                        list.Add(MapDevice(r, "camera", "id"));

                // nvrs — ip_cctv (CCTV VLAN)
                const string sqlNvr = @"
                    SELECT n.NVR_ID AS id, n.device_name, n.brand, n.ip_cctv AS ip_address, ISNULL(n.fail_count,0) AS fail_count,
                           s.name AS site_name, b.name AS building_name, f.name AS floor_name, r.name AS room_name
                    FROM   nvrs n
                    LEFT JOIN sites     s ON n.Site_ID     = s.Site_ID
                    LEFT JOIN buildings b ON n.Building_ID = b.Building_ID
                    LEFT JOIN floors    f ON n.Floor_ID    = f.Floor_ID
                    LEFT JOIN rooms     r ON n.Room_ID     = r.Room_ID";
                using (var cmd = new SqlCommand(sqlNvr, con))
                using (var r = cmd.ExecuteReader())
                    while (r.Read())
                        list.Add(MapDevice(r, "nvr", "id"));

                // poe_switches — ip_address
                const string sqlSw = @"
                    SELECT sw.SW_ID AS id, sw.device_name, sw.brand, sw.ip_address, ISNULL(sw.fail_count,0) AS fail_count,
                           s.name AS site_name, b.name AS building_name, f.name AS floor_name, r.name AS room_name
                    FROM   poe_switches sw
                    LEFT JOIN sites     s ON sw.Site_ID     = s.Site_ID
                    LEFT JOIN buildings b ON sw.Building_ID = b.Building_ID
                    LEFT JOIN floors    f ON sw.Floor_ID    = f.Floor_ID
                    LEFT JOIN rooms     r ON sw.Room_ID     = r.Room_ID";
                using (var cmd = new SqlCommand(sqlSw, con))
                using (var r = cmd.ExecuteReader())
                    while (r.Read())
                        list.Add(MapDevice(r, "poe_switch", "id"));
            }
            return list;
        }

        private static DeviceInfo MapDevice(SqlDataReader r, string deviceType, string idCol)
        {
            return new DeviceInfo
            {
                DeviceType   = deviceType,
                DeviceId     = r[idCol].ToString(),
                DeviceName   = Str(r, "device_name"),
                Brand        = Str(r, "brand"),
                IpAddress    = Str(r, "ip_address"),
                FailCount    = Convert.ToInt32(r["fail_count"]),
                SiteName     = Str(r, "site_name"),
                BuildingName = Str(r, "building_name"),
                FloorName    = Str(r, "floor_name"),
                RoomName     = Str(r, "room_name"),
            };
        }

        // ---------------------------------------------------------------
        // Ping
        // ---------------------------------------------------------------

        private static bool TryPing(string host, out long latencyMs)
        {
            latencyMs = -1;
            try
            {
                using (var ping = new Ping())
                {
                    var reply = ping.Send(host, PingTimeoutMs);
                    if (reply != null && reply.Status == IPStatus.Success)
                    {
                        latencyMs = reply.RoundtripTime;
                        return true;
                    }
                }
            }
            catch { }
            return false;
        }

        // ---------------------------------------------------------------
        // DB writes
        // ---------------------------------------------------------------

        private static void WritePingLog(DeviceInfo d, bool alive, long latencyMs)
        {
            const string sql = @"
                INSERT INTO ping_logs (device_type, device_id, ip_address, is_alive, latency_ms)
                VALUES (@dt, @did, @ip, @alive, @lat)";
            using (var con = new SqlConnection(ConnectionDB.ConnectionStringCN))
            {
                con.Open();
                using (var cmd = new SqlCommand(sql, con))
                {
                    cmd.Parameters.AddWithValue("@dt",    d.DeviceType);
                    cmd.Parameters.AddWithValue("@did",   d.DeviceId);
                    cmd.Parameters.AddWithValue("@ip",    (object)d.IpAddress ?? DBNull.Value);
                    cmd.Parameters.AddWithValue("@alive", alive);
                    cmd.Parameters.AddWithValue("@lat",   latencyMs >= 0 ? (object)latencyMs : DBNull.Value);
                    cmd.ExecuteNonQuery();
                }
            }
        }

        private static void UpdateDeviceStatus(DeviceInfo d, bool alive)
        {
            // Table and PK column names are derived from a closed switch — not user input.
            string table = TableFor(d.DeviceType);
            string pkCol = PkColFor(d.DeviceType);

            string sql = alive
                ? $"UPDATE {table} SET status='online',  fail_count=0,                       last_seen=@now WHERE {pkCol}=@id"
                : $"UPDATE {table} SET status='offline', fail_count=ISNULL(fail_count,0)+1              WHERE {pkCol}=@id";

            using (var con = new SqlConnection(ConnectionDB.ConnectionStringCN))
            {
                con.Open();
                using (var cmd = new SqlCommand(sql, con))
                {
                    if (alive)
                        cmd.Parameters.Add("@now", System.Data.SqlDbType.DateTime2).Value = DateTime.UtcNow;
                    // cameras use INT PK — pass as Int32 to avoid NVarChar→INT mismatch (0 rows affected)
                    if (d.DeviceType == "camera")
                        cmd.Parameters.Add("@id", System.Data.SqlDbType.Int).Value = int.Parse(d.DeviceId);
                    else
                        cmd.Parameters.AddWithValue("@id", d.DeviceId);
                    cmd.ExecuteNonQuery();
                }
            }
        }

        private static void HandleOffline(DeviceInfo d)
        {
            int newFailCount = d.FailCount + 1;
            if (newFailCount < FailThreshold) return;

            using (var con = new SqlConnection(ConnectionDB.ConnectionStringCN))
            {
                con.Open();

                // skip if an unresolved alert already exists
                const string checkSql = @"
                    SELECT COUNT(1) FROM alert_logs
                    WHERE device_type=@dt AND device_id=@did AND resolved_at IS NULL";
                using (var cmd = new SqlCommand(checkSql, con))
                {
                    cmd.Parameters.AddWithValue("@dt",  d.DeviceType);
                    cmd.Parameters.AddWithValue("@did", d.DeviceId);
                    if ((int)cmd.ExecuteScalar() > 0) return;
                }

                const string insertSql = @"
                    INSERT INTO alert_logs
                        (device_type, device_id, device_name, brand, ip_address,
                         site_name, building_name, floor_name, room_name,
                         alert_type, message, webhook_sent)
                    VALUES
                        (@dt, @did, @dn, @br, @ip,
                         @sn, @bn, @fn, @rn,
                         'offline', @msg, 0)";
                using (var cmd = new SqlCommand(insertSql, con))
                {
                    cmd.Parameters.AddWithValue("@dt",  d.DeviceType);
                    cmd.Parameters.AddWithValue("@did", d.DeviceId);
                    cmd.Parameters.AddWithValue("@dn",  (object)d.DeviceName   ?? DBNull.Value);
                    cmd.Parameters.AddWithValue("@br",  (object)d.Brand        ?? DBNull.Value);
                    cmd.Parameters.AddWithValue("@ip",  (object)d.IpAddress    ?? DBNull.Value);
                    cmd.Parameters.AddWithValue("@sn",  (object)d.SiteName     ?? DBNull.Value);
                    cmd.Parameters.AddWithValue("@bn",  (object)d.BuildingName ?? DBNull.Value);
                    cmd.Parameters.AddWithValue("@fn",  (object)d.FloorName    ?? DBNull.Value);
                    cmd.Parameters.AddWithValue("@rn",  (object)d.RoomName     ?? DBNull.Value);
                    cmd.Parameters.AddWithValue("@msg",
                        $"{d.DeviceType} '{d.DeviceName}' ({d.IpAddress}) ไม่ตอบสนอง {newFailCount} รอบติดต่อกัน");
                    cmd.ExecuteNonQuery();
                }
            }
        }

        private static void ResolveOpenAlerts(DeviceInfo d)
        {
            const string sql = @"
                UPDATE alert_logs SET resolved_at=@resolvedAt
                WHERE device_type=@dt AND device_id=@did AND resolved_at IS NULL";
            using (var con = new SqlConnection(ConnectionDB.ConnectionStringCN))
            {
                con.Open();
                using (var cmd = new SqlCommand(sql, con))
                {
                    cmd.Parameters.Add("@resolvedAt", System.Data.SqlDbType.DateTime2).Value = DateTime.UtcNow;
                    cmd.Parameters.AddWithValue("@dt",  d.DeviceType);
                    cmd.Parameters.AddWithValue("@did", d.DeviceId);
                    cmd.ExecuteNonQuery();
                }
            }
        }

        // ---------------------------------------------------------------
        // Helpers
        // ---------------------------------------------------------------

        private static string TableFor(string deviceType)
        {
            switch (deviceType)
            {
                case "camera":     return "cameras";
                case "nvr":        return "nvrs";
                case "poe_switch": return "poe_switches";
                default: throw new ArgumentException("Unknown device type: " + deviceType);
            }
        }

        private static string PkColFor(string deviceType)
        {
            switch (deviceType)
            {
                case "camera":     return "id";
                case "nvr":        return "NVR_ID";
                case "poe_switch": return "SW_ID";
                default: throw new ArgumentException("Unknown device type: " + deviceType);
            }
        }

        private static string Str(SqlDataReader r, string col)
            => r[col] == DBNull.Value ? null : r[col].ToString();
    }
}
