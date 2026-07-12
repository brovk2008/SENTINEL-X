# Start SafetyOS backend in demo mode and optionally start HLS ffmpeg supervisors.
# Usage: Open PowerShell in project root and run: .\scripts\start_demo.ps1
# Requirements: Python in PATH, ffmpeg optional (for HLS), set execution policy as appropriate.

param(
  [switch]$StartHls
)

$repo = (Resolve-Path ".").Path
Write-Host "Repository: $repo"

# Ensure PYTHONPATH is set for the session
$env:PYTHONPATH = $repo
Write-Host "PYTHONPATH set to $env:PYTHONPATH"

# Optional: start HLS supervisor
if ($StartHls) {
  Write-Host "Starting local HLS supervisor (edit scripts/start_local_hls.ps1 to configure sources)"
  Start-Process -FilePath powershell -ArgumentList "-NoExit","-Command",".\scripts\start_local_hls.ps1" -WindowStyle Normal
  Start-Sleep -Seconds 2
}

# Start backend (uvicorn)
Write-Host "Starting backend (uvicorn) on http://127.0.0.1:8003"
Start-Process -FilePath python -ArgumentList "-m","uvicorn","backend.main:app","--host","127.0.0.1","--port","8003","--reload" -WindowStyle Normal
Write-Host "Backend launched. Check logs in the new window." 
