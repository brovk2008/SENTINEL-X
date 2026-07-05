"""
SafetyOS — Zero Trust Audit Script
Checks every service endpoint and verifies the stack is alive.
Run this from inside your project folder:
    python zero_trust_audit.py
"""

import sys
import json
import time
import socket
import requests
from datetime import datetime

# ─── CONFIG ─────────────────────────────────────────────────────────────────
BASE_URL      = "http://localhost:8000"   # FastAPI backend
FRONTEND_URL  = "http://localhost:3000"   # Next.js frontend
NEO4J_URL     = "http://localhost:7474"   # Neo4j browser
CHROMA_URL    = "http://localhost:8001"   # ChromaDB
REDIS_HOST    = "localhost"
REDIS_PORT    = 6379
MQTT_HOST     = "localhost"
MQTT_PORT     = 1883
TIMEOUT       = 5  # seconds per check

PASS  = "✅ PASS"
FAIL  = "❌ FAIL"
WARN  = "⚠️  WARN"
INFO  = "ℹ️  INFO"

results = []

# ─── HELPERS ────────────────────────────────────────────────────────────────
def check(label: str, status: str, detail: str = ""):
    icon = {"PASS": PASS, "FAIL": FAIL, "WARN": WARN, "INFO": INFO}.get(status, INFO)
    line = f"  {icon}  {label}"
    if detail:
        line += f" — {detail}"
    print(line)
    results.append({"label": label, "status": status, "detail": detail})

def http_get(url: str, label: str, expect_key: str = None):
    try:
        r = requests.get(url, timeout=TIMEOUT)
        if r.status_code == 200:
            if expect_key:
                data = r.json()
                if expect_key in data:
                    check(label, "PASS", f"HTTP 200 | '{expect_key}' present")
                else:
                    check(label, "WARN", f"HTTP 200 but '{expect_key}' missing in response")
            else:
                check(label, "PASS", f"HTTP 200")
        else:
            check(label, "FAIL", f"HTTP {r.status_code}")
    except requests.exceptions.ConnectionError:
        check(label, "FAIL", "Connection refused — service not running")
    except requests.exceptions.Timeout:
        check(label, "FAIL", f"Timeout after {TIMEOUT}s")
    except Exception as e:
        check(label, "FAIL", str(e))

def tcp_ping(host: str, port: int, label: str):
    try:
        s = socket.create_connection((host, port), timeout=TIMEOUT)
        s.close()
        check(label, "PASS", f"TCP {host}:{port} reachable")
    except ConnectionRefusedError:
        check(label, "FAIL", f"TCP {host}:{port} — connection refused")
    except Exception as e:
        check(label, "FAIL", str(e))

# ─── AUDIT SECTIONS ─────────────────────────────────────────────────────────
def audit_infrastructure():
    print("\n━━━ 1. INFRASTRUCTURE SERVICES ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━")

    # PostgreSQL
    try:
        import psycopg2
        conn = psycopg2.connect(
            host="localhost", port=5432,
            dbname="safetyos", user="safetyos", password="safetyos",
            connect_timeout=TIMEOUT
        )
        conn.close()
        check("PostgreSQL", "PASS", "Connected to safetyos DB")
    except ImportError:
        tcp_ping("localhost", 5432, "PostgreSQL (TCP only — psycopg2 not installed)")
    except Exception as e:
        check("PostgreSQL", "FAIL", str(e))

    # Redis
    try:
        import redis
        r = redis.Redis(host=REDIS_HOST, port=REDIS_PORT, socket_connect_timeout=TIMEOUT)
        r.ping()
        check("Redis", "PASS", "PONG received")
    except ImportError:
        tcp_ping(REDIS_HOST, REDIS_PORT, "Redis (TCP only — redis-py not installed)")
    except Exception as e:
        check("Redis", "FAIL", str(e))

    # MQTT
    tcp_ping(MQTT_HOST, MQTT_PORT, "MQTT Broker (Mosquitto)")

    # Neo4j
    http_get(NEO4J_URL, "Neo4j Browser")

    # ChromaDB
    http_get(f"{CHROMA_URL}/api/v1/heartbeat", "ChromaDB", "nanosecond heartbeat")


def audit_backend():
    print("\n━━━ 2. FASTAPI BACKEND ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━")

    http_get(f"{BASE_URL}/health",       "Health check",          "status")
    http_get(f"{BASE_URL}/sensors/",     "GET /sensors/")
    http_get(f"{BASE_URL}/incidents/",   "GET /incidents/")
    http_get(f"{BASE_URL}/permits/",     "GET /permits/")
    http_get(f"{BASE_URL}/workers/",     "GET /workers/")
    http_get(f"{BASE_URL}/compliance/",  "GET /compliance/")
    http_get(f"{BASE_URL}/analytics/",   "GET /analytics/")
    http_get(f"{BASE_URL}/plants/",      "GET /plants/")
    http_get(f"{BASE_URL}/docs",         "FastAPI Swagger UI")


def audit_api_data():
    print("\n━━━ 3. DATA INTEGRITY CHECKS ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━")

    # Sensors — expect at least 10
    try:
        r = requests.get(f"{BASE_URL}/sensors/", timeout=TIMEOUT)
        sensors = r.json()
        count = len(sensors) if isinstance(sensors, list) else len(sensors.get("data", []))
        if count >= 10:
            check("Sensor count", "PASS", f"{count} sensors in DB")
        elif count > 0:
            check("Sensor count", "WARN", f"Only {count} sensors — expected ≥10")
        else:
            check("Sensor count", "FAIL", "No sensors found — seed data missing")
    except Exception as e:
        check("Sensor count", "FAIL", str(e))

    # Incidents — expect at least 5
    try:
        r = requests.get(f"{BASE_URL}/incidents/", timeout=TIMEOUT)
        data = r.json()
        count = len(data) if isinstance(data, list) else len(data.get("data", []))
        status = "PASS" if count >= 5 else ("WARN" if count > 0 else "FAIL")
        check("Incident history", status, f"{count} historical incidents")
    except Exception as e:
        check("Incident history", "FAIL", str(e))

    # RAG — ask a test question
    try:
        r = requests.post(
            f"{BASE_URL}/knowledge/query",
            json={"question": "What is the safe H2S exposure limit?"},
            timeout=15
        )
        if r.status_code == 200:
            ans = r.json()
            has_answer = bool(ans.get("answer") or ans.get("response") or ans.get("text"))
            check("RAG Knowledge Query", "PASS" if has_answer else "WARN",
                  "Got answer" if has_answer else "Empty response — check embeddings")
        else:
            check("RAG Knowledge Query", "FAIL", f"HTTP {r.status_code}")
    except Exception as e:
        check("RAG Knowledge Query", "FAIL", str(e))

    # Compound Risk Engine
    try:
        r = requests.get(f"{BASE_URL}/agents/risk-status", timeout=TIMEOUT)
        if r.status_code == 200:
            check("Compound Risk Engine", "PASS", "Risk status endpoint responding")
        else:
            check("Compound Risk Engine", "WARN", f"HTTP {r.status_code} — may not be seeded yet")
    except Exception as e:
        check("Compound Risk Engine", "FAIL", str(e))


def audit_frontend():
    print("\n━━━ 4. FRONTEND (Next.js) ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━")

    http_get(FRONTEND_URL,               "Home / Mission Control")
    http_get(f"{FRONTEND_URL}/agents",   "AI Debate Room page")
    http_get(f"{FRONTEND_URL}/sensors",  "Live Sensors page")
    http_get(f"{FRONTEND_URL}/knowledge","Knowledge RAG page")
    http_get(f"{FRONTEND_URL}/incidents","Incident Timeline page")
    http_get(f"{FRONTEND_URL}/permits",  "Permit Intelligence page")
    http_get(f"{FRONTEND_URL}/compliance","Compliance Monitor page")
    http_get(f"{FRONTEND_URL}/executive","Executive Copilot page")
    http_get(f"{FRONTEND_URL}/mobile",   "Worker Mobile View page")
    http_get(f"{FRONTEND_URL}/reports",  "Reports page")
    http_get(f"{FRONTEND_URL}/graph",    "Knowledge Graph page")


def audit_websocket():
    print("\n━━━ 5. WEBSOCKET (Real-time Layer) ━━━━━━━━━━━━━━━━━━━━━━━━━")
    try:
        import websocket as ws_lib
        ws = ws_lib.create_connection(
            f"ws://localhost:8000/ws/live",
            timeout=TIMEOUT
        )
        msg = ws.recv()
        ws.close()
        check("WebSocket /ws/live", "PASS", f"Received frame: {str(msg)[:60]}...")
    except ImportError:
        # Fallback: just TCP check the port
        tcp_ping("localhost", 8000, "WebSocket port 8000 (TCP)")
        check("WebSocket message", "INFO", "Install websocket-client to test frames")
    except Exception as e:
        check("WebSocket /ws/live", "FAIL", str(e))


def print_summary():
    print("\n━━━ AUDIT SUMMARY ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━")
    passed = sum(1 for r in results if r["status"] == "PASS")
    warned = sum(1 for r in results if r["status"] == "WARN")
    failed = sum(1 for r in results if r["status"] == "FAIL")
    total  = len(results)

    print(f"\n  Total checks : {total}")
    print(f"  {PASS}  : {passed}")
    print(f"  {WARN}  : {warned}")
    print(f"  {FAIL}  : {failed}")

    score = int((passed / total) * 100) if total else 0
    print(f"\n  Overall Score: {score}%", end=" ")
    if score == 100:
        print("🏆 Perfect — ready to demo!")
    elif score >= 80:
        print("🟢 Mostly healthy — fix warnings before demo")
    elif score >= 50:
        print("🟡 Partial — several services need attention")
    else:
        print("🔴 Critical — stack not running properly")

    if failed > 0:
        print("\n  Failed checks (fix these first):")
        for r in results:
            if r["status"] == "FAIL":
                print(f"    → {r['label']}: {r['detail']}")

    print(f"\n  Run at: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print("━" * 55)


# ─── MAIN ───────────────────────────────────────────────────────────────────
if __name__ == "__main__":
    print("╔══════════════════════════════════════════════════════╗")
    print("║        SafetyOS — Zero Trust Audit v1.0             ║")
    print("║        Checking all services before demo...          ║")
    print("╚══════════════════════════════════════════════════════╝")

    audit_infrastructure()
    audit_backend()
    audit_api_data()
    audit_frontend()
    audit_websocket()
    print_summary()
