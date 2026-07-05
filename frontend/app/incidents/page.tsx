"use client";
import { useEffect, useState } from "react";
import { Clock, Play, Pause, RotateCcw, AlertTriangle, Brain, ChevronRight } from "lucide-react";

interface Incident {
  id: string;
  incident_number: string;
  title: string;
  description: string;
  incident_type: string;
  severity: string;
  occurred_at: string;
  zone: string;
  casualties: number;
  financial_impact: number;
  root_cause: string;
  ai_would_have_caught: boolean;
  ai_intervention_time: string;
  contributing_factors: string[];
}

interface TimelineEvent {
  time: string;
  type: string;
  description: string;
  severity: string;
}

const SEV_COLOR: Record<string, string> = {
  CRITICAL: "var(--risk-critical)",
  HIGH: "var(--risk-high)",
  MEDIUM: "var(--risk-medium)",
  LOW: "var(--risk-low)",
};

export default function IncidentsPage() {
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [selected, setSelected] = useState<Incident | null>(null);
  const [timeline, setTimeline] = useState<TimelineEvent[]>([]);
  const [playbackIdx, setPlaybackIdx] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [rca, setRca] = useState("");
  const [rcaLoading, setRcaLoading] = useState(false);

  useEffect(() => {
    fetch(`${process.env.NEXT_PUBLIC_API_URL}/incidents/`)
      .then((r) => r.json())
      .then((d) => setIncidents(d.incidents || []))
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (!playing) return;
    if (playbackIdx >= timeline.length - 1) { setPlaying(false); return; }
    const t = setTimeout(() => setPlaybackIdx((i) => i + 1), 1200);
    return () => clearTimeout(t);
  }, [playing, playbackIdx, timeline.length]);

  const loadIncident = async (incident: Incident) => {
    setSelected(incident);
    setPlaybackIdx(0);
    setPlaying(false);
    setRca("");

    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/incidents/${incident.id}/timeline`);
    const d = await res.json();
    setTimeline(d.timeline || []);
  };

  const generateRCA = async () => {
    if (!selected || rcaLoading) return;
    setRcaLoading(true);
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/incidents/${selected.id}/rca`);
    const d = await res.json();
    setRca(d.rca_report || "");
    setRcaLoading(false);
  };

  const typeIcon = (type: string) => {
    const icons: Record<string, string> = { sensor: "📡", permit: "📋", ai_flag: "🤖", incident: "💥" };
    return icons[type] || "•";
  };

  return (
    <div style={{ padding: "24px", minHeight: "100vh" }}>
      <div style={{ marginBottom: "20px" }}>
        <h1 style={{ fontSize: "22px", fontWeight: "800", letterSpacing: "-0.02em" }}>
          Incident Timeline Replay
        </h1>
        <p style={{ fontSize: "12px", color: "var(--text-muted)", marginTop: "2px" }}>
          Historical incident replay with AI overlay — see when SafetyOS would have intervened
        </p>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "320px 1fr", gap: "16px" }}>
        {/* Incident list */}
        <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
          {incidents.map((inc) => (
            <div
              key={inc.id}
              className={`glass-card ${selected?.id === inc.id ? "" : ""}`}
              style={{
                padding: "14px",
                cursor: "pointer",
                border: selected?.id === inc.id
                  ? `1px solid ${SEV_COLOR[inc.severity]}50`
                  : "1px solid var(--glass-border)",
                transition: "all 0.2s",
              }}
              onClick={() => loadIncident(inc)}
            >
              <div style={{ display: "flex", gap: "8px", alignItems: "flex-start" }}>
                <div>
                  <div style={{ display: "flex", gap: "6px", alignItems: "center", marginBottom: "4px" }}>
                    <span className={`risk-badge ${inc.severity.toLowerCase()}`}>{inc.severity}</span>
                    <span style={{ fontSize: "10px", color: "var(--text-muted)", fontFamily: "var(--font-mono)" }}>
                      {inc.incident_number}
                    </span>
                  </div>
                  <div style={{ fontSize: "12px", fontWeight: "600", color: "var(--text-primary)", lineHeight: 1.3, marginBottom: "6px" }}>
                    {inc.title}
                  </div>
                  <div style={{ display: "flex", gap: "10px" }}>
                    <span style={{ fontSize: "10px", color: "var(--text-muted)" }}>
                      {new Date(inc.occurred_at).toLocaleDateString("en-IN")}
                    </span>
                    {inc.ai_would_have_caught && (
                      <span style={{ fontSize: "10px", color: "var(--risk-low)", display: "flex", gap: "3px", alignItems: "center" }}>
                        🤖 AI would've caught it
                      </span>
                    )}
                  </div>
                  <div style={{ marginTop: "6px", fontSize: "11px", color: "var(--text-secondary)", fontWeight: "600" }}>
                    💸 ₹{(inc.financial_impact / 100000).toFixed(1)}L impact
                  </div>
                </div>
                <ChevronRight size={14} color="var(--text-muted)" style={{ marginLeft: "auto", flexShrink: 0 }} />
              </div>
            </div>
          ))}
        </div>

        {/* Timeline replay */}
        {selected ? (
          <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
            {/* Incident header */}
            <div className={`glass-card ${selected.severity.toLowerCase()}`} style={{ padding: "16px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                <div>
                  <div style={{ fontSize: "11px", color: "var(--text-muted)", fontFamily: "var(--font-mono)", marginBottom: "4px" }}>{selected.incident_number}</div>
                  <div style={{ fontSize: "16px", fontWeight: "700", color: "var(--text-primary)", marginBottom: "6px" }}>{selected.title}</div>
                  <div style={{ fontSize: "12px", color: "var(--text-secondary)", lineHeight: 1.4 }}>{selected.description}</div>
                </div>
                <div style={{ textAlign: "right", flexShrink: 0, marginLeft: "16px" }}>
                  <div style={{ fontSize: "22px", fontWeight: "800", color: "var(--risk-high)", fontFamily: "var(--font-mono)" }}>
                    ₹{(selected.financial_impact / 100000).toFixed(1)}L
                  </div>
                  <div style={{ fontSize: "10px", color: "var(--text-muted)" }}>financial impact</div>
                </div>
              </div>

              {selected.ai_would_have_caught && (
                <div style={{ marginTop: "12px", padding: "10px 12px", background: "rgba(0,230,118,0.06)", borderRadius: "8px", border: "1px solid rgba(0,230,118,0.2)" }}>
                  <div style={{ fontSize: "12px", color: "var(--risk-low)", fontWeight: "600" }}>
                    🤖 SafetyOS would have flagged this {selected.ai_intervention_time}
                  </div>
                </div>
              )}
            </div>

            {/* Playback controls */}
            <div className="glass-card" style={{ padding: "14px", display: "flex", alignItems: "center", gap: "10px" }}>
              <button
                onClick={() => { setPlaybackIdx(0); setPlaying(false); }}
                className="btn btn-ghost btn-sm"
              >
                <RotateCcw size={14} />
              </button>
              <button
                onClick={() => setPlaying(!playing)}
                className="btn btn-primary btn-sm"
              >
                {playing ? <Pause size={14} /> : <Play size={14} />}
                {playing ? "Pause" : "Play Timeline"}
              </button>
              <div style={{ flex: 1, height: "4px", background: "var(--glass-md)", borderRadius: "2px", overflow: "hidden" }}>
                <div style={{
                  height: "100%",
                  width: `${timeline.length > 0 ? (playbackIdx / (timeline.length - 1)) * 100 : 0}%`,
                  background: "var(--accent-primary)",
                  transition: "width 0.5s ease",
                }} />
              </div>
              <span style={{ fontSize: "11px", color: "var(--text-muted)", whiteSpace: "nowrap" }}>
                Event {playbackIdx + 1}/{timeline.length}
              </span>
            </div>

            {/* Timeline events */}
            <div className="glass-card" style={{ padding: "16px", maxHeight: "400px", overflowY: "auto" }}>
              <div style={{ display: "flex", flexDirection: "column", gap: "0" }}>
                {timeline.slice(0, playbackIdx + 1).map((event, i) => {
                  const color = SEV_COLOR[event.severity] || "var(--text-muted)";
                  const isAI = event.type === "ai_flag";
                  const isIncident = event.type === "incident";

                  return (
                    <div key={i} className="animate-fade-in-up" style={{
                      display: "flex",
                      gap: "12px",
                      paddingBottom: "14px",
                      opacity: i < playbackIdx ? 0.7 : 1,
                    }}>
                      {/* Timeline line */}
                      <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
                        <div style={{
                          width: "24px",
                          height: "24px",
                          borderRadius: "50%",
                          background: isIncident ? "var(--risk-critical)" : isAI ? "var(--risk-low)" : `${color}20`,
                          border: `2px solid ${color}`,
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          fontSize: "11px",
                          flexShrink: 0,
                          boxShadow: (isIncident || isAI) ? `0 0 12px ${isIncident ? "var(--risk-critical)" : "var(--risk-low)"}` : "none",
                        }}>
                          {typeIcon(event.type)}
                        </div>
                        {i < timeline.length - 1 && (
                          <div style={{ width: "1px", flex: 1, minHeight: "20px", background: "var(--glass-border)", marginTop: "4px" }} />
                        )}
                      </div>
                      {/* Event content */}
                      <div style={{ flex: 1, paddingTop: "2px" }}>
                        <div style={{ fontSize: "10px", color: "var(--text-muted)", fontFamily: "var(--font-mono)", marginBottom: "3px" }}>
                          {new Date(event.time).toLocaleTimeString()}
                        </div>
                        <div style={{
                          fontSize: "12px",
                          color: isAI ? "var(--risk-low)" : isIncident ? "var(--risk-critical)" : "var(--text-primary)",
                          fontWeight: (isAI || isIncident) ? "700" : "400",
                          lineHeight: 1.4,
                        }}>
                          {event.description}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* RCA Generator */}
            <div className="glass-card" style={{ padding: "16px" }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "12px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <Brain size={14} color="var(--accent-primary)" />
                  <span style={{ fontSize: "13px", fontWeight: "700" }}>AI Root Cause Analysis</span>
                </div>
                <button onClick={generateRCA} className="btn btn-primary btn-sm" disabled={rcaLoading}>
                  {rcaLoading ? "Analyzing..." : "Generate RCA"}
                </button>
              </div>
              {rca && (
                <div style={{
                  fontSize: "12px",
                  color: "var(--text-primary)",
                  lineHeight: 1.7,
                  whiteSpace: "pre-wrap",
                  background: "var(--glass-xs)",
                  padding: "12px",
                  borderRadius: "8px",
                  border: "1px solid var(--glass-border)",
                  maxHeight: "300px",
                  overflowY: "auto",
                }}>
                  {rca}
                </div>
              )}
            </div>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: "12px", opacity: 0.4 }}>
            <Clock size={48} />
            <div style={{ fontSize: "14px", color: "var(--text-muted)" }}>Select an incident to replay its timeline</div>
          </div>
        )}
      </div>
    </div>
  );
}
