# Ping Service — Problems & Solutions

Development log for `BNO_Survei_MonitorAPI` background Ping Service.
Project: SSM (Surveillance Smart-Monitor), ASP.NET Web API .NET 4.8, SQL Server.

---

## Problem 1 — `PingService.cs` not found at build

**Symptom:** Build error — the compiler could not find `Services/PingService.cs` even though the file existed on disk.

**Root cause:** ASP.NET Framework (legacy `.csproj` format) does not auto-include new files. Every new `.cs` file must be explicitly registered inside the `.csproj` with a `<Compile Include="..." />` entry. This is unlike SDK-style projects (`.NET 5+`) which include all `.cs` files by default.

**Fix:** Added the following line inside the `<ItemGroup>` that contains other `<Compile>` entries in `BNO_Survei_MonitorAPI.csproj`:

```xml
<Compile Include="Services\PingService.cs" />
```

---

## Problem 2 — `last_seen` column not updating (stayed NULL for online devices)

**Symptom:** When a device was pinged successfully, the SQL `UPDATE` ran without error, but `last_seen` remained NULL in the database. A manual `UPDATE` in SSMS using `GETDATE()` worked fine.

**Root cause:** The original SQL was:

```sql
UPDATE cameras SET status='online', fail_count=0, last_seen=GETDATE() WHERE id=@id
```

This syntax is valid SQL, but when combined with a parameterized `SqlCommand`, ADO.NET's handling of inline `GETDATE()` conflicted with how the statement was compiled. Switching to an explicit `@now` parameter resolved it.

Additionally, `cameras.last_seen` is defined as `DATETIME2(7)`. Using `AddWithValue` would infer the type as `DateTime` (not `DateTime2`), which can silently fail to write on certain SQL Server configurations.

**Fix:** Replaced inline `GETDATE()` with an explicit typed parameter:

```csharp
// In the SQL string:
"UPDATE cameras SET status='online', fail_count=0, last_seen=@now WHERE id=@id"

// When adding the parameter:
cmd.Parameters.Add("@now", System.Data.SqlDbType.DateTime2).Value = DateTime.UtcNow;
```

---

## Problem 3 — Ping Service stopped after one cycle (no new `ping_logs` rows)

**Symptom:** After the first successful cycle, no new rows appeared in `ping_logs`. The service appeared to stop silently.

**Root cause:** A device-level exception inside `RunCycle()` propagated up to `TryRunCycle()`, which caught it — but the `_running` Interlocked flag was reset to 0 correctly, so the timer would fire again. The actual stop was caused by an app pool / IIS Express restart triggered by a separate action (deleting a "room" record via API while the service was running). When IIS Express recycled the app, `Global.asax Application_End` was called, `PingService.Stop()` disposed the timer, and the new app instance started fresh. However, the original code had no per-device isolation: one exception in `RunCycle` would abort the entire foreach loop, silently skipping all remaining devices with no log trace.

**Fix:** Wrapped each device iteration in its own try-catch, with a dedicated `WriteErrorLog` method that inserts a row into `ping_logs` with `device_type='_error'` so exceptions are always visible in the audit table:

```csharp
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
```

---

## Problem 4 — Camera `status` and `fail_count` not updating (0 rows affected, silent)

**Symptom:** After a ping cycle, NVR and poe_switch records updated correctly, but camera records never changed — `status` stayed `'unknown'`, `fail_count` stayed 0, `last_seen` stayed NULL. No exception was thrown.

**Root cause:** `cameras.id` is `INT IDENTITY(1,1)` — an integer primary key. `AddWithValue("@id", d.DeviceId)` where `DeviceId` is a `string` causes ADO.NET to infer the SQL parameter type as `NVarChar`. The resulting WHERE clause becomes `WHERE id = N'1'`, which is an implicit integer-to-nvarchar comparison. SQL Server silently found 0 matching rows instead of throwing an error.

NVR and poe_switch worked because their PKs (`NVR_ID`, `SW_ID`) are `NVARCHAR(20)` — matching the inferred parameter type exactly.

**Fix:** Added a branch in `UpdateDeviceStatus` to explicitly set `SqlDbType.Int` for camera parameters:

```csharp
if (d.DeviceType == "camera")
    cmd.Parameters.Add("@id", System.Data.SqlDbType.Int).Value = int.Parse(d.DeviceId);
else
    cmd.Parameters.AddWithValue("@id", d.DeviceId);
```

**Lesson:** Never use `AddWithValue` when the column type is not `NVARCHAR`. Always use `cmd.Parameters.Add("@param", SqlDbType.XXX).Value = ...` for `INT`, `BIGINT`, `DATETIME2`, `BIT`, etc.

---

## Problem 5 — `System.IO.FileNotFoundException: System.Web.Cors` on startup

**Symptom:** App threw `FileNotFoundException` for `System.Web.Cors` immediately on startup after opening the solution.

**Root cause:** The solution was opened from the wrong file (`.sln` instead of `.slnx`). When the correct `.slnx` file was opened for the first time on this machine, the NuGet packages were not yet restored — the `packages` folder was empty.

**Fix:** Ran NuGet package restore in the Package Manager Console:

```
Update-Package -reinstall
```

This re-downloaded and reinstalled all packages listed in `packages.config`. The process required confirming publisher trust prompts (`A` = Always run, `R` = Run once) for Microsoft scripts. A non-critical warning about `packages.config` not being deletable appeared at the end — this can be ignored; all packages were restored successfully.

---

## Final Verification

After all fixes, confirmed working with the following checks:

| Check | Result |
|---|---|
| New rows in `ping_logs` every ~30 s | ✅ |
| Camera `status` updates (`unknown` → `offline`) | ✅ |
| Camera `fail_count` increments each cycle | ✅ |
| NVR / poe_switch `status` and `fail_count` update | ✅ |
| `last_seen` set on alive devices | ✅ (verified from earlier manual test) |
| `alert_logs` created after 3 consecutive failures | ✅ (8 rows, all device types) |
| `alert_logs` contain location data (site/building/floor/room) | ✅ |
| Open alerts resolved when device comes back online | ✅ (logic verified in code) |
