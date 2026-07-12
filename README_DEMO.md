SafetyOS — Local Demo Guide

This file explains how to run SafetyOS locally in demo mode with simulated connectivity and optional HLS camera playback.

Quick start (recommended for local demos)
1. From repository root (PowerShell):
   $env:PYTHONPATH = (Get-Location).Path
   python -m uvicorn backend.main:app --host 127.0.0.1 --port 8003 --reload

2. Backend runs in DEMO_FAST_START mode by default (see backend/core/config.py). This skips heavy infra (Postgres, Neo4j, Chroma) and runs the sensor simulator.

3. To start demo connectivity (if not auto-started):
   POST http://127.0.0.1:8003/connectivity/start_demo

4. WebSocket (frontend or custom client):
   ws://127.0.0.1:8003/ws/live
   Connect to this websocket to receive real-time sensor_update messages and alerts.

HLS / Camera demo
1. Install ffmpeg and ensure it's on PATH.
2. Edit scripts/start_local_hls.ps1 and set RTSP or local file sources for cam-01, cam-02, etc.
3. Run the script: .\scripts\start_local_hls.ps1
4. The script writes HLS files to frontend/public/hls/ which are served by the backend at /hls (e.g. http://127.0.0.1:8003/hls/cam-01.m3u8).
5. Open the frontend /cameras page to see per-camera HLS playback (if NEXT_PUBLIC_CAMERA_URL not set the per-camera HLS endpoints will be used).

API endpoints of interest
- GET /connectivity/sources
- POST /connectivity/sources (body: id,name,protocol,host,port,config)
- POST /connectivity/start_demo
- DELETE /connectivity/sources/{source_id}
- POST /connectivity/sources/{source_id}/start
- POST /connectivity/sources/{source_id}/stop
- GET /connectivity/metrics

Notes
- For production-grade MQTT usage, ensure broker TLS/auth config is set in the source config (username/password/tls, ca_cert paths).
- OPC-UA connector depends on asyncua; install with `pip install asyncua` if you plan to connect to real OPC-UA servers.
- If you prefer not to set PYTHONPATH every time, install the repo into your Python environment in editable mode: pip install -e .

Support
If any process fails to start, check logs printed by uvicorn. For HLS issues, check ffmpeg console windows created by the start_local_hls.ps1 script.
