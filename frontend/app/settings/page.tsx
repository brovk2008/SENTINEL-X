"use client";
import { useState, useEffect } from "react";
import { Settings, Check, TestTube, Cpu, Camera, Bell, Shield } from "lucide-react";
import { useStore } from "../../lib/store";

const LLM_PRESETS = [
  { id: "gemini-flash", provider: "gemini", model: "gemini-2.0-flash-exp", label: "Gemini Flash 2.0 (FREE)", badge: "Recommended", speed: "Fast", cost: "Free" },
  { id: "gemini-pro", provider: "gemini", model: "gemini-2.5-pro", label: "Gemini Pro 2.5", badge: "Powerful", speed: "Medium", cost: "Paid" },
  { id: "openrouter-mistral", provider: "openrouter", model: "mistralai/mistral-7b-instruct", label: "Mistral 7B (OpenRouter)", badge: "", speed: "Fast", cost: "~Free" },
  { id: "openrouter-llama", provider: "openrouter", model: "meta-llama/llama-3.3-70b-instruct", label: "Llama 3.3 70B (OpenRouter)", badge: "High Quality", speed: "Medium", cost: "Low" },
  { id: "ollama-qwen", provider: "ollama", model: "qwen2.5:7b", label: "Qwen 2.5 7B (Local Ollama)", badge: "Local", speed: "Fast", cost: "Free" },
  { id: "ollama-llama", provider: "ollama", model: "llama3.2:3b", label: "Llama 3.2 3B (Local Ollama)", badge: "Fastest Local", speed: "Very Fast", cost: "Free" },
];

const PLANT_TYPES = ["Petroleum Refinery", "Chemical Plant", "Steel Plant", "Pharmaceutical", "Power Plant", "Fertilizer Plant", "Gas Processing Plant", "Petrochemical Complex"];

export default function SettingsPage() {
  const { llmProvider, llmModel, setLLMConfig } = useStore();
  const [testResult, setTestResult] = useState<{ status: string; response?: string; error?: string } | null>(null);
  const [testing, setTesting] = useState(false);
  const [selectedPreset, setSelectedPreset] = useState("gemini-flash");
  const [selectedPlant, setSelectedPlant] = useState("Petroleum Refinery");
  const [cameraSource, setCameraSource] = useState("simulated");
  const [apiKeys, setApiKeys] = useState({ gemini: "", openrouter: "", anthropic: "" });
  const [saved, setSaved] = useState(false);

  const testLLM = async () => {
    setTesting(true);
    setTestResult(null);
    const preset = LLM_PRESETS.find((p) => p.id === selectedPreset);
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/settings/llm/test?provider=${preset?.provider}&model=${preset?.model}`);
      const d = await res.json();
      setTestResult(d);
    } catch (e) {
      setTestResult({ status: "error", error: "Backend not reachable" });
    } finally {
      setTesting(false);
    }
  };

  const save = () => {
    const preset = LLM_PRESETS.find((p) => p.id === selectedPreset);
    if (preset) setLLMConfig(preset.provider, preset.model);
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  return (
    <div style={{ padding: "24px", minHeight: "100vh" }}>
      <div style={{ marginBottom: "24px" }}>
        <h1 style={{ fontSize: "22px", fontWeight: "800", letterSpacing: "-0.02em" }}>Settings & Configuration</h1>
        <p style={{ fontSize: "12px", color: "var(--text-muted)", marginTop: "2px" }}>Configure AI providers, plant type, camera sources, and notifications</p>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px", maxWidth: "900px" }}>
        {/* LLM Configuration */}
        <div className="glass-card" style={{ padding: "20px", gridColumn: "1/-1" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "16px" }}>
            <Cpu size={16} color="var(--accent-primary)" />
            <span style={{ fontSize: "14px", fontWeight: "700" }}>AI / LLM Configuration</span>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "10px", marginBottom: "16px" }}>
            {LLM_PRESETS.map((preset) => (
              <div
                key={preset.id}
                onClick={() => setSelectedPreset(preset.id)}
                style={{
                  padding: "12px",
                  borderRadius: "10px",
                  border: `1px solid ${selectedPreset === preset.id ? "var(--accent-primary)" : "var(--glass-border)"}`,
                  background: selectedPreset === preset.id ? "rgba(74,128,255,0.08)" : "var(--glass-xs)",
                  cursor: "pointer",
                  transition: "all 0.15s",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "4px" }}>
                  <div style={{
                    width: 14, height: 14, borderRadius: "50%",
                    border: `2px solid var(--accent-primary)`,
                    background: selectedPreset === preset.id ? "var(--accent-primary)" : "transparent",
                    display: "flex", alignItems: "center", justifyContent: "center",
                  }}>
                    {selectedPreset === preset.id && <Check size={8} color="white" />}
                  </div>
                  <span style={{ fontSize: "12px", fontWeight: "600", color: "var(--text-primary)" }}>{preset.label}</span>
                </div>
                <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
                  {preset.badge && (
                    <span style={{ fontSize: "9px", fontWeight: "700", background: "rgba(74,128,255,0.15)", color: "var(--accent-primary)", padding: "1px 5px", borderRadius: "4px" }}>
                      {preset.badge}
                    </span>
                  )}
                  <span style={{ fontSize: "9px", color: "var(--text-muted)" }}>⚡ {preset.speed} • {preset.cost}</span>
                </div>
              </div>
            ))}
          </div>

          {/* API Key inputs */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "10px", marginBottom: "14px" }}>
            {[
              { key: "gemini", label: "Google Gemini API Key", placeholder: "AIzaSy..." },
              { key: "openrouter", label: "OpenRouter API Key", placeholder: "sk-or-..." },
              { key: "anthropic", label: "Anthropic API Key", placeholder: "sk-ant-..." },
            ].map((field) => (
              <div key={field.key}>
                <label style={{ fontSize: "11px", color: "var(--text-muted)", marginBottom: "4px", display: "block" }}>
                  {field.label}
                </label>
                <input
                  className="input"
                  type="password"
                  placeholder={field.placeholder}
                  value={apiKeys[field.key as keyof typeof apiKeys]}
                  onChange={(e) => setApiKeys((prev) => ({ ...prev, [field.key]: e.target.value }))}
                  style={{ fontSize: "12px" }}
                />
              </div>
            ))}
          </div>

          <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
            <button onClick={testLLM} className="btn btn-ghost btn-sm" disabled={testing}>
              <TestTube size={13} /> {testing ? "Testing..." : "Test Connection"}
            </button>
            <button onClick={save} className="btn btn-primary btn-sm">
              {saved ? <><Check size={13} /> Saved!</> : "Save LLM Config"}
            </button>
            {testResult && (
              <span style={{
                fontSize: "12px",
                color: testResult.status === "success" ? "var(--risk-low)" : "var(--risk-critical)",
              }}>
                {testResult.status === "success" ? "✅ Connected!" : `❌ ${testResult.error}`}
              </span>
            )}
          </div>
        </div>

        {/* Plant Type */}
        <div className="glass-card" style={{ padding: "20px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "14px" }}>
            <Shield size={16} color="var(--accent-cyan)" />
            <span style={{ fontSize: "14px", fontWeight: "700" }}>Plant Type</span>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
            {PLANT_TYPES.map((pt) => (
              <label key={pt} style={{ display: "flex", alignItems: "center", gap: "8px", cursor: "pointer", padding: "6px 8px", borderRadius: "7px", background: selectedPlant === pt ? "rgba(0,212,255,0.08)" : "transparent" }}>
                <input
                  type="radio"
                  name="plant-type"
                  checked={selectedPlant === pt}
                  onChange={() => setSelectedPlant(pt)}
                  style={{ accentColor: "var(--accent-cyan)" }}
                />
                <span style={{ fontSize: "12px", color: selectedPlant === pt ? "var(--accent-cyan)" : "var(--text-secondary)" }}>{pt}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Camera Sources */}
        <div className="glass-card" style={{ padding: "20px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "14px" }}>
            <Camera size={16} color="var(--risk-medium)" />
            <span style={{ fontSize: "14px", fontWeight: "700" }}>Camera Sources</span>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
            {[
              { id: "simulated", label: "Simulated Demo Feed", desc: "AI-generated detection data" },
              { id: "webcam", label: "Laptop Webcam", desc: "USB / Built-in camera" },
              { id: "rtsp", label: "Network RTSP Stream", desc: "IP cameras, DVR/NVR" },
              { id: "video", label: "Video File", desc: "Pre-recorded .mp4 file" },
            ].map((src) => (
              <label key={src.id} style={{ display: "flex", alignItems: "center", gap: "10px", cursor: "pointer" }}>
                <input
                  type="radio"
                  name="camera"
                  checked={cameraSource === src.id}
                  onChange={() => setCameraSource(src.id)}
                  style={{ accentColor: "var(--risk-medium)" }}
                />
                <div>
                  <div style={{ fontSize: "12px", fontWeight: "600", color: "var(--text-primary)" }}>{src.label}</div>
                  <div style={{ fontSize: "11px", color: "var(--text-muted)" }}>{src.desc}</div>
                </div>
              </label>
            ))}
            {cameraSource === "rtsp" && (
              <input className="input" placeholder="rtsp://192.168.1.100:554/stream" style={{ fontSize: "12px", marginTop: "4px" }} />
            )}
            {cameraSource === "video" && (
              <input className="input" placeholder="/path/to/video.mp4" style={{ fontSize: "12px", marginTop: "4px" }} />
            )}
          </div>
        </div>

        {/* Notifications */}
        <div className="glass-card" style={{ padding: "20px", gridColumn: "1/-1" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "14px" }}>
            <Bell size={16} color="var(--risk-high)" />
            <span style={{ fontSize: "14px", fontWeight: "700" }}>Notification Modes</span>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "12px" }}>
            {[
              { id: "in_app", label: "In-App Toast", desc: "Immediate on-screen alerts", enabled: true, icon: "🔔" },
              { id: "fcm", label: "Firebase Push (Mobile)", desc: "Phone notifications via QR pairing", enabled: false, icon: "📱" },
              { id: "sms", label: "Twilio SMS", desc: "SMS alerts to supervisors", enabled: false, icon: "💬" },
            ].map((mode) => (
              <div key={mode.id} style={{ padding: "12px", background: "var(--glass-xs)", borderRadius: "10px", border: `1px solid ${mode.enabled ? "rgba(0,230,118,0.2)" : "var(--glass-border)"}` }}>
                <div style={{ fontSize: "20px", marginBottom: "6px" }}>{mode.icon}</div>
                <div style={{ fontSize: "12px", fontWeight: "700", color: "var(--text-primary)", marginBottom: "3px" }}>{mode.label}</div>
                <div style={{ fontSize: "11px", color: "var(--text-muted)", marginBottom: "8px" }}>{mode.desc}</div>
                <div style={{
                  display: "inline-block",
                  fontSize: "9px",
                  fontWeight: "700",
                  padding: "2px 8px",
                  borderRadius: "10px",
                  background: mode.enabled ? "var(--risk-low-bg)" : "var(--glass-sm)",
                  color: mode.enabled ? "var(--risk-low)" : "var(--text-muted)",
                  border: `1px solid ${mode.enabled ? "rgba(0,230,118,0.2)" : "var(--glass-border)"}`,
                }}>
                  {mode.enabled ? "✓ ACTIVE" : "CONFIGURE"}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
