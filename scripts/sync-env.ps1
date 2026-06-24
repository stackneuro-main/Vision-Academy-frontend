$ErrorActionPreference = "Stop"

$frontendRoot = Split-Path -Parent $PSScriptRoot
$envPath = Join-Path $frontendRoot ".env"
$outputPath = Join-Path $frontendRoot "js\runtime-config.js"

if (-not (Test-Path -LiteralPath $envPath)) {
    throw "Frontend environment file was not found: $envPath"
}

$values = @{}
foreach ($line in Get-Content -LiteralPath $envPath) {
    $trimmed = $line.Trim()
    if (-not $trimmed -or $trimmed.StartsWith("#")) {
        continue
    }

    $separator = $trimmed.IndexOf("=")
    if ($separator -lt 1) {
        continue
    }

    $key = $trimmed.Substring(0, $separator).Trim()
    $value = $trimmed.Substring($separator + 1).Trim().Trim('"').Trim("'")
    $values[$key] = $value
}

$required = @(
    "BACKEND_URL",
    "ADMIN_TOKEN_STORAGE_KEY",
    "APP_NAME",
    "APP_ENV"
)

$missing = $required | Where-Object { -not $values.ContainsKey($_) -or -not $values[$_] }
if ($missing) {
    throw "Missing frontend environment values: $($missing -join ', ')"
}

function ConvertTo-JavaScriptString([string]$value) {
    return ($value | ConvertTo-Json -Compress)
}

$content = @"
// Generated from frontend/.env by frontend/scripts/sync-env.ps1.
// Do not store secrets in this browser-readable file.
window.__VISION_ENV__ = Object.freeze({
  BACKEND_URL: $(ConvertTo-JavaScriptString $values["BACKEND_URL"]),
  ADMIN_TOKEN_STORAGE_KEY: $(ConvertTo-JavaScriptString $values["ADMIN_TOKEN_STORAGE_KEY"]),
  APP_NAME: $(ConvertTo-JavaScriptString $values["APP_NAME"]),
  APP_ENV: $(ConvertTo-JavaScriptString $values["APP_ENV"])
});
"@

Set-Content -LiteralPath $outputPath -Value $content -Encoding utf8
Write-Output "Generated $outputPath from $envPath"
