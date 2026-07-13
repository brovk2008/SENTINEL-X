"use client";
import React, { useEffect, useState } from "react";
import { HeartPulse, Siren, Phone, FileText, Users, MapPin } from "lucide-react";

const API = process.env.NEXT_PUBLIC_API_URL || "";

interface WorkerBio {
  worker_id: string;
  worker_name: string;
  zone_id: string;
  role: string;
  shift_hours: number;
  heart_rate: number;
  heart_rate_variability: number;
  spo2: number;
  skin_temperature: number;
  ambient_temp: number;
  ambient_humidity: number;
  activity_level: string;
  steps_this_shift: number;
  standing_hours: number;
  postural_strain_score: number;
  cognitive_load_score: number;
  reaction_time_ms: number;
  h2s_twa_ppm: number;
  co_twa_ppm: number;
  cumulative_dose_pct: number;
  psi_score: number;
  psi_components: Record<string, number>;
  wbgt_c: number;
  status: "OPTIMAL" | "CAUTION" | "HEAT_STRESS" | "FATIGUE" | "CARDIAC_ALERT" | "FALL_DETECTED" | "MAN_DOWN";
  alerts: string[];
  last_updated: string;
}

interface FleetSummary {
  total_workers: number;
  at_risk: number;
  heat_stress_cases: number;
  cardiac_alerts: number;
  fatigue_cases: number;
  avg_psi: number;
  max_psi: number;
  workers_over_psi_7: number;
  workers_over_psi_8: number;
  avg_h2s_dose_pct: number;
  workers_over_80pct_dose: number;
  avg_shift_hours: number;
  workers_over_10h: number;
  avg_wbgt_c: number;
  status_distribution: Record<string, number>;
}

const MOCK_WORKERS: WorkerBio[] = [
  {
    worker_id: "W-01", worker_name: "Rajesh Kumar", zone_id: "ZC", role: "Compressor Operator", shift_hours: 6.5,
    heart_rate: 142, heart_rate_variability: 18.2, spo2: 95.5, skin_temperature: 38.2, ambient_temp: 46.0, ambient_humidity: 65.0,
    activity_level: "heavy_work", steps_this_shift: 7200, standing_hours: 4.8, postural_strain_score: 72.4, cognitive_load_score: 84.1, reaction_time_ms: 312,
    h2s_twa_ppm: 0.812, co_twa_ppm: 3.12, cumulative_dose_pct: 81.2, psi_score: 8.4, psi_components: { heart_rate_contribution: 4.2, temperature_contribution: 4.2 },
    wbgt_c: 34.2, status: "HEAT_STRESS", alerts: ["🚨 EMERGENCY WITHDRAW: PSI = 8.4 — extreme physiological strain", "H₂S cumulative dose: 81% of daily limit"],
    last_updated: new Date().toISOString()
  },
  {
    worker_id: "W-02", worker_name: "Priya Sharma", zone_id: "ZB", role: "Safety Officer", shift_hours: 4.2,
    heart_rate: 82, heart_rate_variability: 48.5, spo2: 98.8, skin_temperature: 35.6, ambient_temp: 42.0, ambient_humidity: 68.0,
    activity_level: "walking", steps_this_shift: 4800, standing_hours: 3.0, postural_strain_score: 22.1, cognitive_load_score: 41.5, reaction_time_ms: 242,
    h2s_twa_ppm: 0.124, co_twa_ppm: 1.10, cumulative_dose_pct: 12.4, psi_score: 2.8, psi_components: { heart_rate_contribution: 1.2, temperature_contribution: 1.6 },
    wbgt_c: 31.8, status: "OPTIMAL", alerts: [], last_updated: new Date().toISOString()
  },
  {
    worker_id: "W-03", worker_name: "Arjun Mehta", zone_id: "ZC", role: "Welding Specialist", shift_hours: 8.1,
    heart_rate: 112, heart_rate_variability: 28.1, spo2: 97.2, skin_temperature: 36.8, ambient_temp: 46.0, ambient_humidity: 65.0,
    activity_level: "heavy_work", steps_this_shift: 8900, standing_hours: 6.2, postural_strain_score: 65.0, cognitive_load_score: 68.4, reaction_time_ms: 290,
    h2s_twa_ppm: 0.912, co_twa_ppm: 4.12, cumulative_dose_pct: 91.2, psi_score: 5.8, psi_components: { heart_rate_contribution: 2.5, temperature_contribution: 3.3 },
    wbgt_c: 34.2, status: "CAUTION", alerts: ["H₂S cumulative dose: 91% of daily limit"], last_updated: new Date().toISOString()
  },
  {
    worker_id: "W-04", worker_name: "Sunita Patel", zone_id: "ZA", role: "HSE Inspector", shift_hours: 5.0,
    heart_rate: 88, heart_rate_variability: 42.0, spo2: 98.5, skin_temperature: 35.8, ambient_temp: 38.0, ambient_humidity: 72.0,
    activity_level: "walking", steps_this_shift: 5600, standing_hours: 3.5, postural_strain_score: 30.2, cognitive_load_score: 48.0, reaction_time_ms: 250,
    h2s_twa_ppm: 0.180, co_twa_ppm: 1.80, cumulative_dose_pct: 18.0, psi_score: 3.2, psi_components: { heart_rate_contribution: 1.4, temperature_contribution: 1.8 },
    wbgt_c: 29.5, status: "OPTIMAL", alerts: [], last_updated: new Date().toISOString()
  },
  {
    worker_id: "W-05", worker_name: "Vikram Singh", zone_id: "ZB", role: "Shift Supervisor", shift_hours: 7.3,
    heart_rate: 94, heart_rate_variability: 35.4, spo2: 98.0, skin_temperature: 36.1, ambient_temp: 42.0, ambient_humidity: 68.0,
    activity_level: "walking", steps_this_shift: 8100, standing_hours: 5.5, postural_strain_score: 41.5, cognitive_load_score: 54.2, reaction_time_ms: 268,
    h2s_twa_ppm: 0.280, co_twa_ppm: 2.10, cumulative_dose_pct: 28.0, psi_score: 3.9, psi_components: { heart_rate_contribution: 1.8, temperature_contribution: 2.1 },
    wbgt_c: 31.8, status: "OPTIMAL", alerts: [], last_updated: new Date().toISOString()
  },
  {
    worker_id: "W-06", worker_name: "Anita Reddy", zone_id: "ZC", role: "Process Tech", shift_hours: 9.2,
    heart_rate: 104, heart_rate_variability: 25.1, spo2: 96.8, skin_temperature: 37.0, ambient_temp: 46.0, ambient_humidity: 65.0,
    activity_level: "heavy_work", steps_this_shift: 10100, standing_hours: 7.0, postural_strain_score: 58.2, cognitive_load_score: 62.0, reaction_time_ms: 285,
    h2s_twa_ppm: 0.650, co_twa_ppm: 3.50, cumulative_dose_pct: 65.0, psi_score: 4.8, psi_components: { heart_rate_contribution: 2.1, temperature_contribution: 2.7 },
    wbgt_c: 34.2, status: "CAUTION", alerts: [], last_updated: new Date().toISOString()
  },
  {
    worker_id: "W-07", worker_name: "Mohammed Ali", zone_id: "ZE", role: "Maintenance Tech", shift_hours: 3.1,
    heart_rate: 80, heart_rate_variability: 50.2, spo2: 99.0, skin_temperature: 35.4, ambient_temp: 35.0, ambient_humidity: 70.0,
    activity_level: "heavy_work", steps_this_shift: 3400, standing_hours: 2.0, postural_strain_score: 18.0, cognitive_load_score: 38.0, reaction_time_ms: 238,
    h2s_twa_ppm: 0.110, co_twa_ppm: 0.90, cumulative_dose_pct: 11.0, psi_score: 2.4, psi_components: { heart_rate_contribution: 1.0, temperature_contribution: 1.4 },
    wbgt_c: 28.4, status: "OPTIMAL", alerts: [], last_updated: new Date().toISOString()
  },
  {
    worker_id: "W-08", worker_name: "Lakshmi Nair", zone_id: "ZD", role: "Panel Operator", shift_hours: 11.2,
    heart_rate: 98, heart_rate_variability: 20.4, spo2: 97.5, skin_temperature: 36.3, ambient_temp: 26.0, ambient_humidity: 55.0,
    activity_level: "resting", steps_this_shift: 1800, standing_hours: 8.2, postural_strain_score: 45.0, cognitive_load_score: 75.2, reaction_time_ms: 325,
    h2s_twa_ppm: 0.050, co_twa_ppm: 0.40, cumulative_dose_pct: 5.0, psi_score: 4.1, psi_components: { heart_rate_contribution: 2.0, temperature_contribution: 2.1 },
    wbgt_c: 21.5, status: "FATIGUE", alerts: ["Extended shift: 11.2h — fatigue risk HIGH"], last_updated: new Date().toISOString()
  }
];

const MOCK_SUMMARY: FleetSummary = {
  total_workers: 8,
  at_risk: 3,
  heat_stress_cases: 1,
  cardiac_alerts: 1,
  fatigue_cases: 1,
  avg_psi: 4.5,
  max_psi: 8.4,
  workers_over_psi_7: 2,
  workers_over_psi_8: 1,
  avg_h2s_dose_pct: 38.1,
  workers_over_80pct_dose: 2,
  avg_shift_hours: 6.8,
  workers_over_10h: 1,
  avg_wbgt_c: 30.7,
  status_distribution: { OPTIMAL: 5, CAUTION: 2, HEAT_STRESS: 1, FATIGUE: 1 }
};

function statusColor(status: string): string {
  switch (status) {
    case "OPTIMAL": return "var(--risk-safe)";
    case "CAUTION": return "var(--risk-medium)";
    case "HEAT_STRESS": return "var(--risk-critical)";
    case "FATIGUE": return "var(--accent-purple)";
    case "CARDIAC_ALERT": return "var(--risk-high)";
    default: return "var(--text-secondary)";
  }
}

export default function BiometricsPage() {
  const [workers, setWorkers] = useState<WorkerBio[]>(MOCK_WORKERS);
  const [summary, setSummary] = useState<FleetSummary>(MOCK_SUMMARY);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  useEffect(() => {
    const fetchBio = () => {
      fetch(`${API}/biometrics/`)
        .then((r) => r.json())
        .then((d) => {
          if (d.success) {
            setWorkers(d.readings);
            setSummary(d.summary);
          }
        })
        .catch(() => {});
    };
    fetchBio();
    const interval = setInterval(fetchBio, 4000);
    return () => clearInterval(interval);
  }, []);

  const selected = workers.find((w) => w.worker_id === selectedId);

  return (
    <div style={{ padding: "0 20px 42px" }}>
      {/* Header */}
      <div className="page-header" style={{ padding: "20px 0 16px" }}>
        <div>
          <div className="page-title">Wearable Biometric Intelligence</div>
          <div className="page-subtitle">
            Real-time physiological strain, fatigue, and cumulative gas dosimetry monitoring.
          </div>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <button className="clay-btn" style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
            <HeartPulse size={14} />
            <span>Export Health Log</span>
          </button>
          <button className="clay-btn primary" style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
            <Siren size={14} />
            <span>Broadcast Alert</span>
          </button>
        </div>
      </div>

      {/* Fleet Summary Cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 10, marginBottom: 24 }}>
        {[
          { label: "Active Crew Size", val: summary.total_workers, unit: "workers", color: "var(--text-primary)" },
          { label: "Physiological Alert", val: summary.heat_stress_cases + summary.cardiac_alerts, unit: "alerts", color: "var(--risk-critical)" },
          { label: "Fatigue Index", val: summary.fatigue_cases, unit: "high risk", color: "var(--accent-purple)" },
          { label: "Average PSI Strain", val: summary.avg_psi, unit: "/ 10", color: "var(--accent-blue)" },
          { label: "Avg H₂S Dose", val: `${summary.avg_h2s_dose_pct}%`, unit: "daily limit", color: "var(--accent-cyan)" },
        ].map((s) => (
          <div key={s.label} className="clay-card" style={{ padding: "12px 18px" }}>
            <div style={{ fontSize: 11, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.05em" }}>{s.label}</div>
            <div style={{ display: "flex", alignItems: "baseline", gap: 6, marginTop: 8 }}>
              <div style={{ fontSize: 28, fontWeight: 900, color: s.color }}>{s.val}</div>
              <div style={{ fontSize: 11, color: "var(--text-secondary)" }}>{s.unit}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Main Grid */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20, alignItems: "start" }}>
        {/* Worker roster list */}
        <div>
          <div className="section-label" style={{ marginBottom: 12 }}>Personnel Roster</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {workers.map((w) => {
              const isSel = selectedId === w.worker_id;
              const color = statusColor(w.status);
              return (
                <div
                  key={w.worker_id}
                  className={`source-card ${isSel ? "info" : ""}`}
                  style={{ cursor: "pointer", transition: "transform 0.15s" }}
                  onClick={() => setSelectedId(w.worker_id)}
                >
                  {/* Status indicator */}
                  <div className="status-dot" style={{ backgroundColor: color, boxShadow: `0 0 8px ${color}` }} />

                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: "flex", justifyContent: "space-between" }}>
                      <div style={{ fontWeight: 800, fontSize: 14 }}>{w.worker_name}</div>
                      <div style={{ fontSize: 11, fontWeight: 700, color }}>{w.status}</div>
                    </div>
                    <div style={{ display: "flex", gap: 10, fontSize: 11, color: "var(--text-secondary)", marginTop: 2 }}>
                      <span style={{ display: "inline-flex", alignItems: "center", gap: 3 }}><Users size={11} /> {w.role}</span>
                      <span style={{ display: "inline-flex", alignItems: "center", gap: 3 }}><MapPin size={11} /> Zone {w.zone_id}</span>
                      <span>⏱ {w.shift_hours}h shift</span>
                    </div>
                  </div>

                  {/* PSI Circle */}
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <svg width="40" height="40" viewBox="0 0 40 40" style={{ transform: "rotate(-90deg)" }} aria-hidden>
                      <circle cx="20" cy="20" r="16" stroke="rgba(255,255,255,0.06)" strokeWidth="4" fill="none" />
                      <circle
                        cx="20" cy="20" r="16" stroke={color} strokeWidth="4" fill="none"
                        strokeDasharray={2 * Math.PI * 16}
                        strokeDashoffset={(1 - w.psi_score / 10) * 2 * Math.PI * 16}
                      />
                    </svg>
                    <div style={{ width: 24, textAlign: "right" }}>
                      <div style={{ fontSize: 12, fontWeight: 900 }}>{w.psi_score}</div>
                      <div style={{ fontSize: 8, color: "var(--text-muted)" }}>PSI</div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Selected worker details */}
        <div>
          <div className="section-label" style={{ marginBottom: 12 }}>Physiological Telemetry Detail</div>
          {selected ? (
            <div className={`clay-card ${selected.psi_score >= 7 ? "critical" : "info"}`} style={{ animation: "float-up 0.3s var(--ease-spring)" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 20 }}>
                <div>
                  <div style={{ fontWeight: 900, fontSize: 18 }}>{selected.worker_name}</div>
                  <div style={{ fontSize: 12, color: "var(--text-secondary)", marginTop: 4 }}>
                    {selected.role} · ID: {selected.worker_id}
                  </div>
                </div>
                <div className="risk-badge" style={{ backgroundColor: statusColor(selected.status), color: "black", fontWeight: 900 }}>
                  ● {selected.status}
                </div>
              </div>

              {/* Vitals Grid */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10, marginBottom: 20 }}>
                {[
                  { label: "Heart Rate", val: selected.heart_rate, unit: "bpm", lim: "60-100", active: selected.heart_rate > 100 },
                  { label: "SpO₂ Saturation", val: selected.spo2, unit: "%", lim: "≥95", active: selected.spo2 < 95 },
                  { label: "Skin Temp", val: selected.skin_temperature, unit: "°C", lim: "33-37", active: selected.skin_temperature > 37 },
                  { label: "Heart Rate Var.", val: selected.heart_rate_variability, unit: "ms", lim: "20-70", active: selected.heart_rate_variability < 20 },
                  { label: "Ambient Temp", val: selected.ambient_temp, unit: "°C", lim: "max 45", active: selected.ambient_temp > 45 },
                  { label: "H₂S TWA", val: selected.h2s_twa_ppm, unit: "ppm", lim: "limit 1.0", active: selected.h2s_twa_ppm > 0.8 },
                ].map((v) => (
                  <div
                    key={v.label}
                    style={{
                      background: v.active ? "rgba(255,59,59,0.06)" : "rgba(255,255,255,0.02)",
                      border: `1px solid ${v.active ? "rgba(255,59,59,0.2)" : "rgba(255,255,255,0.06)"}`,
                      borderRadius: "var(--r-md)", padding: "10px 12px"
                    }}
                  >
                    <div style={{ fontSize: 10, color: "var(--text-muted)", textTransform: "uppercase" }}>{v.label}</div>
                    <div style={{ fontSize: 18, fontWeight: 900, margin: "6px 0 2px", color: v.active ? "var(--risk-critical)" : "var(--text-primary)" }}>
                      {v.val} <span style={{ fontSize: 10, fontWeight: 500, color: "var(--text-secondary)" }}>{v.unit}</span>
                    </div>
                    <div style={{ fontSize: 9, color: "var(--text-muted)" }}>normal: {v.lim}</div>
                  </div>
                ))}
              </div>

              {/* Secondary Strain Info */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 20 }}>
                <div style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.05)", padding: "12px", borderRadius: "var(--r-md)" }}>
                  <div style={{ fontSize: 11, fontWeight: 700, marginBottom: 8 }}>Physiological Strain Breakdown</div>
                  <div style={{ fontSize: 11, color: "var(--text-secondary)" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                      <span>Heart Rate Contribution:</span>
                      <span style={{ fontWeight: 800 }}>{selected.psi_components.heart_rate_contribution} / 5</span>
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between" }}>
                      <span>Thermal Contribution:</span>
                      <span style={{ fontWeight: 800 }}>{selected.psi_components.temperature_contribution} / 5</span>
                    </div>
                  </div>
                </div>

                <div style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.05)", padding: "12px", borderRadius: "var(--r-md)" }}>
                  <div style={{ fontSize: 11, fontWeight: 700, marginBottom: 8 }}>Fatigue & Cognitive Strain</div>
                  <div style={{ fontSize: 11, color: "var(--text-secondary)" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                      <span>Cognitive Load:</span>
                      <span style={{ fontWeight: 800 }}>{selected.cognitive_load_score}%</span>
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between" }}>
                      <span>Reaction Delay:</span>
                      <span style={{ fontWeight: 800 }}>{selected.reaction_time_ms} ms</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Active Alerts */}
              {selected.alerts.length > 0 && (
                <div style={{ border: "1px solid rgba(255,59,59,0.2)", background: "rgba(255,59,59,0.04)", padding: "12px 14px", borderRadius: "var(--r-md)", marginBottom: 16 }}>
                  <div style={{ fontSize: 11, fontWeight: 900, color: "var(--risk-critical)", textTransform: "uppercase", marginBottom: 6 }}>
                    Active Wearable Alerts
                  </div>
                  {selected.alerts.map((al, idx) => (
                    <div key={idx} style={{ fontSize: 12, color: "var(--text-primary)", marginTop: 4, display: "flex", gap: 6 }}>
                      <span>•</span> <span>{al}</span>
                    </div>
                  ))}
                </div>
              )}

              <div style={{ display: "flex", gap: 8 }}>
                <button className="clay-btn primary" style={{ flex: 1, justifyContent: "center", display: "inline-flex", alignItems: "center", gap: 6 }}>
                  <Phone size={14} />
                  <span>Radio Operator</span>
                </button>
                <button className="clay-btn" style={{ flex: 1, justifyContent: "center", display: "inline-flex", alignItems: "center", gap: 6 }}>
                  <FileText size={14} />
                  <span>Log Incident</span>
                </button>
              </div>
            </div>
          ) : (
            <div className="clay-card" style={{ padding: "40px", textAlign: "center", color: "var(--text-secondary)" }}>
              Select a worker from the roster to view real-time physiological telemetry.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
