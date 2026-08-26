param(
  [Parameter(Mandatory=$true)][string]$ExePath,
  [Parameter(Mandatory=$true)][string]$Sha256SumsPath,
  [Parameter(Mandatory=$true)][string]$LegacyBackupPath,
  [Parameter(Mandatory=$true)][string]$EvidenceOut
)

$ErrorActionPreference = 'Stop'

if (-not $IsWindows) { throw 'This evidence helper must be run on Windows.' }
foreach ($p in @($ExePath,$Sha256SumsPath,$LegacyBackupPath)) {
  if (-not (Test-Path -LiteralPath $p -PathType Leaf)) { throw "Required file not found: $p" }
}

$exe = Get-Item -LiteralPath $ExePath
$exeHash = (Get-FileHash -LiteralPath $ExePath -Algorithm SHA256).Hash.ToLowerInvariant()
$sumLines = Get-Content -LiteralPath $Sha256SumsPath
$expected = $null
foreach ($line in $sumLines) {
  if ($line -match '^([0-9A-Fa-f]{64})\s+(.+)$') {
    $candidateName = [System.IO.Path]::GetFileName($matches[2].Trim())
    if ($candidateName -eq $exe.Name) {
      $expected = $matches[1].ToLowerInvariant()
      break
    }
  }
}
if (-not $expected) { throw "No SHA-256 entry for $($exe.Name) was found in $Sha256SumsPath" }
if ($exeHash -ne $expected) { throw "SHA-256 mismatch for $($exe.Name). Expected $expected, got $exeHash" }

$backup = Get-Item -LiteralPath $LegacyBackupPath
$backupHash = (Get-FileHash -LiteralPath $LegacyBackupPath -Algorithm SHA256).Hash.ToLowerInvariant()
$os = Get-CimInstance Win32_OperatingSystem

$evidence = [ordered]@{
  schema = 'mouldmaster-real-windows-validation-v1'
  generated_utc = (Get-Date).ToUniversalTime().ToString('o')
  windows = [ordered]@{
    caption = $os.Caption
    version = $os.Version
    build_number = $os.BuildNumber
    architecture = $os.OSArchitecture
  }
  release = [ordered]@{
    executable_name = $exe.Name
    executable_sha256 = $exeHash
    sha256_verified = $true
  }
  legacy_backup = [ordered]@{
    filename = $backup.Name
    sha256 = $backupHash
    bytes = $backup.Length
    content_copied_to_evidence = $false
  }
  manual_checks = [ordered]@{
    displayed_release_matches = $null
    close_reopen_persistence = $null
    windows_restart_persistence = $null
    offline_launch_after_first_launch = $null
    real_legacy_backup_import = $null
    expected_progress_notes_history_present = $null
    imported_certificate_state_not_trusted = $null
    keyboard_navigation_smoke = $null
    external_links_open_in_system_browser = $null
    unexpected_renderer_permissions = $null
  }
  notes = 'Complete manual_checks locally after following REAL_WINDOWS_VALIDATION.md. Do not publish learner/customer/proprietary data in GitHub.'
}

$parent = Split-Path -Parent $EvidenceOut
if ($parent -and -not (Test-Path -LiteralPath $parent)) { New-Item -ItemType Directory -Force -Path $parent | Out-Null }
$evidence | ConvertTo-Json -Depth 6 | Set-Content -LiteralPath $EvidenceOut -Encoding utf8
Write-Host "Verified SHA-256 for $($exe.Name): $exeHash"
Write-Host "Evidence skeleton written to: $EvidenceOut"
Write-Host 'Complete the manual checks in REAL_WINDOWS_VALIDATION.md before retiring the legacy launcher.'
