param(
    [string]$Target = "backend/auth-service",
    [string]$OutputPath
)

$ErrorActionPreference = "Stop"

function New-TreeNode {
    param(
        [bool]$IsFile = $false
    )

    return [pscustomobject]@{
        IsFile = $IsFile
        Children = [ordered]@{}
    }
}

function Add-TreePath {
    param(
        [Parameter(Mandatory = $true)]$RootNode,
        [Parameter(Mandatory = $true)][string[]]$Parts
    )

    $current = $RootNode

    for ($index = 0; $index -lt $Parts.Length; $index++) {
        $part = $Parts[$index]
        $isLast = $index -eq ($Parts.Length - 1)

        if (-not $current.Children.Contains($part)) {
            $current.Children[$part] = New-TreeNode -IsFile:$isLast
        }

        if ($isLast) {
            $current.Children[$part].IsFile = $true
        }

        $current = $current.Children[$part]
    }
}

function Add-TreeLines {
    param(
        [Parameter(Mandatory = $true)]$Node,
        [Parameter(Mandatory = $false)][string]$Prefix,
        [Parameter(Mandatory = $true)][System.Collections.Generic.List[string]]$Lines
    )

    $names = @($Node.Children.Keys | Sort-Object)

    for ($index = 0; $index -lt $names.Count; $index++) {
        $name = $names[$index]
        $child = $Node.Children[$name]
        $isLast = $index -eq ($names.Count - 1)

        if ($isLast) {
            $Lines.Add($Prefix + '`-- ' + $name)
            $nextPrefix = $Prefix + '    '
        }
        else {
            $Lines.Add($Prefix + '|-- ' + $name)
            $nextPrefix = $Prefix + '|   '
        }

        if ($null -ne $child -and -not $child.IsFile) {
            Add-TreeLines -Node $child -Prefix $nextPrefix -Lines $Lines
        }
    }
}

$scriptDirectory = Split-Path -Parent $MyInvocation.MyCommand.Path
$repoRoot = [System.IO.Path]::GetFullPath((Join-Path $scriptDirectory ".."))
$normalizedTarget = $Target.Trim().TrimStart('.').TrimStart('/').TrimStart('\\').Replace('\\', '/')

if ([string]::IsNullOrWhiteSpace($normalizedTarget)) {
    throw "Target path cannot be empty."
}

$originalLocation = (Get-Location).Path
$git = (Get-Command git -ErrorAction Stop).Source

Push-Location $repoRoot
try {
    $gitPaths = & $git ls-files --cached --others --exclude-standard -- $normalizedTarget

    if ($LASTEXITCODE -ne 0) {
        throw "git ls-files failed for '$normalizedTarget'."
    }

    $rootNode = New-TreeNode

    foreach ($gitPath in ($gitPaths | Sort-Object)) {
        if (-not $gitPath.StartsWith("$normalizedTarget/")) {
            continue
        }

        $relativePath = $gitPath.Substring($normalizedTarget.Length + 1)

        if ([string]::IsNullOrWhiteSpace($relativePath)) {
            continue
        }

        Add-TreePath -RootNode $rootNode -Parts ($relativePath -split '/')
    }

    $lines = [System.Collections.Generic.List[string]]::new()
    $lines.Add($normalizedTarget)
    Add-TreeLines -Node $rootNode -Prefix "" -Lines $lines

    $treeOutput = $lines -join [Environment]::NewLine

    if ($OutputPath) {
        if ([System.IO.Path]::IsPathRooted($OutputPath)) {
            $resolvedOutputPath = $OutputPath
        }
        else {
            $resolvedOutputPath = [System.IO.Path]::GetFullPath((Join-Path $originalLocation $OutputPath))
        }

        $outputDirectory = Split-Path -Parent $resolvedOutputPath
        if ($outputDirectory -and -not (Test-Path $outputDirectory)) {
            New-Item -ItemType Directory -Path $outputDirectory -Force | Out-Null
        }

        Set-Content -Path $resolvedOutputPath -Value $treeOutput -Encoding utf8
    }

    $treeOutput
}
finally {
    Pop-Location
}
