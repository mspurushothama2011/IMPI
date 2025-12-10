param(
  [Parameter(Position=0)][string]$Path = "C:\Users\yeshw\Downloads\Compressed\IMP_2\read_terminal_op_live.txt",
  [int]$Tail = 200
)

Write-Host "Tailing $Path (last $Tail lines, live updates)" -ForegroundColor Cyan

# Ensure file exists; if not, create and wait for writes
if (-not (Test-Path -LiteralPath $Path)) {
  Write-Host "File not found. Creating it and waiting for updates..." -ForegroundColor Yellow
  New-Item -ItemType File -Path $Path -Force | Out-Null
}

# Stream the log with basic highlighting
Get-Content -LiteralPath $Path -Tail $Tail -Wait |
  ForEach-Object {
    $line = $_
    if ($line -match '(?i)(ERROR|CRITICAL|EXCEPTION|TRACEBACK|IndentationError|SyntaxError)') {
      Write-Host $line -ForegroundColor Red
    }
    elseif ($line -match '(?i)(WARN|WARNING|DEPRECATION)') {
      Write-Host $line -ForegroundColor Yellow
    }
    else {
      Write-Host $line
    }
  }
