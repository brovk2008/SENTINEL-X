"use client";
import React, { useEffect, useState } from "react";

const API = process.env.NEXT_PUBLIC_API_URL || "";

export default function SettingsPage() {
  const [geminiKey, setGeminiKey] = useState("");
  const [openrouterKey, setOpenrouterKey] = useState("");
  const [anthropicKey, setAnthropicKey] = useState("");
  const [ollamaUrl, setOllamaUrl] = useState("http://localhost:11434");
  const [defaultProvider, setDefaultProvider] = useState("gemini");

  const [loading, setLoading] = useState(false);
  const [saveStatus, setSaveStatus] = useState<{ type: "success" | "error"; msg: string } | null>(null);
  const [testStatus, setTestStatus] = useState<{ type: "success" | "error"; msg: string } | null>(null);
  const [testing, setTesting] = useState(false);
  const [activeConfig, setActiveConfig] = useState<any>(null);

  useEffect(() => {
    // Load local stored keys if available
    if (typeof window !== "undefined") {
      const g = localStorage.getItem("sentinel_gemini_key");
      const o = localStorage.getItem("sentinel_openrouter_key");
      const a = localStorage.getItem("sentinel_anthropic_key");
      const d = localStorage.getItem("sentinel_default_provider");
      if (g) setGeminiKey(g);
      if (o) setOpenrouterKey(o);
      if (a) setAnthropicKey(a);
      if (d) setDefaultProvider(d);
    }

    // Fetch current settings from backend
    if (API) {
      fetch(`${API}/settings/llm`)
        .then((r) => r.json())
        .then((d) => {
          setActiveConfig(d);
          if (d.active_provider) setDefaultProvider(d.active_provider);
          if (d.ollama_url) setOllamaUrl(d.ollama_url);
        })
        .catch(() => {});
    }
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setSaveStatus(null);

    // Save to local storage
    if (typeof window !== "undefined") {
      if (geminiKey) localStorage.setItem("sentinel_gemini_key", geminiKey);
      if (openrouterKey) localStorage.setItem("sentinel_openrouter_key", openrouterKey);
      if (anthropicKey) localStorage.setItem("sentinel_anthropic_key", anthropicKey);
      localStorage.setItem("sentinel_default_provider", defaultProvider);
    }

    try {
      if (API) {
        const res = await fetch(`${API}/settings/llm`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            gemini_key: geminiKey,
            openrouter_key: openrouterKey,
            anthropic_key: anthropicKey,
            ollama_url: ollamaUrl,
            default_provider: defaultProvider,
          }),
        });
        const data = await res.json();
        if (res.ok) {
          setSaveStatus({ type: "success", msg: "API Keys and LLM Settings updated successfully!" });
          // Refresh status
          const refresh = await fetch(`${API}/settings/llm`);
          if (refresh.ok) {
            setActiveConfig(await refresh.json());
          }
        } else {
          setSaveStatus({ type: "error", msg: data.detail || "Failed to update backend settings." });
        }
      } else {
        setSaveStatus({ type: "success", msg: "Saved locally (Backend API URL not set)." });
      }
    } catch (err: any) {
      setSaveStatus({ type: "error", msg: err.message || "Failed to reach backend server." });
    } finally {
      setLoading(false);
    }
  };

  const handleTest = async (provider: string) => {
    setTesting(true);
    setTestStatus(null);

    try {
      if (!API) {
        throw new Error("Backend API URL is not configured.");
      }
      const res = await fetch(`${API}/settings/llm/test?provider=${provider}`);
      const data = await res.json();
      if (data.status === "success") {
        setTestStatus({
          type: "success",
          msg: `✅ ${provider.toUpperCase()} connection successful! Response: "${data.response}"`,
        });
      } else {
        setTestStatus({
          type: "error",
          msg: `❌ ${provider.toUpperCase()} test failed: ${data.error || "Unknown error"}`,
        });
      }
    } catch (err: any) {
      setTestStatus({ type: "error", msg: `Failed to test provider: ${err.message}` });
    } finally {
      setTesting(false);
    }
  };

  return (
    <div style={{ padding: "0 20px 48px", maxWidth: 1100, margin: "0 auto" }}>
      {/* Page Header */}
      <div className="page-header" style={{ padding: "24px 0 20px", display: "flex", alignItems: "center", gap: 16 }}>
        <img
          src="/logo.png"
          alt="Sentinel X Logo"
          style={{ width: 48, height: 48, objectFit: "contain", borderRadius: 10 }}
        />
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 900, letterSpacing: "-0.02em" }}>System Settings & API Keys</h1>
          <p style={{ color: "var(--text-secondary)", fontSize: 13, marginTop: 2 }}>
            Configure custom LLM provider credentials and operational preferences for Sentinel X
          </p>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(340px, 1fr))", gap: 20 }}>
        {/* API Keys Form Card */}
        <div className="clay-card" style={{ padding: 24 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <span style={{ fontSize: 20 }}>🔑</span>
              <h2 style={{ fontSize: 16, fontWeight: 800 }}>LLM Provider API Keys</h2>
            </div>
            <span style={{ fontSize: 11, background: "rgba(0,212,255,0.12)", color: "#00d4ff", padding: "3px 10px", borderRadius: 999, fontWeight: 700 }}>
              Runtime Config
            </span>
          </div>

          <form onSubmit={handleSave} style={{ display: "flex", flexDirection: "column", gap: 18 }}>
            {/* Google Gemini Key */}
            <div>
              <label style={{ display: "block", fontSize: 12, fontWeight: 700, marginBottom: 6, color: "var(--text-primary)" }}>
                Google Gemini API Key (Recommended / Free Tier)
              </label>
              <div style={{ position: "relative" }}>
                <input
                  type="password"
                  value={geminiKey}
                  onChange={(e) => setGeminiKey(e.target.value)}
                  placeholder={activeConfig?.gemini_key_masked || "AIzaSy..."}
                  style={{
                    width: "100%",
                    padding: "10px 14px",
                    borderRadius: 10,
                    background: "rgba(0,0,0,0.25)",
                    border: "1px solid rgba(255,255,255,0.1)",
                    color: "#fff",
                    fontSize: 13,
                    outline: "none",
                  }}
                />
              </div>
              <div style={{ fontSize: 10, color: "var(--text-muted)", marginTop: 4 }}>
                {activeConfig?.gemini_configured ? "✅ Active on backend" : "⚠️ Key not configured"} — Get a free key at ai.google.dev
              </div>
            </div>

            {/* OpenRouter Key */}
            <div>
              <label style={{ display: "block", fontSize: 12, fontWeight: 700, marginBottom: 6, color: "var(--text-primary)" }}>
                OpenRouter API Key (Supports 100+ Models)
              </label>
              <input
                type="password"
                value={openrouterKey}
                onChange={(e) => setOpenrouterKey(e.target.value)}
                placeholder={activeConfig?.openrouter_key_masked || "sk-or-v1-..."}
                style={{
                  width: "100%",
                  padding: "10px 14px",
                  borderRadius: 10,
                  background: "rgba(0,0,0,0.25)",
                  border: "1px solid rgba(255,255,255,0.1)",
                  color: "#fff",
                  fontSize: 13,
                  outline: "none",
                }}
              />
              <div style={{ fontSize: 10, color: "var(--text-muted)", marginTop: 4 }}>
                {activeConfig?.openrouter_configured ? "✅ Active on backend" : "⚠️ Key not configured"} — Access DeepSeek, Llama, Gemini & Claude
              </div>
            </div>

            {/* Anthropic Claude Key */}
            <div>
              <label style={{ display: "block", fontSize: 12, fontWeight: 700, marginBottom: 6, color: "var(--text-primary)" }}>
                Anthropic Claude API Key
              </label>
              <input
                type="password"
                value={anthropicKey}
                onChange={(e) => setAnthropicKey(e.target.value)}
                placeholder={activeConfig?.anthropic_key_masked || "sk-ant-..."}
                style={{
                  width: "100%",
                  padding: "10px 14px",
                  borderRadius: 10,
                  background: "rgba(0,0,0,0.25)",
                  border: "1px solid rgba(255,255,255,0.1)",
                  color: "#fff",
                  fontSize: 13,
                  outline: "none",
                }}
              />
              <div style={{ fontSize: 10, color: "var(--text-muted)", marginTop: 4 }}>
                {activeConfig?.anthropic_configured ? "✅ Active on backend" : "⚠️ Key not configured"} — Direct access to Claude 3.5 Haiku & Sonnet
              </div>
            </div>

            {/* Ollama Base URL */}
            <div>
              <label style={{ display: "block", fontSize: 12, fontWeight: 700, marginBottom: 6, color: "var(--text-primary)" }}>
                Local Ollama Base URL (Offline AI)
              </label>
              <input
                type="text"
                value={ollamaUrl}
                onChange={(e) => setOllamaUrl(e.target.value)}
                placeholder="http://localhost:11434"
                style={{
                  width: "100%",
                  padding: "10px 14px",
                  borderRadius: 10,
                  background: "rgba(0,0,0,0.25)",
                  border: "1px solid rgba(255,255,255,0.1)",
                  color: "#fff",
                  fontSize: 13,
                  outline: "none",
                }}
              />
            </div>

            {/* Default Primary Provider */}
            <div>
              <label style={{ display: "block", fontSize: 12, fontWeight: 700, marginBottom: 6, color: "var(--text-primary)" }}>
                Primary Default Provider
              </label>
              <select
                value={defaultProvider}
                onChange={(e) => setDefaultProvider(e.target.value)}
                style={{
                  width: "100%",
                  padding: "10px 14px",
                  borderRadius: 10,
                  background: "rgba(20,25,40,0.9)",
                  border: "1px solid rgba(255,255,255,0.15)",
                  color: "#fff",
                  fontSize: 13,
                  outline: "none",
                  cursor: "pointer",
                }}
              >
                <option value="gemini">Google Gemini (Recommended)</option>
                <option value="openrouter">OpenRouter (Multi-Model)</option>
                <option value="anthropic">Anthropic Claude</option>
                <option value="ollama">Local Ollama (Offline)</option>
              </select>
            </div>

            {saveStatus && (
              <div
                style={{
                  padding: "10px 14px",
                  borderRadius: 8,
                  fontSize: 12,
                  fontWeight: 600,
                  background: saveStatus.type === "success" ? "rgba(0,255,136,0.12)" : "rgba(255,59,59,0.12)",
                  color: saveStatus.type === "success" ? "#00ff88" : "#ff3b3b",
                  border: `1px solid ${saveStatus.type === "success" ? "rgba(0,255,136,0.25)" : "rgba(255,59,59,0.25)"}`,
                }}
              >
                {saveStatus.msg}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="clay-button"
              style={{
                padding: "12px 20px",
                borderRadius: 10,
                background: "linear-gradient(135deg, #00d4ff, #4d8eff)",
                color: "#fff",
                fontWeight: 800,
                fontSize: 13,
                cursor: "pointer",
                border: "none",
                marginTop: 6,
              }}
            >
              {loading ? "Saving API Keys..." : "Save Settings & Update Backend"}
            </button>
          </form>
        </div>

        {/* System & Connection Test Card */}
        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          {/* Live Test Card */}
          <div className="clay-card" style={{ padding: 24 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
              <span style={{ fontSize: 20 }}>⚡</span>
              <h2 style={{ fontSize: 16, fontWeight: 800 }}>Live Connection Test</h2>
            </div>
            <p style={{ fontSize: 12, color: "var(--text-secondary)", marginBottom: 16 }}>
              Test your configured API key live to ensure Sentinel X multi-agent debate and copilot models respond.
            </p>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
              <button
                type="button"
                onClick={() => handleTest("gemini")}
                disabled={testing}
                className="clay-button"
                style={{ padding: "10px", fontSize: 12, fontWeight: 700, background: "rgba(0,212,255,0.12)", color: "#00d4ff", border: "1px solid rgba(0,212,255,0.25)", borderRadius: 8, cursor: "pointer" }}
              >
                Test Gemini
              </button>
              <button
                type="button"
                onClick={() => handleTest("openrouter")}
                disabled={testing}
                className="clay-button"
                style={{ padding: "10px", fontSize: 12, fontWeight: 700, background: "rgba(155,89,255,0.12)", color: "#9b59ff", border: "1px solid rgba(155,89,255,0.25)", borderRadius: 8, cursor: "pointer" }}
              >
                Test OpenRouter
              </button>
              <button
                type="button"
                onClick={() => handleTest("anthropic")}
                disabled={testing}
                className="clay-button"
                style={{ padding: "10px", fontSize: 12, fontWeight: 700, background: "rgba(255,170,0,0.12)", color: "#ffaa00", border: "1px solid rgba(255,170,0,0.25)", borderRadius: 8, cursor: "pointer" }}
              >
                Test Anthropic
              </button>
              <button
                type="button"
                onClick={() => handleTest("ollama")}
                disabled={testing}
                className="clay-button"
                style={{ padding: "10px", fontSize: 12, fontWeight: 700, background: "rgba(0,255,136,0.12)", color: "#00ff88", border: "1px solid rgba(0,255,136,0.25)", borderRadius: 8, cursor: "pointer" }}
              >
                Test Ollama
              </button>
            </div>

            {testStatus && (
              <div
                style={{
                  marginTop: 16,
                  padding: "12px",
                  borderRadius: 8,
                  fontSize: 12,
                  background: testStatus.type === "success" ? "rgba(0,255,136,0.1)" : "rgba(255,59,59,0.1)",
                  color: testStatus.type === "success" ? "#00ff88" : "#ff3b3b",
                  border: `1px solid ${testStatus.type === "success" ? "rgba(0,255,136,0.2)" : "rgba(255,59,59,0.2)"}`,
                }}
              >
                {testStatus.msg}
              </div>
            )}
          </div>

          {/* Plant Info Card */}
          <div className="clay-card" style={{ padding: 24 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
              <span style={{ fontSize: 20 }}>🏭</span>
              <h2 style={{ fontSize: 16, fontWeight: 800 }}>Plant & Intelligence Profile</h2>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 10, fontSize: 13 }}>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span style={{ color: "var(--text-secondary)" }}>System Name:</span>
                <span style={{ fontWeight: 800, color: "#00ff88" }}>Sentinel X</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span style={{ color: "var(--text-secondary)" }}>Plant Location:</span>
                <span style={{ fontWeight: 600 }}>Bharat Petrochemicals · Unit 3</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span style={{ color: "var(--text-secondary)" }}>Compound Risk Rules:</span>
                <span style={{ fontWeight: 600 }}>20 Rules Active</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span style={{ color: "var(--text-secondary)" }}>AI Multi-Agent Suite:</span>
                <span style={{ fontWeight: 600 }}>7 Agents (Debate Engine)</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span style={{ color: "var(--text-secondary)" }}>Backend API URL:</span>
                <span style={{ fontFamily: "monospace", fontSize: 11, color: "var(--text-muted)" }}>{API || "Local Mode"}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
