<#
================================================================================
DefectDojo Upload Integration (API v2)
================================================================================
Why DefectDojo?
- DefectDojo is used as the central Vulnerability Management System (VMS) to
  consolidate findings from multiple scanners (DAST/SCA/etc.) into a single,
  auditable source of truth.

How this satisfies IM8 Vulnerability Assessment expectations:
- Centralized evidence retention: scan artifacts are imported into a VMS with a
  consistent taxonomy (Product -> Engagement -> Test).
- Repeatability / auditability: consistent test titles and re-import behavior
  reduces duplication and supports quarterly VA tracking.
- Non-disruptive: uploads are best-effort; scan execution and artifact creation
  remain unchanged even if DefectDojo is unavailable.

Authentication
- Uses an API token provided via environment variable (no hardcoded secrets).

Required environment variables:
- DEFECTDOJO_URL
- DEFECTDOJO_API_KEY
- DEFECTDOJO_PRODUCT_ID
- DEFECTDOJO_ENGAGEMENT_ID

Usage (from PowerShell scripts):
- . "$PSScriptRoot\defectdojo-uploader.ps1"
- Invoke-DefectDojoUpload -ScanType "OWASP ZAP Scan" -FilePath "..." -TestTitle "IM8 VA - ZAP Frontend"

Notes
- Prefers idempotent imports where possible by re-importing into an existing
  DefectDojo Test with a stable title.
- If re-import is not supported by the DefectDojo instance, falls back to import.
================================================================================
#>

function Write-DefectDojoLog {
    param(
        [Parameter(Mandatory=$true)][ValidateSet('INFO','WARN','ERROR','SUCCESS','SKIP')][string]$Level,
        [Parameter(Mandatory=$true)][string]$Message
    )

    $prefix = "[DefectDojo][$Level]"
    switch ($Level) {
        'SUCCESS' { Write-Host "$prefix $Message" -ForegroundColor Green }
        'ERROR'   { Write-Host "$prefix $Message" -ForegroundColor Red }
        'WARN'    { Write-Host "$prefix $Message" -ForegroundColor Yellow }
        'SKIP'    { Write-Host "$prefix $Message" -ForegroundColor DarkYellow }
        default   { Write-Host "$prefix $Message" -ForegroundColor Gray }
    }
}

function Get-DefectDojoConfig {
    # Env vars are used to keep DefectDojo internal and to avoid hardcoding secrets.
    $cfg = [ordered]@{
        Url          = $env:DEFECTDOJO_URL
        ApiKey       = $env:DEFECTDOJO_API_KEY
        ProductId    = $env:DEFECTDOJO_PRODUCT_ID
        EngagementId = $env:DEFECTDOJO_ENGAGEMENT_ID
    }

    $missing = @()
    foreach ($k in $cfg.Keys) {
        if ([string]::IsNullOrWhiteSpace([string]$cfg[$k])) { $missing += $k }
    }

    if ($missing.Count -gt 0) {
        return [pscustomobject]@{
            IsConfigured = $false
            Missing      = $missing
            Url          = $cfg.Url
            ApiKey       = $null
            ProductId    = $cfg.ProductId
            EngagementId = $cfg.EngagementId
        }
    }

    $url = [string]$cfg.Url
    $url = $url.TrimEnd('/')

    return [pscustomobject]@{
        IsConfigured = $true
        Url          = $url
        ApiKey       = [string]$cfg.ApiKey
        ProductId    = [int]$cfg.ProductId
        EngagementId = [int]$cfg.EngagementId
        ApiBase      = "$url/api/v2"
    }
}

function Ensure-SystemNetHttpLoaded {
    # Windows PowerShell may not auto-load System.Net.Http until first use.
    # DefectDojo uploads rely on HttpClient + multipart form data.
    try {
        Add-Type -AssemblyName 'System.Net.Http' -ErrorAction Stop
        return $true
    } catch {
        Write-DefectDojoLog -Level 'ERROR' -Message "Failed to load System.Net.Http assembly. Uploads will fail. Details: $_"
        return $false
    }
}

function New-DefectDojoHttpClient {
    param(
        [Parameter(Mandatory=$true)][string]$ApiKey,
        [Parameter(Mandatory=$true)][int]$TimeoutSeconds
    )

    # Using HttpClient for consistent multipart upload behavior across
    # Windows PowerShell 5.1 and PowerShell 7+.
    if (-not (Ensure-SystemNetHttpLoaded)) {
        throw "System.Net.Http assembly not available"
    }
    $handler = New-Object System.Net.Http.HttpClientHandler
    $client = New-Object System.Net.Http.HttpClient($handler)
    $client.Timeout = [TimeSpan]::FromSeconds($TimeoutSeconds)

    # DefectDojo v2 token auth header:
    #   Authorization: Token <api_key>
    $client.DefaultRequestHeaders.Remove('Authorization') | Out-Null
    $client.DefaultRequestHeaders.Add('Authorization', "Token $ApiKey")
    $client.DefaultRequestHeaders.Accept.Clear()
    $client.DefaultRequestHeaders.Accept.Add((New-Object System.Net.Http.Headers.MediaTypeWithQualityHeaderValue('application/json')))

    return $client
}

function Invoke-DefectDojoJson {
    param(
        [Parameter(Mandatory=$true)][string]$Method,
        [Parameter(Mandatory=$true)][string]$Url,
        [Parameter(Mandatory=$true)][string]$ApiKey,
        [Parameter(Mandatory=$false)][int]$TimeoutSeconds = 30
    )

    try {
        $client = New-DefectDojoHttpClient -ApiKey $ApiKey -TimeoutSeconds $TimeoutSeconds
        try {
            $request = New-Object System.Net.Http.HttpRequestMessage([System.Net.Http.HttpMethod]::$Method, $Url)
            $response = $client.SendAsync($request).GetAwaiter().GetResult()
            $body = $response.Content.ReadAsStringAsync().GetAwaiter().GetResult()

            if (-not $response.IsSuccessStatusCode) {
                return [pscustomobject]@{
                    Ok = $false
                    StatusCode = [int]$response.StatusCode
                    Body = $body
                }
            }

            if ([string]::IsNullOrWhiteSpace($body)) {
                return [pscustomobject]@{ Ok = $true; StatusCode = [int]$response.StatusCode; Json = $null }
            }

            return [pscustomobject]@{
                Ok = $true
                StatusCode = [int]$response.StatusCode
                Json = ($body | ConvertFrom-Json)
            }
        } finally {
            $client.Dispose()
        }
    } catch {
        return [pscustomobject]@{
            Ok = $false
            StatusCode = 0
            Body = "$_"
        }
    }
}

function Invoke-DefectDojoMultipart {
    param(
        [Parameter(Mandatory=$true)][string]$Url,
        [Parameter(Mandatory=$true)][string]$ApiKey,
        [Parameter(Mandatory=$true)][hashtable]$Fields,
        [Parameter(Mandatory=$true)][string]$FilePath,
        [Parameter(Mandatory=$true)][string]$FileFormFieldName,
        [Parameter(Mandatory=$false)][string]$FileName,
        [Parameter(Mandatory=$false)][int]$TimeoutSeconds = 60
    )

    try {
        if (-not (Test-Path $FilePath)) {
            return [pscustomobject]@{ Ok = $false; StatusCode = 0; Body = "File not found: $FilePath" }
        }

        $client = New-DefectDojoHttpClient -ApiKey $ApiKey -TimeoutSeconds $TimeoutSeconds
        try {
            $multi = New-Object System.Net.Http.MultipartFormDataContent

            foreach ($k in $Fields.Keys) {
                $val = [string]$Fields[$k]
                if (-not [string]::IsNullOrWhiteSpace($val)) {
                    $multi.Add((New-Object System.Net.Http.StringContent($val)), $k)
                }
            }

            $fs = [System.IO.File]::OpenRead($FilePath)
            try {
                $streamContent = New-Object System.Net.Http.StreamContent($fs)
                # Let DefectDojo infer parser by scan_type; content-type is best-effort.
                $streamContent.Headers.ContentType = New-Object System.Net.Http.Headers.MediaTypeHeaderValue('application/octet-stream')
                $fn = if ($FileName) { $FileName } else { [System.IO.Path]::GetFileName($FilePath) }
                $multi.Add($streamContent, $FileFormFieldName, $fn)

                $response = $client.PostAsync($Url, $multi).GetAwaiter().GetResult()
                $body = $response.Content.ReadAsStringAsync().GetAwaiter().GetResult()

                return [pscustomobject]@{
                    Ok = $response.IsSuccessStatusCode
                    StatusCode = [int]$response.StatusCode
                    Body = $body
                }
            } finally {
                $fs.Dispose()
            }
        } finally {
            $client.Dispose()
        }
    } catch {
        return [pscustomobject]@{ Ok = $false; StatusCode = 0; Body = "$_" }
    }
}

function Get-DefectDojoTestByTitle {
    param(
        [Parameter(Mandatory=$true)][pscustomobject]$Config,
        [Parameter(Mandatory=$true)][string]$TestTitle
    )

    # How this API call works:
    # - We search for an existing Test within the Engagement by title.
    # - This enables stable "re-import" into the same Test across reruns.
    $encodedTitle = [uri]::EscapeDataString($TestTitle)
    $url = "$($Config.ApiBase)/tests/?engagement=$($Config.EngagementId)&title=$encodedTitle&limit=1"

    $res = Invoke-DefectDojoJson -Method 'Get' -Url $url -ApiKey $Config.ApiKey -TimeoutSeconds 30
    if (-not $res.Ok -or -not $res.Json) { return $null }

    if ($res.Json.results -and $res.Json.results.Count -gt 0) {
        return $res.Json.results[0]
    }

    return $null
}

$script:DefectDojoEngagementValidated = $false
$script:DefectDojoEngagementValid = $true

function Test-DefectDojoEngagementMapping {
    param(
        [Parameter(Mandatory=$true)][pscustomobject]$Config
    )

    if ($script:DefectDojoEngagementValidated) {
        return $script:DefectDojoEngagementValid
    }

    # How this API call works:
    # - GET /engagements/<id>/ returns the engagement details including its product.
    # - We validate the configured engagement belongs to the configured product to
    #   ensure scans map to Product -> Engagement -> Test as expected for IM8.
    $url = "$($Config.ApiBase)/engagements/$($Config.EngagementId)/"
    $res = Invoke-DefectDojoJson -Method 'Get' -Url $url -ApiKey $Config.ApiKey -TimeoutSeconds 30

    $script:DefectDojoEngagementValidated = $true
    if (-not $res.Ok -or -not $res.Json) {
        # If DefectDojo is unreachable, do not break; allow upload attempts to proceed.
        $script:DefectDojoEngagementValid = $true
        Write-DefectDojoLog -Level 'WARN' -Message "Could not validate engagement/product mapping (continuing best-effort)."
        return $true
    }

    $actualProductId = $res.Json.product
    if ([int]$actualProductId -ne [int]$Config.ProductId) {
        $script:DefectDojoEngagementValid = $false
        Write-DefectDojoLog -Level 'WARN' -Message "Configured engagement $($Config.EngagementId) belongs to product $actualProductId, expected $($Config.ProductId). Skipping uploads to avoid mis-attribution."
        return $false
    }

    $script:DefectDojoEngagementValid = $true
    return $true
}

function Invoke-DefectDojoUpload {
    [CmdletBinding()]
    param(
        # Must match DefectDojo's scan type strings exactly.
        [Parameter(Mandatory=$true)][ValidateSet('OWASP ZAP Scan','Trivy Scan','Dependency Check Scan')][string]$ScanType,
        [Parameter(Mandatory=$true)][string]$FilePath,
        [Parameter(Mandatory=$true)][string]$TestTitle,
        [Parameter(Mandatory=$false)][switch]$CloseOldFindings,
        [Parameter(Mandatory=$false)][int]$TimeoutSeconds = 60
    )

    $cfg = Get-DefectDojoConfig
    if (-not $cfg.IsConfigured) {
        Write-DefectDojoLog -Level 'SKIP' -Message ("Not configured; missing env vars: {0}" -f ($cfg.Missing -join ', '))
        return [pscustomobject]@{ Uploaded = $false; Skipped = $true; Reason = 'NotConfigured' }
    }

    if (-not (Test-DefectDojoEngagementMapping -Config $cfg)) {
        return [pscustomobject]@{ Uploaded = $false; Skipped = $true; Reason = 'ProductMismatch' }
    }

    if (-not (Test-Path $FilePath)) {
        Write-DefectDojoLog -Level 'SKIP' -Message "Scan output not found; skipping upload: $FilePath"
        return [pscustomobject]@{ Uploaded = $false; Skipped = $true; Reason = 'FileMissing' }
    }

    # 1) Attempt to locate an existing Test to enable re-import (idempotency).
    $existingTest = $null
    try {
        $existingTest = Get-DefectDojoTestByTitle -Config $cfg -TestTitle $TestTitle
    } catch {
        # Non-fatal; we'll fall back to import-scan.
        Write-DefectDojoLog -Level 'WARN' -Message "Unable to query tests (will attempt import): $_"
    }

    # 2) Prefer reimport-scan when a test exists. This is the most reliable way
    #    to avoid duplicate findings on reruns.
    if ($existingTest -and $existingTest.id) {
        $reimportUrl = "$($cfg.ApiBase)/reimport-scan/"
        $fields = @{
            test = [string]$existingTest.id
            scan_type = $ScanType
            close_old_findings = if ($CloseOldFindings.IsPresent) { 'true' } else { 'false' }
            # Setting these can influence deduplication behavior depending on instance configuration.
            active = 'true'
            verified = 'false'
        }

        Write-DefectDojoLog -Level 'INFO' -Message "Re-importing '$ScanType' into existing Test '$TestTitle' (id=$($existingTest.id))"
        $res = Invoke-DefectDojoMultipart -Url $reimportUrl -ApiKey $cfg.ApiKey -Fields $fields -FilePath $FilePath -FileFormFieldName 'file' -TimeoutSeconds $TimeoutSeconds

        if ($res.Ok) {
            Write-DefectDojoLog -Level 'SUCCESS' -Message "Upload OK (reimport-scan): $ScanType -> $TestTitle"
            return [pscustomobject]@{ Uploaded = $true; Skipped = $false; Mode = 'reimport-scan'; StatusCode = $res.StatusCode }
        }

        # Graceful fallback: if reimport isn't supported or fails, try import-scan.
        Write-DefectDojoLog -Level 'WARN' -Message "Re-import failed (status=$($res.StatusCode)). Will try import-scan. Details: $($res.Body)"
    }

    # 3) import-scan: imports into an engagement. If the Test doesn't exist,
    #    DefectDojo will create it using test_title.
    $importUrl = "$($cfg.ApiBase)/import-scan/"
    $importFields = @{
        engagement = [string]$cfg.EngagementId
        scan_type  = $ScanType
        test_title = $TestTitle
        active     = 'true'
        verified   = 'false'
    }

    Write-DefectDojoLog -Level 'INFO' -Message "Importing '$ScanType' into Engagement $($cfg.EngagementId) as Test '$TestTitle'"
    $importRes = Invoke-DefectDojoMultipart -Url $importUrl -ApiKey $cfg.ApiKey -Fields $importFields -FilePath $FilePath -FileFormFieldName 'file' -TimeoutSeconds $TimeoutSeconds

    if ($importRes.Ok) {
        Write-DefectDojoLog -Level 'SUCCESS' -Message "Upload OK (import-scan): $ScanType -> $TestTitle"
        return [pscustomobject]@{ Uploaded = $true; Skipped = $false; Mode = 'import-scan'; StatusCode = $importRes.StatusCode }
    }

    # Fail gracefully: do NOT throw; do NOT break pipeline.
    Write-DefectDojoLog -Level 'ERROR' -Message "Upload failed (status=$($importRes.StatusCode)) for $ScanType. Details: $($importRes.Body)"
    return [pscustomobject]@{ Uploaded = $false; Skipped = $false; Mode = 'import-scan'; StatusCode = $importRes.StatusCode; Error = $importRes.Body }
}
