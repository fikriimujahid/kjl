<#
.SYNOPSIS
  Upload a scan artifact to DefectDojo (API v2) using environment variables.

.DESCRIPTION
  This is a thin wrapper around `security/scripts/defectdojo-uploader.ps1`.

  Why this exists:
  - CI workflows may run scanners directly (e.g., GitHub Actions) rather than
    via `scan-all.ps1`. This wrapper provides a consistent, auditable way to
    upload existing scan output files to DefectDojo without changing scanners.

  Security / IM8:
  - Uses env vars for DefectDojo URL/token (no hardcoded secrets)
  - Best-effort: logs failures and exits 0 unless `-FailOnUploadError` is set

.PARAMETER ScanType
  DefectDojo scan type string (must match a supported parser).
  Supported by this repo:
  - OWASP ZAP Scan
  - Trivy Scan
  - Dependency Check Scan

.PARAMETER FilePath
  Path to the scan output file to upload.

.PARAMETER TestTitle
  DefectDojo Test title. Use stable titles (e.g., quarterly) for idempotency.

.PARAMETER FailOnUploadError
  Optional: If set, exits with code 1 when upload fails (default is non-breaking).
#>

param(
    [Parameter(Mandatory=$true)]
    [ValidateSet('OWASP ZAP Scan','Trivy Scan','Dependency Check Scan')]
    [string]$ScanType,

    [Parameter(Mandatory=$true)]
    [string]$FilePath,

    [Parameter(Mandatory=$true)]
    [string]$TestTitle,

    [switch]$FailOnUploadError
)

$ErrorActionPreference = 'Continue'

try {
    . (Join-Path $PSScriptRoot 'defectdojo-uploader.ps1')
} catch {
    Write-Warning "[DefectDojo] Uploader module not loaded; cannot upload. Details: $_"
    if ($FailOnUploadError.IsPresent) { exit 1 }
    exit 0
}

$result = Invoke-DefectDojoUpload -ScanType $ScanType -FilePath $FilePath -TestTitle $TestTitle

if (-not $result.Uploaded -and -not $result.Skipped -and $FailOnUploadError.IsPresent) {
    exit 1
}

exit 0
