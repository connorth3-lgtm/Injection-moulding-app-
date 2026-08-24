param(
  [string]$Source = "../../mouldmaster-512.png",
  [string]$Output = "build/appx"
)

$ErrorActionPreference = 'Stop'
Add-Type -AssemblyName System.Drawing

$sourcePath = [System.IO.Path]::GetFullPath((Join-Path $PSScriptRoot $Source))
$outputPath = [System.IO.Path]::GetFullPath((Join-Path (Split-Path $PSScriptRoot -Parent) $Output))
New-Item -ItemType Directory -Force -Path $outputPath | Out-Null

function Write-MouldMasterAsset {
  param([string]$Name,[int]$Width,[int]$Height)
  $src = [System.Drawing.Image]::FromFile($sourcePath)
  try {
    $bmp = New-Object System.Drawing.Bitmap $Width,$Height
    try {
      $bmp.SetResolution(96,96)
      $g = [System.Drawing.Graphics]::FromImage($bmp)
      try {
        $g.Clear([System.Drawing.Color]::Transparent)
        $g.CompositingQuality = [System.Drawing.Drawing2D.CompositingQuality]::HighQuality
        $g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
        $g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::HighQuality
        $scale = [Math]::Min($Width / $src.Width, $Height / $src.Height)
        $drawW = [Math]::Max(1,[int][Math]::Round($src.Width * $scale))
        $drawH = [Math]::Max(1,[int][Math]::Round($src.Height * $scale))
        $x = [int](($Width-$drawW)/2)
        $y = [int](($Height-$drawH)/2)
        $g.DrawImage($src,$x,$y,$drawW,$drawH)
      } finally { $g.Dispose() }
      $dest = Join-Path $outputPath $Name
      $bmp.Save($dest,[System.Drawing.Imaging.ImageFormat]::Png)
      Write-Host "Generated $dest ($Width x $Height)"
    } finally { $bmp.Dispose() }
  } finally { $src.Dispose() }
}

Write-MouldMasterAsset 'StoreLogo.png' 50 50
Write-MouldMasterAsset 'Square150x150Logo.png' 150 150
Write-MouldMasterAsset 'Square44x44Logo.png' 44 44
Write-MouldMasterAsset 'Wide310x150Logo.png' 310 150
Write-MouldMasterAsset 'BadgeLogo.png' 24 24
Write-MouldMasterAsset 'LargeTile.png' 310 310
Write-MouldMasterAsset 'SmallTile.png' 71 71
Write-MouldMasterAsset 'SplashScreen.png' 620 300
