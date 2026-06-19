$pidFile = Join-Path $PSScriptRoot "server.pid"
if (Test-Path $pidFile) {
  $oldPid = Get-Content $pidFile
  $proc = Get-Process -Id $oldPid -ErrorAction SilentlyContinue
  if ($proc -and $proc.ProcessName -eq "node") {
    Stop-Process -Id $oldPid -Force
    Write-Output "Killed phim-server (PID $oldPid)"
    Start-Sleep 2
  } else {
    Write-Output "No phim-server running (PID $oldPid not found)"
  }
} else {
  Write-Output "No PID file found, checking port 3000..."
  $conn = netstat -ano | Select-String ":3000 " | Select-String "LISTENING"
  if ($conn) {
    $pidNum = $conn.Line.Trim() -replace '.*\s+(\d+)$', '$1'
    $proc = Get-Process -Id $pidNum -ErrorAction SilentlyContinue
    if ($proc -and $proc.ProcessName -eq "node") {
      Stop-Process -Id $pidNum -Force
      Write-Output "Killed process on port 3000 (PID $pidNum)"
      Start-Sleep 2
    }
  }
}
Start-Process -WindowStyle Hidden -FilePath "node" -ArgumentList "server.js" -WorkingDirectory $PSScriptRoot
Write-Output "Server restarted"
