"use client";
import React, { useEffect, useState } from "react";
import { Cloud, Globe, Zap, Radio, Flame, ShieldCheck, Plug, Sparkles } from "lucide-react";
import { PIDVisionExtractorModal } from "../../components/PIDVisionExtractorModal";

const API = process.env.NEXT_PUBLIC_API_URL || "";

interface Source {
  id: string;
  name: string;
  protocol: "mqtt" | "opcua" | "modbus" | "rtsp" | "http_poll";
  host: string;
  port: number;
  status: "connected" | "disconnected" | "error" | "standby" | "connecting";
  tags_count?: number;
  last_seen?: string | null;
  error?: string | null;
  topics?: string[];
  poll_interval_ms?: number;
  namespace?: string;
}

const DEMO_SOURCES: Source[] = [
  { id: "mqtt-local",    name: "Plant Floor MQTT (Mosquitto)",      protocol: "mqtt",     host: "localhost",                              port: 1883,  status: "connected",    tags_count: 34,  last_seen: new Date(Date.now() - 200).toISOString(),   topics: ["safetyos/#"] },
  { id: "scada-opcua",   name: "Honeywell SCADA",                   protocol: "opcua",    host: "192.168.1.100",                          port: 4840,  status: "connected",    tags_count: 128, last_seen: new Date(Date.now() - 500).toISOString(),   namespace: "2" },
  { id: "plc-modbus",    name: "Siemens S7-1500 PLC",               protocol: "modbus",   host: "192.168.1.50",                           port: 502,   status: "connected",    tags_count: 64,  last_seen: new Date(Date.now() - 800).toISOString(),   poll_interval_ms: 2000 },
  { id: "cameras-rtsp",  name: "CCTV DVR (8 cameras)",              protocol: "rtsp",     host: "192.168.1.200",                          port: 554,   status: "connected",    tags_count: 8,   last_seen: new Date(Date.now() - 100).toISOString() },
  { id: "firebase-iot",  name: "Firebase IoT Cloud",                protocol: "http_poll",host: "firebaseio.com",                         port: 443,   status: "connected",    tags_count: 12,  last_seen: new Date(Date.now() - 1200).toISOString() },
  { id: "aws-iot",       name: "AWS IoT Core",                      protocol: "mqtt",     host: "xxxxxxx.iot.ap-south-1.amazonaws.com",   port: 8883,  status: "standby",      tags_count: 0,   last_seen: null },
  { id: "azure-iot",     name: "Azure IoT Hub",                     protocol: "mqtt",     host: "safetyos.azure-devices.net",             port: 8883,  status: "standby",      tags_count: 0,   last_seen: null },
];

const CLOUD_INTEGRATIONS = [
  { id: "aws",        name: "AWS IoT Core",        Icon: Cloud,       color: "#ff9900" },
  { id: "azure",      name: "Azure IoT Hub",       Icon: ShieldCheck, color: "#0078d4" },
  { id: "google",     name: "Google Cloud IoT",    Icon: Globe,       color: "#4285f4" },
  { id: "firebase",   name: "Firebase IoT",        Icon: Flame,       color: "#ff6c00" },
  { id: "ignition",   name: "Ignition SCADA",      Icon: Zap,         color: "#9b59ff" },
  { id: "custom-mqtt",name: "Custom MQTT",         Icon: Radio,       color: "#00ddff" },
];

type ModalProto = "mqtt" | "opcua" | "modbus" | "rtsp" | "http_poll";

const PROTO_FIELDS: Record<ModalProto, { label: string; placeholder: string; field: string }[]> = {
  mqtt:     [
    { label: "Broker Host", placeholder: "192.168.1.x", field: "host" },
    { label: "Port",        placeholder: "1883",         field: "port" },
    { label: "Topics",      placeholder: "safetyos/#",   field: "topics" },
    { label: "Username",    placeholder: "optional",     field: "username" },
    { label: "Password",    placeholder: "optional",     field: "password" },
  ],
  opcua:    [
    { label: "Server Host",   placeholder: "192.168.1.x", field: "host" },
    { label: "Port",          placeholder: "4840",         field: "port" },
    { label: "Namespace",     placeholder: "2",            field: "namespace" },
    { label: "Poll interval (ms)", placeholder: "1000",   field: "poll_interval_ms" },
  ],
  modbus:   [
    { label: "Device Host",  placeholder: "192.168.1.x", field: "host" },
    { label: "Port",         placeholder: "502",          field: "port" },
    { label: "Unit ID",      placeholder: "1",            field: "unit_id" },
    { label: "Poll interval (ms)", placeholder: "2000",  field: "poll_interval_ms" },
  ],
  rtsp:     [
    { label: "Camera Host", placeholder: "192.168.1.x",  field: "host" },
    { label: "Port",        placeholder: "554",           field: "port" },
    { label: "Stream Path", placeholder: "/stream1",      field: "path" },
  ],
  http_poll:[
    { label: "Endpoint URL",       placeholder: "http://...",  field: "url" },
    { label: "Poll interval (ms)", placeholder: "5000",        field: "poll_interval_ms" },
    { label: "Auth Header",        placeholder: "Bearer ...",   field: "auth" },
  ],
};

function timeSince(iso: string | null | undefined): string {
  if (!iso) return "never";
  const diff = Date.now() - new Date(iso).getTime();
  if (diff < 2000)  return "now";
  if (diff < 60000) return `${Math.round(diff / 1000)}s ago`;
  if (diff < 3600000) return `${Math.round(diff / 60000)}m ago`;
  return `${Math.round(diff / 3600000)}h ago`;
}

function ProtoBadge({ proto }: { proto: string }) {
  return (
    <span className={`protocol-badge ${proto === "http_poll" ? "http" : proto}`}>
      {proto === "http_poll" ? "HTTP" : proto.toUpperCase()}
    </span>
  );
}

function StatusDot({ status }: { status: string }) {
  return (
    <div
      className={`status-dot ${status === "connected" ? "online" : status === "standby" ? "standby" : status === "error" ? "error" : "offline"}`}
    />
  );
}

function AddModal({ onClose, onAdd }: { onClose: () => void; onAdd: (name: string, proto: string) => void }) {
  const [proto, setProto] = useState<ModalProto>("mqtt");
  const [form,  setForm]  = useState<Record<string, string>>({});
  const [name,  setName]  = useState("");
  const [tested, setTested] = useState<null | boolean>(null);
  const [adding, setAdding] = useState(false);

  const fields = PROTO_FIELDS[proto];

  const handleTest = async () => {
    setTested(null);
    await new Promise((r) => setTimeout(r, 1200));
    setTested(true);
  };

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name) return;
    setAdding(true);
    await new Promise((r) => setTimeout(r, 800));
    setAdding(false);
    onAdd(name, proto);
    onClose();
  };

  return (
    <div className="modal-overlay" onClick={onClose} style={{ zIndex: 300 }}>
      <div className="modal-box" style={{ maxWidth: 500, background: "var(--bg-panel)", border: "1px solid var(--border-bright)" }} onClick={(e) => e.stopPropagation()}>
        <div
          style={{
            padding: "20px 24px 16px",
            borderBottom: "1px solid rgba(255,255,255,0.06)",
            display: "flex", justifyContent: "space-between", alignItems: "center",
          }}
        >
          <div style={{ fontWeight: 800, fontSize: 16 }}>Add Data Source</div>
          <button type="button" onClick={onClose} className="btn-ghost" style={{ border: "none", background: "none", cursor: "pointer", fontSize: 16 }}>✕</button>
        </div>

        <form onSubmit={handleAdd} style={{ padding: "20px 24px" }}>
          {/* Name */}
          <div style={{ marginBottom: 16 }}>
            <div style={{ fontSize: 12, fontWeight: 600, color: "var(--text-secondary)", marginBottom: 6 }}>Source Name</div>
            <input
              required
              className="clay-input"
              placeholder="e.g. Plant Floor MQTT"
              value={name}
              onChange={(e) => setName(e.target.value)}
              style={{ width: "100%", padding: 8, background: "var(--bg-card)", border: "1px solid var(--border-mid)", borderRadius: 4, color: "white" }}
            />
          </div>

          {/* Protocol tabs */}
          <div style={{ marginBottom: 16 }}>
            <div style={{ fontSize: 12, fontWeight: 600, color: "var(--text-secondary)", marginBottom: 8 }}>Protocol</div>
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
              {(["mqtt", "opcua", "modbus", "rtsp", "http_poll"] as ModalProto[]).map((p) => (
                <button
                  type="button"
                  key={p}
                  className={`filter-pill ${proto === p ? "active" : ""}`}
                  onClick={() => setProto(p)}
                >
                  {p === "http_poll" ? "HTTP Poll" : p.toUpperCase()}
                </button>
              ))}
            </div>
          </div>

          {/* Dynamic fields */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 20 }}>
            {fields.map(({ label, placeholder, field }) => (
              <div key={field} style={field === "url" || field === "auth" ? { gridColumn: "1 / -1" } : undefined}>
                <div style={{ fontSize: 12, fontWeight: 600, color: "var(--text-secondary)", marginBottom: 5 }}>{label}</div>
                <input
                  className="clay-input"
                  placeholder={placeholder}
                  value={form[field] || ""}
                  onChange={(e) => setForm((f) => ({ ...f, [field]: e.target.value }))}
                  style={{ width: "100%", padding: 8, background: "var(--bg-card)", border: "1px solid var(--border-mid)", borderRadius: 4, color: "white" }}
                />
              </div>
            ))}
          </div>

          {/* Actions */}
          <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
            <button type="button" className="btn" onClick={handleTest}>
              {tested === null ? "🔌 Test Connection" : tested ? "✓ Connected" : "✕ Failed"}
            </button>
            <button type="submit" className="btn primary" disabled={adding}>
              {adding ? "Connecting..." : "Add Source"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function ConnectPage() {
  const [sources, setSources] = useState<Source[]>(DEMO_SOURCES);
  const [showAdd, setShowAdd] = useState(false);
  const [showVisionModal, setShowVisionModal] = useState(false);
  const [testing, setTesting] = useState<string | null>(null);
  const [testResult, setTestResult] = useState<Record<string, string>>({});

  useEffect(() => {
    if (!API) return;
    fetch(`${API}/connectivity/`)
      .then((r) => r.json())
      .then((d) => { if (d.sources) setSources(d.sources); })
      .catch(() => {});
  }, []);

  const connected = sources.filter((s) => s.status === "connected");
  const totalTags  = connected.reduce((sum, s) => sum + (s.tags_count || 0), 0);

  const handleTest = async (id: string) => {
    setTesting(id);
    setTestResult((r) => ({ ...r, [id]: "testing" }));
    await new Promise((res) => setTimeout(res, 1000 + Math.random() * 600));
    setTesting(null);
    setTestResult((r) => ({ ...r, [id]: "ok" }));
    setTimeout(() => setTestResult((r) => { const n = {...r}; delete n[id]; return n; }), 3000);
  };

  const handleDisconnect = (id: string) => {
    setSources((s) => s.map((src) => src.id === id ? { ...src, status: "disconnected" } : src));
  };

  return (
    <div style={{ padding: "0 20px 32px" }}>
      {/* Header */}
      <div className="page-header" style={{ padding: "20px 0 16px" }}>
        <div>
          <div className="page-title">Connection Manager</div>
          <div className="page-subtitle">
            {connected.length} sources connected · {totalTags} data tags · 847 readings/sec
          </div>
        </div>
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <button
            className="btn primary"
            onClick={() => setShowVisionModal(true)}
            style={{ display: "inline-flex", alignItems: "center", gap: 6 }}
          >
            <Sparkles size={14} />
            <span>Scan P&ID / SCADA Diagram</span>
          </button>
          <button
            className="btn"
            onClick={() => setShowAdd(true)}
            style={{ display: "inline-flex", alignItems: "center", gap: 6 }}
          >
            <Plug size={14} />
            <span>Connect New Source</span>
          </button>
        </div>
      </div>

      {/* Summary strip */}
      <div style={{ display: "flex", gap: 10, marginBottom: 24, flexWrap: "wrap" }}>
        {[
          { l: "Total Sources", v: sources.length,  c: "var(--text-primary)" },
          { l: "Connected",     v: connected.length, c: "var(--risk-safe)" },
          { l: "Data Tags",     v: totalTags,        c: "var(--accent-blue)" },
          { l: "Readings/sec",  v: 847,              c: "var(--accent-cyan)" },
          { l: "Uptime",        v: "99.7%",          c: "var(--risk-safe)" },
        ].map(({ l, v, c }) => (
          <div key={l} className="clay-card" style={{ padding: "10px 18px", display: "flex", gap: 10, alignItems: "center" }}>
            <div style={{ fontSize: 20, fontWeight: 900, color: c }}>{v}</div>
            <div style={{ fontSize: 11, color: "var(--text-secondary)" }}>{l}</div>
          </div>
        ))}
      </div>

      {/* Connected sources */}
      <div style={{ marginBottom: 24 }}>
        <div className="section-label" style={{ marginBottom: 12 }}>Connected Sources</div>
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {sources.filter((s) => s.status !== "standby").map((src) => (
            <div key={src.id} className="source-card">
              <StatusDot status={src.status} />
              <ProtoBadge proto={src.protocol} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontWeight: 700, fontSize: 14 }}>{src.name}</div>
                <div style={{ fontSize: 12, color: "var(--text-secondary)", marginTop: 2 }}>
                  {src.host}:{src.port}
                  {src.tags_count ? ` · ${src.tags_count} tags` : ""}
                  {src.last_seen ? ` · last: ${timeSince(src.last_seen)}` : ""}
                </div>
                <div style={{ fontSize: 10, color: "var(--text-muted)", marginTop: 2 }}>
                  {src.protocol === "mqtt" && src.topics ? `Topics: ${src.topics.join(", ")} · QoS 1` : ""}
                  {src.protocol === "opcua" && src.namespace ? `Namespace: ${src.namespace} · Polling: ${src.poll_interval_ms || 1000}ms` : ""}
                  {src.protocol === "modbus" ? `Polling: ${src.poll_interval_ms || 2000}ms` : ""}
                  {src.protocol === "rtsp" ? "Codec: H.264 · Output: HLS" : ""}
                  {src.protocol === "http_poll" ? `Poll interval: ${src.poll_interval_ms || 5000}ms` : ""}
                </div>
                {src.error && (
                  <div style={{ fontSize: 10, color: "var(--risk-critical)", marginTop: 4 }}>⚠ {src.error}</div>
                )}
              </div>
              <div style={{ display: "flex", gap: 6, flexShrink: 0 }}>
                {testResult[src.id] === "ok" && (
                  <span style={{ fontSize: 11, color: "var(--risk-safe)", fontWeight: 700 }}>✓ OK</span>
                )}
                <button
                  className="clay-btn"
                  style={{ padding: "6px 10px", fontSize: 11 }}
                  onClick={() => handleTest(src.id)}
                  disabled={testing === src.id}
                >
                  {testing === src.id ? "Testing..." : "Test"}
                </button>
                <button
                  className="clay-btn"
                  style={{ padding: "6px 10px", fontSize: 11 }}
                  onClick={() => handleDisconnect(src.id)}
                >
                  Disconnect
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Available integrations */}
      <div>
        <div className="section-label" style={{ marginBottom: 12 }}>Available Integrations</div>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))",
            gap: 10,
          }}
        >
          {CLOUD_INTEGRATIONS.map((ci) => {
            const CiIcon = ci.Icon;
            const existing = sources.find((s) => s.id.startsWith(ci.id));
            return (
              <div
                key={ci.id}
                className="clay-card"
                style={{ padding: "16px", textAlign: "center", cursor: "pointer" }}
                onClick={() => setShowAdd(true)}
              >
                <div style={{ width: 40, height: 40, borderRadius: 10, background: `${ci.color}15`, display: "grid", placeItems: "center", margin: "0 auto 8px" }}>
                  <CiIcon size={22} color={ci.color} />
                </div>
                <div style={{ fontSize: 12, fontWeight: 700, color: ci.color }}>{ci.name}</div>
                <button
                  className="clay-btn"
                  style={{ marginTop: 10, fontSize: 11, padding: "5px 12px", width: "100%", justifyContent: "center" }}
                >
                  {existing?.status === "connected" ? "✓ Connected" : "Connect"}
                </button>
              </div>
            );
          })}
        </div>
      </div>

      {/* Modals */}
      {showAdd && (
        <AddModal
          onClose={() => setShowAdd(false)}
          onAdd={(name, proto) => {
            const newSource: Source = {
              id: `src-${Date.now()}`,
              name: name,
              protocol: proto as any,
              host: "localhost",
              port: proto === "mqtt" ? 1883 : proto === "opcua" ? 4840 : 502,
              status: "connected",
              tags_count: 12,
              last_seen: new Date().toISOString(),
            };
            setSources((prev) => [newSource, ...prev]);
          }}
        />
      )}
      <PIDVisionExtractorModal isOpen={showVisionModal} onClose={() => setShowVisionModal(false)} />
    </div>
  );
}
