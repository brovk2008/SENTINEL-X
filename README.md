# 🏭 SafetyOS — Enterprise AI Operating System for Industrial Safety
### 🏆 ET AI Hackathon 2.0 | Solo Build | 20 Days | ₹5,00,000 Target

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Next.js 14](https://img.shields.io/badge/Next.js-14-black.svg?style=flat&logo=next.js)](https://nextjs.org/)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.111.0-009688.svg?style=flat&logo=fastapi)](https://fastapi.tiangolo.com/)
[![Docker](https://img.shields.io/badge/Docker-Enabled-blue.svg?logo=docker)](https://www.docker.com/)
[![RAG Engine](https://img.shields.io/badge/ChromaDB-VectorSearch-orange.svg)](https://www.trychroma.com/)
[![Knowledge Graph](https://img.shields.io/badge/Neo4j-bolt-blue.svg?logo=neo4j)](https://neo4j.com/)

---

## ❓ The Core Problem

Industrial complexes (refineries, steel plants, chemical processors) run on dozens of legacy systems. Standard Operating Procedures (SOPs), sensor streams, CCTV cameras, and physical work permits exist in isolated silos. When critical events occur (e.g., toxic gas release in a confined maintenance space), operators suffer from **alert fatigue** or fail to synthesize multiple data points in time. 

**Legacy solutions are retrospective. SafetyOS is predictive and autonomous.**

**SafetyOS** bridges this gap. It aggregates:
1. **IoT Sensor Feeds** (20+ virtual sensors via MQTT)
2. **Work Permit Registries** (Permit-to-Work database correlation)
3. **CCTV AI Computer Vision** (PPE checks and area intrusion alerts)
4. **Regulatory Standards** (OISD standards, Factories Act 1948, DGFASLI)

---

## ⚡ The Solution: Next-Gen Architecture

SafetyOS is a containerized real-time OS served via a premium glassmorphic interface, orchestrating background AI agents that debate safety decisions before executing response protocols.

```
                  ┌──────────────────────┐
                  │   Nginx Web Proxy    │
                  └──────────┬───────────┘
                             │
            ┌────────────────┴────────────────┐
            ▼                                 ▼
   ┌─────────────────┐               ┌─────────────────┐
   │ Next.js 14 UI   │               │ FastAPI Backend │
   │ (Mission Control│               │ (HTTP/Websocket)│
   └─────────────────┘               └────────┬────────┘
                                              │
              ┌───────────────────────────────┼──────────────────────────────┐
              ▼                               ▼                              ▼
     ┌─────────────────┐             ┌─────────────────┐            ┌─────────────────┐
     │  Redis Pub/Sub  │             │   PostgreSQL    │            │ ChromaDB Vector │
     │  (Live State)   │             │  (Permit DB)    │            │ (SOPs & OISD)   │
     └─────────────────┘             └─────────────────┘            └─────────────────┘
              ▲                               ▲                              ▲
              │                               │                              │
     ┌────────┴────────┐             ┌────────┴────────┐            ┌────────┴────────┐
     │   MQTT Broker   │             │  Neo4j Bolt Graph│            │  LLM Router Engine│
     │ (Mosquitto IoT) │             │ (Entity Links)  │            │ (Gemini/Ollama) │
     └─────────────────┘             └─────────────────┘            └─────────────────┘
```

---

## 🎯 Key Hackathon-Winning Features

### 1. 🚦 Mission Control Dashboard
* **Glassmorphic UI**: Vibrant, responsive dark-mode styling built using CSS variables, custom gauges, and animated transitions.
* **Interactive SVG Plant Layout**: Real-time color-coded hazard zones indicating risk levels mapped dynamically to active sensor groups.
* **Live Sensor Ticker**: Smooth, infinite-scroll horizontal ticker displaying critical changes from 20+ live sensor feeds.

### 2. 🧠 Multi-Agent AI Debate Room
* **6 Specialized Agents + 1 Executive Coordinator**:
  * 🔴 **Safety Agent**: Prioritizes life safety, advocates for immediate evacuations.
  * 🟡 **Production Agent**: Seeks operational workarounds, quantifies downtime cost.
  * ⚖️ **Compliance Agent**: Cites OISD, DGFASLI, and Factories Act regulations.
  * 🔧 **Maintenance Agent**: Identifies technical root causes and estimates fix times.
  * 💰 **Finance Agent**: Computes the financial cost of action vs. inaction.
  * 🚨 **Emergency Agent**: Validates and triggers emergency response protocols.
  * 🎯 **Executive Coordinator**: Synthesizes the debate into a single, concrete action plan.
* **Real-time Streaming**: Debates are powered by an LLM-router with automatic provider fallback, streamed directly to the frontend via Server-Sent Events (SSE) with typing animations.

### 3. 👁️ Smart CCTV Computer Vision
* **Real-Time Video Analytics Mocks**: Interactive video player drawing bounding boxes over workers.
* **Violations Auditing**: Flags workers without PPE (hardhats, vests) or individuals entering restricted zones (Zone C Compressor Bay) during unsafe gas levels.

### 4. 📖 Knowledge RAG Engine
* **Vector Semantic Search**: Queries safety questions against OISD standards, Indian Factory Act regulations, and historical incident logs using ChromaDB embeddings.
* **Cited Responses**: Delivers responses complete with specific document citations and confidence ratings.
* **Voice Integration**: Hands-free voice querying utilizing the Web Speech API.

### 5. 📳 Worker Mobile Companion (PWA)
* **Real-Time Notification Channel**: Simulates QR-code pairing of field devices to the dashboard.
* **Autonomous Push Notifications**: Instantly pushes evacuation coordinates and warnings to workers.

---

## 🛠️ Technology Stack

| Component | Technology | Role |
|---|---|---|
| **Frontend** | Next.js 14, React, Zustand, Recharts, Lucide | Core UI & State Synchronization |
| **Backend** | FastAPI (Python), Uvicorn, Websockets | REST API & Real-time message streaming |
| **Database (SQL)** | PostgreSQL + SQLAlchemy | Users, Active Permits, and Shift Logs |
| **State Store (NoSQL)** | Redis (Hiredis) | Memory state cache & WebSocket Pub/Sub broker |
| **Vector DB (RAG)** | ChromaDB | Regulation documents, SOPs, and incident vectors |
| **Graph DB** | Neo4j | Equipment-permit-regulation dependency links |
| **Message Broker** | Mosquitto (MQTT) | IoT simulated sensor data ingestion |
| **AI Router** | LangChain / Google Gemini API / Ollama | Multi-provider LLM coordinator with fallbacks |
| **Reverse Proxy** | Nginx | Port routing and static assets delivery |

---

## 🚀 Quick Start Instructions (Run Local / Docker)

### Option A: Local Build (Without Docker)

If Docker Desktop is not running, launch the stack directly on your local machine:

1. **Start Backend**:
   ```bash
   cd backend
   pip install -r requirements.txt
   uvicorn main:app --host 0.0.0.0 --port 8000 --reload
   ```
2. **Start Frontend**:
   ```bash
   cd frontend
   npm install
   npm run dev
   ```
3. **Generate & Seed Data**:
   ```bash
   # In root directory:
   python synthetic_data_generator.py --export   # creates local database seed files
   python synthetic_data_generator.py --push     # pushes seed data to backend
   ```
4. **Visit**: `http://localhost:3000`

### Option B: Dockerized Container (One Command)

Ensure Docker Desktop is running, then launch the stack using the bootstrapper:

```powershell
./run.ps1
```
Or directly:
```bash
docker-compose up --build -d
```

---

## 🔒 Zero Trust Internal Security Audit

SafetyOS contains a built-in automated sanity-check suite that runs health inspections across every TCP/HTTP endpoint, checking data integrity and streaming message performance:

```bash
python zero_trust_audit.py
```

---

## 📄 License

Distributed under the MIT License. See [LICENSE](LICENSE) for details.
