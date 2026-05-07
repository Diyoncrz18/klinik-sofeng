param(
  [switch] $NoStart
)

$ErrorActionPreference = "Stop"

$frontendDir = Split-Path -Parent $PSScriptRoot
$workspaceRoot = Split-Path -Parent $frontendDir
$backendDir = Join-Path $workspaceRoot "backend-klinik-sofeng"
$backendEnvPath = Join-Path $backendDir ".env"
$frontendEnvPath = Join-Path $frontendDir ".env.local"

function Get-LanIp {
  $ip = Get-NetIPConfiguration |
    Where-Object { $_.IPv4DefaultGateway -and $_.IPv4Address } |
    ForEach-Object {
      $_.IPv4Address |
        Where-Object { $_.IPAddress -notlike "169.254*" -and $_.IPAddress -ne "127.0.0.1" } |
        Select-Object -First 1
    } |
    Select-Object -First 1

  if (-not $ip) {
    $ip = Get-NetIPAddress -AddressFamily IPv4 |
      Where-Object { $_.IPAddress -notlike "169.254*" -and $_.IPAddress -ne "127.0.0.1" } |
      Select-Object -First 1
  }

  if (-not $ip) {
    throw "Tidak bisa menemukan IP WiFi/LAN aktif."
  }

  return $ip.IPAddress
}

function Set-EnvLine {
  param(
    [string] $Path,
    [string] $Key,
    [string] $Value
  )

  $line = "$Key=$Value"
  if (Test-Path $Path) {
    $content = Get-Content -Raw -Path $Path
    if ($content -match "(?m)^$([regex]::Escape($Key))=.*$") {
      $content = $content -replace "(?m)^$([regex]::Escape($Key))=.*$", $line
    } else {
      $content = $content.TrimEnd() + [Environment]::NewLine + $line + [Environment]::NewLine
    }
  } else {
    $content = $line + [Environment]::NewLine
  }

  Set-Content -Path $Path -Value $content -NoNewline
}

function Test-PortListening {
  param([int] $Port)
  return @(Get-NetTCPConnection -State Listen -LocalPort $Port -ErrorAction SilentlyContinue).Count -gt 0
}

function Start-DevServer {
  param(
    [string] $Name,
    [string] $Directory,
    [string] $NpmScript,
    [string] $LogPath,
    [int] $Port
  )

  if (Test-PortListening -Port $Port) {
    Write-Host "$Name sudah aktif di port $Port."
    return
  }

  Start-Process `
    -FilePath "cmd.exe" `
    -WindowStyle Hidden `
    -WorkingDirectory $Directory `
    -ArgumentList "/c npm run $NpmScript > `"$LogPath`" 2>&1" | Out-Null

  Write-Host "$Name sedang dinyalakan. Log: $LogPath"
}

if (-not (Test-Path $backendDir)) {
  throw "Folder backend tidak ditemukan: $backendDir"
}

$lanIp = Get-LanIp
$frontendUrl = "http://$lanIp`:3000"
$backendUrl = "http://$lanIp`:4000"
$backendLog = Join-Path $workspaceRoot "backend-lan.log"
$frontendLog = Join-Path $workspaceRoot "frontend-lan.log"

Set-EnvLine -Path $backendEnvPath -Key "ALLOWED_ORIGINS" -Value "http://localhost:3000,http://127.0.0.1:3000,$frontendUrl"
Set-EnvLine -Path $frontendEnvPath -Key "NEXT_PUBLIC_API_BASE_URL" -Value "$backendUrl/api"

Write-Host "Konfigurasi LAN diperbarui."
Write-Host "Frontend HP : $frontendUrl"
Write-Host "Backend API : $backendUrl/api"
Write-Host ""

if ($NoStart) {
  Write-Host "Jalankan di dua terminal:"
  Write-Host "  cd `"$backendDir`"; npm run dev:lan"
  Write-Host "  cd `"$frontendDir`"; npm run dev:lan"
  exit 0
}

Start-DevServer -Name "Backend" -Directory $backendDir -NpmScript "dev:lan" -LogPath $backendLog -Port 4000
Start-DevServer -Name "Frontend" -Directory $frontendDir -NpmScript "dev:lan" -LogPath $frontendLog -Port 3000

Write-Host ""
Write-Host "Buka dari HP: $frontendUrl"
