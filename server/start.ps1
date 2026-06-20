$serverJob = Start-Job -ScriptBlock {
  node "C:\Users\nhhua\AppData\Local\Temp\opencode\phim-server\server.cjs"
}
Start-Sleep -Seconds 3

# Test APIs
$stats = node -e "const http=require('http');http.get('http://127.0.0.1:3000/api/stats',r=>{let d='';r.on('data',c=>d+=c);r.on('end',()=>process.stdout.write(d))})"
Write-Host "STATS: $stats"

$movies = node -e "const http=require('http');http.get('http://127.0.0.1:3000/api/movies?page=1&limit=2',r=>{let d='';r.on('data',c=>d+=c);r.on('end',()=>{const j=JSON.parse(d);process.stdout.write(JSON.stringify({total:j.total,items:j.movies.length}))})})"
Write-Host "MOVES: $movies"

$video = node -e "const http=require('http');http.get('http://127.0.0.1:3000/api/video/javhdz/1',r=>{let d='';r.on('data',c=>d+=c);r.on('end',()=>process.stdout.write(d.slice(0,200)))})"
Write-Host "VIDEO: $video"

# Keep server running
Write-Host "=== Server is running on http://localhost:3000 ==="
Write-Host "============================="

# Wait for server job
Wait-Job $serverJob | Out-Null
