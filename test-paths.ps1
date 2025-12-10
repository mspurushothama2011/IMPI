# Fresh Path Verification (PowerShell)

$DIR = if ($PSScriptRoot) { $PSScriptRoot } else { Get-Location }
Set-Location $DIR | Out-Null

Write-Host "Project root: $DIR" -ForegroundColor Cyan

$paths = @(
  @{P='app'; T='Dir'},
  @{P='frontend'; T='Dir'},
  @{P='main.py'; T='File'},
  @{P='requirements.txt'; T='File'}
)

$ok=$true
foreach($x in $paths){
  $full = Join-Path $DIR $x.P
  $exists = Test-Path $full
  if($exists){ Write-Host "OK  $($x.P)" -ForegroundColor Green } else { Write-Host "MISS $($x.P)" -ForegroundColor Red; $ok=$false }
}

if($ok){ Write-Host "All good." -ForegroundColor Green } else { Write-Host "Missing items." -ForegroundColor Yellow }





