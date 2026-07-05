#!/usr/bin/env python3
"""
SafetyOS Zero Trust Audit Script
Checks infrastructure (Postgres, Redis, MQTT, Neo4j, ChromaDB),
FastAPI backend endpoints, data integrity, frontend pages, and WebSocket connections.
"""
import sys
import json
import asyncio
import urllib.request
import socket
from datetime import datetime

# Configuration
BACKEND_URL = "http://localhost:8000"
FRONTEND_URL = "http://localhost:3000"
INFRA_PORTS = {
    "Postgres": 5432,
    "Redis": 6379,
    "MQTT Broker": 1883,
    "ChromaDB": 8002,
    "Neo4j Bolt": 7687,
    "Neo4j HTTP": 7474
}

RESULTS = []

def check_port(host: str, port: int) -> bool:
    try:
        with socket.create_connection((host, port), timeout=2.0):
            return True
    except (socket.timeout, ConnectionRefusedError):
        return False

def http_get(url: str, timeout: float = 3.0) -> tuple:
    try:
        req = urllib.request.Request(url, headers={"User-Agent": "SafetyOS-Audit"})
        with urllib.request.urlopen(req, timeout=timeout) as response:
            return response.status, response.read().decode('utf-8')
    except Exception as e:
        return 0, str(e)

def add_result(category: str, name: str, success: bool, detail: str):
    RESULTS.append({
        "category": category,
        "name": name,
        "success": success,
        "detail": detail
    })

async def run_audit():
    print("=" * 60)
    print(f"SafetyOS Zero Trust Audit System — {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print("=" * 60)

    # 1. Infrastructure Checks
    print("\n[1/5] Auditing Infrastructure Connections...")
    for name, port in INFRA_PORTS.items():
        ok = check_port("localhost", port)
        detail = f"Port {port} open and listening" if ok else f"Port {port} connection refused"
        add_result("Infrastructure", name, ok, detail)
        print(f"  {'✓' if ok else '✗'} {name:<15} : {detail}")

    # 2. FastAPI Backend Endpoint Check
    print("\n[2/5] Auditing FastAPI Backend Endpoints...")
    endpoints = [
        ("Health Root", "/"),
        ("Sensor List", "/sensors/"),
        ("Active Permits", "/permits/"),
        ("Compliance Rules", "/compliance/"),
        ("Agent Profiles", "/agents/profiles"),
        ("Suggested Queries", "/knowledge/suggestions"),
        ("Historical Incidents", "/incidents/"),
        ("CCTV Camera List", "/cameras/"),
        ("LLM Config Settings", "/settings/llm"),
    ]
    for name, path in endpoints:
        status, body = http_get(f"{BACKEND_URL}{path}")
        ok = status == 200
        detail = f"HTTP {status} received" if ok else f"HTTP {status} | Error: {body[:60]}"
        add_result("Backend API", name, ok, detail)
        print(f"  {'✓' if ok else '✗'} {name:<20} : {detail}")

    # 3. Data Integrity Validation
    print("\n[3/5] Auditing Data Integrity & Content Verification...")
    status, body = http_get(f"{BACKEND_URL}/sensors/")
    if status == 200:
        try:
            data = json.loads(body)
            sensors_count = len(data.get("sensors", []))
            ok = sensors_count >= 15
            detail = f"Found {sensors_count} sensors configured (expecting >= 15)"
        except Exception as e:
            ok, detail = False, f"JSON parse error: {e}"
    else:
        ok, detail = False, "Sensors list unreachable"
    add_result("Data Integrity", "Sensors Threshold Integrity", ok, detail)
    print(f"  {'✓' if ok else '✗'} Sensors Count     : {detail}")

    # 4. Frontend Page Checks
    print("\n[4/5] Auditing Frontend Routing & SSR compilation...")
    pages = [
        ("Dashboard", "/"),
        ("AI Debate Room", "/agents"),
        ("Sensor Grid", "/sensors"),
        ("Knowledge Graph", "/graph"),
        ("CCTV Vision Panel", "/cameras"),
        ("Permits Overview", "/permits"),
        ("Compliance Audits", "/compliance"),
        ("Worker Companion App", "/mobile"),
        ("Settings Room", "/settings")
      ]
    for name, path in pages:
        status, _ = http_get(f"{FRONTEND_URL}{path}")
        ok = status == 200
        detail = f"Page loaded with HTTP {status}" if ok else f"Page loading error HTTP {status}"
        add_result("Frontend Web", name, ok, detail)
        print(f"  {'✓' if ok else '✗'} {name:<20} : {detail}")

    # 5. WebSocket Connection handshake
    print("\n[5/5] Auditing Real-Time WebSockets...")
    try:
        import websockets
        async with websockets.connect("ws://localhost:8000/ws/live", timeout=2.0) as ws:
            # Send mock subscribe or wait for greeting
            greeting = await asyncio.wait_for(ws.recv(), timeout=2.0)
            ok = len(greeting) > 0
            detail = "Handshake success, live telemetry feed incoming"
    except Exception as e:
        ok = False
        detail = f"WebSocket handshaking failed: {e}. Ensure backend is running."
    add_result("Real-time WS", "WebSocket Telemetry Handshake", ok, detail)
    print(f"  {'✓' if ok else '✗'} WebSocket Status   : {detail}")

    # Summary
    print("\n" + "=" * 60)
    total = len(RESULTS)
    successes = sum(1 for r in RESULTS if r["success"])
    score = (successes / total) * 100
    print(f"Audit completed: {successes}/{total} checks passed ({score:.1f}%)")
    print("=" * 60)
    if score == 100:
        print("🎉 Zero Trust Audit fully COMPLIANT. Ready for production submission!")
    else:
        print("⚠️ Warning: Fix failing ports/endpoints before running the final demo.")
    print("=" * 60)

if __name__ == "__main__":
    # Ensure websockets library is checked/installed or print warning
    try:
        import websockets
    except ImportError:
        print("Please install required libraries first: pip install websockets")
        sys.exit(1)

    asyncio.run(run_audit())
