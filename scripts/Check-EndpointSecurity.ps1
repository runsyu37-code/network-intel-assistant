#Requires -Version 5.1
<#
.SYNOPSIS
    Phase 13 security gate — verify every HTTP write endpoint is explicitly secured.

.DESCRIPTION
    Loads the compiled API DLL via reflection and inspects all public methods on
    ApiController subclasses that carry an HTTP verb attribute (POST/PUT/DELETE/PATCH).

    Each such method MUST have one of:
      [RequireRole(...)]   — our RBAC gate (BNO_Survei_MonitorAPI.Filters)
      [AllowAnonymous]     — explicit opt-out (only valid on auth endpoints)

    A controller-level [AllowAnonymous] also satisfies the check for all its methods
    (used on authController).

    Exit code 0 = all endpoints secured.
    Exit code 1 = one or more endpoints are missing a security attribute → fix before deploy.

.PARAMETER DllPath
    Path to the compiled BNO_Survei_MonitorAPI.dll.
    Defaults to the Debug build output; pass -DllPath for Release.

.EXAMPLE
    # Default (Debug build):
    .\scripts\Check-EndpointSecurity.ps1

    # Release build:
    .\scripts\Check-EndpointSecurity.ps1 -DllPath ".\BNO_Survei_MonitorAPI\BNO_Survei_MonitorAPI\bin\Release\BNO_Survei_MonitorAPI.dll"
#>

param(
    [string]$DllPath = ".\BNO_Survei_MonitorAPI\BNO_Survei_MonitorAPI\bin\BNO_Survei_MonitorAPI.dll"
)

Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

# ---------------------------------------------------------------------------
# 1. Locate and load the assembly
# ---------------------------------------------------------------------------
$resolved = Resolve-Path $DllPath -ErrorAction SilentlyContinue
if (-not $resolved) {
    Write-Host ""
    Write-Host "  ERROR: DLL not found at: $DllPath" -ForegroundColor Red
    Write-Host "  Build the project first (Ctrl+Shift+B in Visual Studio)." -ForegroundColor Yellow
    Write-Host ""
    exit 1
}

try {
    $assembly = [System.Reflection.Assembly]::LoadFrom($resolved.Path)
} catch {
    Write-Host ""
    Write-Host "  ERROR: Could not load assembly: $_" -ForegroundColor Red
    Write-Host ""
    exit 1
}

# ---------------------------------------------------------------------------
# 2. Attribute identification helpers
# ---------------------------------------------------------------------------
# HTTP verb attributes we care about (write operations only — GET is excluded)
$writeVerbFullNames = @(
    "System.Web.Http.HttpPostAttribute",
    "System.Web.Http.HttpPutAttribute",
    "System.Web.Http.HttpDeleteAttribute",
    "System.Web.Http.HttpPatchAttribute"
)

# Security attribute short names (namespace-independent matching)
$allowAnonShortName   = "AllowAnonymousAttribute"
$requireRoleShortName = "RequireRoleAttribute"

function Get-AttrsOfType([System.Reflection.MemberInfo]$member, [string[]]$shortNames) {
    $member.GetCustomAttributes($true) | Where-Object {
        $shortNames -contains $_.GetType().Name
    }
}

function Has-WriteVerb([System.Reflection.MethodInfo]$method) {
    $method.GetCustomAttributes($true) | Where-Object {
        $writeVerbFullNames -contains $_.GetType().FullName
    } | Select-Object -First 1
}

function Get-VerbName([System.Reflection.MethodInfo]$method) {
    $attr = $method.GetCustomAttributes($true) | Where-Object {
        $writeVerbFullNames -contains $_.GetType().FullName
    } | Select-Object -First 1
    if ($attr) { return $attr.GetType().Name -replace "Attribute$", "" }
    return "WRITE"
}

# ---------------------------------------------------------------------------
# 3. Find all ApiController subclasses
# ---------------------------------------------------------------------------
$apiControllerName = "System.Web.Http.ApiController"

$controllers = $assembly.GetTypes() | Where-Object {
    $_.IsClass -and
    -not $_.IsAbstract -and
    $_.IsPublic -and
    $_.BaseType -ne $null -and
    $_.BaseType.FullName -eq $apiControllerName
} | Sort-Object Name

if ($controllers.Count -eq 0) {
    Write-Host ""
    Write-Host "  WARNING: No ApiController subclasses found in the assembly." -ForegroundColor Yellow
    Write-Host "  Check that DllPath points to the correct build output." -ForegroundColor Yellow
    Write-Host ""
    exit 1
}

# ---------------------------------------------------------------------------
# 4. Inspect each controller and its write methods
# ---------------------------------------------------------------------------
$passItems = [System.Collections.Generic.List[string]]::new()
$failItems = [System.Collections.Generic.List[string]]::new()

$bindingFlags = [System.Reflection.BindingFlags]::Public -bor
                [System.Reflection.BindingFlags]::Instance -bor
                [System.Reflection.BindingFlags]::DeclaredOnly

foreach ($ctrl in $controllers) {

    # Controller-level security attributes
    $ctrlAllowAnon   = Get-AttrsOfType $ctrl @($allowAnonShortName)
    $ctrlRequireRole = Get-AttrsOfType $ctrl @($requireRoleShortName)

    $methods = $ctrl.GetMethods($bindingFlags)

    foreach ($method in $methods) {

        $verbAttr = Has-WriteVerb $method
        if (-not $verbAttr) { continue }   # skip GET / non-verb methods

        $verb  = Get-VerbName $method
        $label = "$($ctrl.Name).$($method.Name) [$verb]"

        $methodAllowAnon   = Get-AttrsOfType $method @($allowAnonShortName)
        $methodRequireRole = Get-AttrsOfType $method @($requireRoleShortName)

        $secured = $ctrlAllowAnon   -or   # class-level AllowAnonymous (authController)
                   $ctrlRequireRole -or   # class-level RequireRole (future use)
                   $methodAllowAnon -or   # method-level AllowAnonymous
                   $methodRequireRole     # method-level RequireRole (standard pattern)

        if ($secured) {
            $passItems.Add($label)
        } else {
            $failItems.Add($label)
        }
    }
}

# ---------------------------------------------------------------------------
# 5. Report
# ---------------------------------------------------------------------------
Write-Host ""
Write-Host "=======================================================" -ForegroundColor Cyan
Write-Host "  Phase 13 -- Endpoint Security Check" -ForegroundColor Cyan
Write-Host "  Assembly: $($assembly.GetName().Name) v$($assembly.GetName().Version)" -ForegroundColor Cyan
Write-Host "  Controllers found: $($controllers.Count)" -ForegroundColor Cyan
Write-Host "=======================================================" -ForegroundColor Cyan
Write-Host ""

if ($passItems.Count -gt 0) {
    Write-Host "--- PASS ($($passItems.Count)) ---" -ForegroundColor Green
    foreach ($item in $passItems) {
        Write-Host "  [PASS]  $item" -ForegroundColor Green
    }
    Write-Host ""
}

if ($failItems.Count -gt 0) {
    Write-Host "--- FAIL ($($failItems.Count)) ---" -ForegroundColor Red
    foreach ($item in $failItems) {
        Write-Host "  [FAIL]  $item" -ForegroundColor Red
    }
    Write-Host ""
    Write-Host "  ACTION: Add [RequireRole(...)] or [AllowAnonymous] to each FAIL above." -ForegroundColor Red
    Write-Host "  These endpoints are exposed to any authenticated user regardless of role." -ForegroundColor Red
    Write-Host ""
}

Write-Host "=======================================================" -ForegroundColor Cyan
$color = if ($failItems.Count -eq 0) { "Green" } else { "Red" }
$status = if ($failItems.Count -eq 0) { "ALL PASS -- all write endpoints are secured." } else { "FAILED -- $($failItems.Count) write endpoint(s) missing security attribute." }
Write-Host "  $status" -ForegroundColor $color
Write-Host "=======================================================" -ForegroundColor Cyan
Write-Host ""

if ($failItems.Count -gt 0) { exit 1 }
exit 0
