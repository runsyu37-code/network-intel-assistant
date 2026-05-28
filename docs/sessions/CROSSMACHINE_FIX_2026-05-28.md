# Cross-Machine Assembly Mismatch — Troubleshooting Log (2026-05-28)

## Root Cause

Working on the home PC caused NuGet to auto-upgrade `Microsoft.Web.Infrastructure`
from `1.0.0.0` → `2.0.0`. Visual Studio silently updated `packages.config` and
`.csproj` to match, and those changes were committed and pushed to the `backend` branch.

When pulled on the work notebook:
- `packages.config` + `.csproj` now referenced **new** versions
- `bin/` still had **old** DLLs (or NuGet restored the new package but other assemblies
  still expected the old version)
- Result: `HRESULT 0x80131040` (FUSION_E_REF_DEF_MISMATCH) on startup

---

## Problems Encountered (in order)

### 1. `Microsoft.Web.Infrastructure` version mismatch
| | Value |
|---|---|
| Error | `Could not load file or assembly 'Microsoft.Web.Infrastructure, Version=1.0.0.0'` |
| Expected by | `System.Web.WebPages`, `System.Web.Mvc` (compiled against 1.0.0.0) |
| Found in bin | `2.0.34876.0` (NuGet package 2.0.0) |
| Root cause | Home PC NuGet auto-upgraded package; `.csproj` HintPath updated to 2.0.0 |

**Fix:**
- `packages.config`: `version="2.0.0"` → `version="1.0.0.0"`
- `.csproj`: updated `<Reference>` version and `<HintPath>` to point at `packages\Microsoft.Web.Infrastructure.1.0.0.0\`
- Package `1.0.0.0` was already present in `packages/` folder — no restore needed

---

### 2. `Web.config` — "A document must contain exactly one root element"
| | Value |
|---|---|
| Error | Visual Studio dialog: "Error parsing the web configuration file at line 1" |
| Cause | `Web.config` was tracked in git (should be gitignored), deleted by the pull, leaving an empty/missing file |

**Fix:**
```powershell
Copy-Item "C:\ai-playground\API\BNO_Survei_MonitorAPI\BNO_Survei_MonitorAPI\Web.config.template" `
          "C:\ai-playground\API\BNO_Survei_MonitorAPI\BNO_Survei_MonitorAPI\Web.config" -Force
```
Then fill in `JwtSecret` and verify `connectionStrings.config` exists.

---

### 3. `System.Web.Http` version mismatch
| | Value |
|---|---|
| Error | `Could not load file or assembly 'System.Web.Http, Version=4.0.0.0'` |
| Expected by | `Swashbuckle.Core 1.0.0.0` (compiled against Web API 4.x) |
| Found in bin | `5.2.9.0` |
| Cause | Web.config copied from template — **missing binding redirects** that NuGet normally auto-generates |

**Fix:** Added `<runtime><assemblyBinding>` section to `Web.config` (see section below).

---

### 4. `WebGrease` version mismatch
| | Value |
|---|---|
| Error | `Could not load file or assembly 'WebGrease, Version=1.5.1.25624'` |
| Found in bin | `1.6.5135.21930` |

**Fix:** Added binding redirect for WebGrease.

---

### 5. `System.Memory` version mismatch
| | Value |
|---|---|
| Error | `Could not load file or assembly 'System.Memory, Version=4.0.1.1'` |
| Found in bin | `4.0.1.2` |
| Expected by | `BCrypt.Net-Next` (dependency chain) |

**Fix:** Added binding redirects for `System.Memory`, `System.Numerics.Vectors`,
`System.Runtime.CompilerServices.Unsafe`.

---

### 6. Line ending warning (non-critical)
Visual Studio prompted about inconsistent line endings in `buildingsController.cs`.
Caused by the file being edited on a non-Windows machine and committed with LF endings.
**Fix:** Click **Yes** in the VS dialog to normalize to Windows CR LF.

---

## Full Binding Redirects Added to Web.config

These must exist in Web.config after every fresh copy from template:

```xml
<runtime>
  <assemblyBinding xmlns="urn:schemas-microsoft-com:asm.v1">
    <!-- Web API -->
    <dependentAssembly>
      <assemblyIdentity name="System.Web.Http" publicKeyToken="31bf3856ad364e35" culture="neutral" />
      <bindingRedirect oldVersion="0.0.0.0-5.2.9.0" newVersion="5.2.9.0" />
    </dependentAssembly>
    <dependentAssembly>
      <assemblyIdentity name="System.Net.Http.Formatting" publicKeyToken="31bf3856ad364e35" culture="neutral" />
      <bindingRedirect oldVersion="0.0.0.0-5.2.9.0" newVersion="5.2.9.0" />
    </dependentAssembly>
    <dependentAssembly>
      <assemblyIdentity name="System.Web.Http.WebHost" publicKeyToken="31bf3856ad364e35" culture="neutral" />
      <bindingRedirect oldVersion="0.0.0.0-5.2.9.0" newVersion="5.2.9.0" />
    </dependentAssembly>
    <dependentAssembly>
      <assemblyIdentity name="System.Web.Http.Cors" publicKeyToken="31bf3856ad364e35" culture="neutral" />
      <bindingRedirect oldVersion="0.0.0.0-5.2.9.0" newVersion="5.2.9.0" />
    </dependentAssembly>
    <dependentAssembly>
      <assemblyIdentity name="System.Web.Cors" publicKeyToken="31bf3856ad364e35" culture="neutral" />
      <bindingRedirect oldVersion="0.0.0.0-5.2.9.0" newVersion="5.2.9.0" />
    </dependentAssembly>
    <!-- MVC / Razor / WebPages -->
    <dependentAssembly>
      <assemblyIdentity name="System.Web.Mvc" publicKeyToken="31bf3856ad364e35" culture="neutral" />
      <bindingRedirect oldVersion="0.0.0.0-5.2.9.0" newVersion="5.2.9.0" />
    </dependentAssembly>
    <dependentAssembly>
      <assemblyIdentity name="System.Web.Helpers" publicKeyToken="31bf3856ad364e35" culture="neutral" />
      <bindingRedirect oldVersion="0.0.0.0-3.0.0.0" newVersion="3.0.0.0" />
    </dependentAssembly>
    <dependentAssembly>
      <assemblyIdentity name="System.Web.WebPages" publicKeyToken="31bf3856ad364e35" culture="neutral" />
      <bindingRedirect oldVersion="0.0.0.0-3.0.0.0" newVersion="3.0.0.0" />
    </dependentAssembly>
    <dependentAssembly>
      <assemblyIdentity name="System.Web.WebPages.Deployment" publicKeyToken="31bf3856ad364e35" culture="neutral" />
      <bindingRedirect oldVersion="0.0.0.0-3.0.0.0" newVersion="3.0.0.0" />
    </dependentAssembly>
    <dependentAssembly>
      <assemblyIdentity name="System.Web.WebPages.Razor" publicKeyToken="31bf3856ad364e35" culture="neutral" />
      <bindingRedirect oldVersion="0.0.0.0-3.0.0.0" newVersion="3.0.0.0" />
    </dependentAssembly>
    <dependentAssembly>
      <assemblyIdentity name="System.Web.Razor" publicKeyToken="31bf3856ad364e35" culture="neutral" />
      <bindingRedirect oldVersion="0.0.0.0-3.0.0.0" newVersion="3.0.0.0" />
    </dependentAssembly>
    <!-- Optimization / WebGrease -->
    <dependentAssembly>
      <assemblyIdentity name="System.Web.Optimization" publicKeyToken="31bf3856ad364e35" culture="neutral" />
      <bindingRedirect oldVersion="0.0.0.0-1.1.0.0" newVersion="1.1.0.0" />
    </dependentAssembly>
    <dependentAssembly>
      <assemblyIdentity name="WebGrease" publicKeyToken="31bf3856ad364e35" culture="neutral" />
      <bindingRedirect oldVersion="0.0.0.0-1.6.5135.21930" newVersion="1.6.5135.21930" />
    </dependentAssembly>
    <!-- JSON -->
    <dependentAssembly>
      <assemblyIdentity name="Newtonsoft.Json" publicKeyToken="30ad4fe6b2a6aeed" culture="neutral" />
      <bindingRedirect oldVersion="0.0.0.0-13.0.0.0" newVersion="13.0.0.0" />
    </dependentAssembly>
    <!-- Runtime primitives -->
    <dependentAssembly>
      <assemblyIdentity name="System.Memory" publicKeyToken="cc7b13ffcd2ddd51" culture="neutral" />
      <bindingRedirect oldVersion="0.0.0.0-4.0.1.2" newVersion="4.0.1.2" />
    </dependentAssembly>
    <dependentAssembly>
      <assemblyIdentity name="System.Numerics.Vectors" publicKeyToken="b03f5f7f11d50a3a" culture="neutral" />
      <bindingRedirect oldVersion="0.0.0.0-4.1.4.0" newVersion="4.1.4.0" />
    </dependentAssembly>
    <dependentAssembly>
      <assemblyIdentity name="System.Runtime.CompilerServices.Unsafe" publicKeyToken="b03f5f7f11d50a3a" culture="neutral" />
      <bindingRedirect oldVersion="0.0.0.0-6.0.0.0" newVersion="6.0.0.0" />
    </dependentAssembly>
  </assemblyBinding>
</runtime>
```

---

## Prevention — What to Do

### ทำทันที (แก้ได้เลย)

**1. เพิ่ม binding redirects เข้า `Web.config.template`**
ย้าย `<runtime>` block ทั้งหมดข้างบนเข้าไปใน `Web.config.template` เพื่อให้ทุกครั้งที่ copy template ออกมาจะได้ redirects ครบทันที ไม่ต้องเพิ่มทีหลังอีก

**2. ตรวจสอบก่อน commit ทุกครั้ง**
ก่อน `git add` บน home PC ให้รัน:
```powershell
git diff packages.config
git diff *.csproj
```
ถ้าเห็น version ของ package เปลี่ยน โดยที่ไม่ได้ตั้งใจ upgrade → **อย่า commit**

### ทำในอนาคต (ถ้ามีเวลา)

**3. Lock NuGet package versions**
เพิ่มไฟล์ `NuGet.config` ใน solution root เพื่อปิด auto-upgrade:
```xml
<configuration>
  <config>
    <add key="dependencyVersion" value="Lowest" />
  </config>
</configuration>
```

**4. ย้าย binding redirects เข้า template**
ดู Prevention ข้อ 1 — ทำให้ Web.config.template เป็น "copy แล้วใช้ได้เลย" โดยไม่ต้องเพิ่มอะไรเพิ่มเติม

---

## Quick Reference — Decode Error Code

เจอ `HRESULT: 0x80131040` บน DLL ใดก็ตาม → **version mismatch**

```
1. เช็ค version จริงใน bin:
   [Reflection.AssemblyName]::GetAssemblyName("bin\Foo.dll").Version

2. เพิ่ม binding redirect ใน Web.config:
   <dependentAssembly>
     <assemblyIdentity name="Foo" publicKeyToken="..." culture="neutral" />
     <bindingRedirect oldVersion="0.0.0.0-X.X.X.X" newVersion="X.X.X.X" />
   </dependentAssembly>

3. Ctrl+F5 — ไม่ต้อง rebuild
```

PublicKeyToken สำคัญ ต้องตรงกับ DLL จริง ดูได้จาก error message หรือ AssemblyName.GetPublicKeyToken()
