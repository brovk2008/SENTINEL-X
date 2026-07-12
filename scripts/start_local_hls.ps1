# FFmpeg Supervisor (local testing)
# Usage: Open PowerShell in project root and run: .\scripts\start_local_hls.ps1
# This script demonstrates how to run ffmpeg to convert RTSP or local MP4 inputs
# into HLS segments served from frontend/public/hls. Ensure ffmpeg is installed and in PATH.

$publicHls = Join-Path -Path (Resolve-Path "frontend/public") -ChildPath "hls"
if (-not (Test-Path $publicHls)) {
    New-Item -ItemType Directory -Path $publicHls | Out-Null
}

# Example inputs (replace with real RTSP or local files)
$inputs = @(
    @{ id = 'cam-01'; src = 'rtsp://username:password@camera1.local:554/stream' },
    @{ id = 'cam-02'; src = 'rtsp://username:password@camera2.local:554/stream' }
)

# Build ffmpeg commands (user must edit the src values before running)
foreach ($cam in $inputs) {
    $id = $cam.id
    $src = $cam.src
    $out = Join-Path $publicHls "$id.m3u8"

    $cmd = "ffmpeg -rtsp_transport tcp -i `"$src`" -c:v copy -c:a aac -f hls -hls_time 4 -hls_list_size 5 -hls_flags delete_segments `"$out`""

    Write-Host "Starting ffmpeg for $id -> $out"
    Write-Host "Command: $cmd"

    # Start in new window so multiple ffmpeg processes run independently
    Start-Process -FilePath powershell -ArgumentList "-NoExit","-Command","$cmd" -WindowStyle Normal
}

Write-Host "FFmpeg supervisor started. Edit the script to set correct RTSP sources. Output HLS files appear in frontend/public/hls/"
