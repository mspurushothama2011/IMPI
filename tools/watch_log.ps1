param(
  [Parameter(Position=0)][string]$Path = "C:\Users\yeshw\Downloads\Compressed\IMP_2\read_terminal_op_live.txt",
  [Parameter(Position=1)][string]$OutDir = "C:\Users\yeshw\Downloads\Compressed\IMP_2\log_watch",
  [int]$Tail = 0,
  [int]$WindowSize = 300
)

# Ensure output directory
if (-not (Test-Path -LiteralPath $OutDir)) {
  New-Item -ItemType Directory -Path $OutDir -Force | Out-Null
}
$logJsonl = Join-Path $OutDir "log_watch.jsonl"
$statusJson = Join-Path $OutDir "last_status.json"

# Initialize state
$window = New-Object System.Collections.Generic.List[string]
$counts = @{ ERROR = 0; WARN = 0; INFO = 0 }

# Ensure input file exists
if (-not (Test-Path -LiteralPath $Path)) {
  New-Item -ItemType File -Path $Path -Force | Out-Null
}

# Helper: classify severity
function Get-Severity([string]$line){
  # Treat clear error markers only as ERROR to reduce false positives
  if ($line -match '(?i)(Traceback|Exception|IndentationError|SyntaxError|ModuleNotFoundError|NameError|TypeError|ValueError)') { return 'ERROR' }
  if ($line -match '(?i)(^|\s)ERROR(:|\s|\])') { return 'ERROR' }
  if ($line -match '(?i)(WARN|WARNING|DEPRECATION)') { return 'WARN' }
  return 'INFO'
}

# Helper: write status
function Write-Status([string]$severity, [string]$line){
  $now = (Get-Date).ToString('o')
  $counts[$severity]++
  $entry = [pscustomobject]@{ t = $now; severity = $severity; line = $line }
  $entry | ConvertTo-Json -Compress | Add-Content -LiteralPath $logJsonl
  if ($severity -eq 'ERROR') {
    $start = [Math]::Max(0, $window.Count - 30)
    $context = ($window[$start..($window.Count-1)] -join "`n")
    $status = [pscustomobject]@{
      ts = $now
      last_error_line = $line
      context = $context
      counts = $counts
      file = $Path
    }
    $status | ConvertTo-Json -Depth 5 | Set-Content -LiteralPath $statusJson -Encoding UTF8
  } else {
    $status = [pscustomobject]@{
      ts = $now
      last_line = $line
      counts = $counts
      file = $Path
    }
    $status | ConvertTo-Json -Depth 5 | Set-Content -LiteralPath $statusJson -Encoding UTF8
  }
}

# Start tailing
Get-Content -LiteralPath $Path -Tail $Tail -Wait |
  ForEach-Object {
    $line = $_
    $window.Add($line) | Out-Null
    if ($window.Count -gt $WindowSize) { $window.RemoveAt(0) }
    $sev = Get-Severity $line
    Write-Status -severity $sev -line $line
  }
