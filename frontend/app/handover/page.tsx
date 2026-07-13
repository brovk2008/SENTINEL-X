"use client";
import React, { useState } from "react";
import { useStore } from "../../lib/store";
import { FileText, Bot, Check, Download } from "lucide-react";
import { AuditReportModal } from "../../components/AuditReportModal";

const API = process.env.NEXT_PUBLIC_API_URL || "";

const CHECKLIST = [
  { id: "c1", label: "All critical alerts acknowledged",       checked: true,  zone: "ZC" },
  { id: "c2", label: "Permit P-2241 hot work permit reviewed", checked: true,  zone: "ZB" },
  { id: "c3", label: "H₂S sensor bay A calibration confirmed", checked: false, zone: "ZA" },
  { id: "c4", label: "Night shift supervisor briefed on risk",  checked: true,  zone: "ALL" },
  { id: "c5", label: "Compressor C-301 maintenance logged",    checked: false, zone: "ZC" },
  { id: "c6", label: "Fire suppression system tested",         checked: true,  zone: "ZD" },
  { id: "c7", label: "Emergency contact list verified",        checked: true,  zone: "ALL" },
  { id: "c8", label: "LOTO devices accounted for",            checked: false, zone: "ZB" },
];

const AI_SUMMARY = `Shift handover — Day Shift to Night Shift, ${new Date().toLocaleDateString("en-IN", { weekday: "long", month: "long", day: "numeric" })}

Critical items:
• Zone C H₂S levels elevated at 8.2 ppm (warn threshold 5 ppm) — Night shift crew must maintain PPE protocols and continue monitoring.
• Compressor C-301 vibration trending upward — maintenance team has been notified, scheduled for 06:00.
• Permit P-2241 (hot work, Zone B) expires at 22:00 — confirm closure with Zone B supervisor.

Plant risk handover: 84% (CRITICAL) → continuing elevated risk during night shift.
All emergency evacuation routes confirmed clear. Stand-by emergency response team briefed.`;

interface ShiftStat {
  label: string;
  current: string | number;
  previous: string | number;
  delta?: string;
  color?: string;
  worse?: boolean;
}

const SHIFT_STATS: ShiftStat[] = [
  { label: "Peak Risk Score",      current: 84,   previous: 71,   delta: "+13",  color: "var(--risk-critical)", worse: true },
  { label: "Alerts Triggered",     current: 14,   previous: 9,    delta: "+5",   color: "var(--risk-medium)",   worse: true },
  { label: "Alerts Resolved",      current: 11,   previous: 8,    delta: "+3",   color: "var(--risk-safe)",     worse: false },
  { label: "Permits Issued",       current: 4,    previous: 6,    delta: "-2",   color: "var(--accent-blue)",   worse: false },
  { label: "Workers on Shift",     current: 48,   previous: 44,   delta: "+4",   color: "var(--accent-cyan)",   worse: false },
  { label: "PPE Violations",       current: 2,    previous: 0,    delta: "+2",   color: "var(--risk-high)",     worse: true },
  { label: "Near-Misses",          current: 1,    previous: 0,    delta: "+1",   color: "var(--risk-critical)", worse: true },
  { label: "Maintenance Work Orders", current: 3, previous: 2,    delta: "+1",   color: "var(--text-primary)",  worse: false },
];

const EVENTS = [
  { time: "07:14", type: "alert",   msg: "H₂S sensor ZC-01 exceeded 5 ppm — auto-alert triggered",             zone: "ZC" },
  { time: "08:02", type: "action",  msg: "Permit P-2241 issued for hot work welding — Zone B Reactor bay",      zone: "ZB" },
  { time: "09:47", type: "alert",   msg: "PPE non-compliance detected — CAM-07 entry gate (no helmet)",          zone: "GATE" },
  { time: "11:30", type: "action",  msg: "Compressor C-301 vibration anomaly detected — work order raised",     zone: "ZC" },
  { time: "13:15", type: "ai",      msg: "AI compound risk engine: H₂S + hot work + crowding = HIGH compound risk", zone: "ZC" },
  { time: "14:55", type: "action",  msg: "Night shift supervisors briefed — handover package generated",         zone: "ALL" },
];

export default function HandoverPage() {
  const sensors = useStore((s) => s.sensors);
  const alerts  = useStore((s) => s.alerts);
  const [checklist, setChecklist] = useState(CHECKLIST);
  const [generating, setGenerating] = useState(false);
  const [generated,  setGenerated]  = useState(false);
  const [showModal,  setShowModal]  = useState(false);

  const completedCount = checklist.filter((c) => c.checked).length;
  const completionPct  = Math.round((completedCount / checklist.length) * 100);

  const handleGenerateReport = async () => {
    setGenerating(true);
    await new Promise((r) => setTimeout(r, 600));
    setGenerating(false);
    setGenerated(true);
    setShowModal(true);

    // Trigger instant TXT file download
    const reportText = `================================================================
SENTINEL X — SHIFT HANDOVER REPORT & SAFETY AUDIT PACKAGE
Bharat Petrochemicals Limited — Unit 3 (Vizag Facility)
Date: ${new Date().toLocaleString("en-IN")}
Shift Transfer: Day Shift → Night Shift
================================================================

1. EXECUTIVE SUMMARY & PLANT RISK STATUS
----------------------------------------------------------------
Current Plant Risk Score: 84% (CRITICAL)
Status: Elevated Risk — Active Zone C H2S buildup & CSE permit active.

${AI_SUMMARY}

2. SHIFT COMPARISON & DELTA METRICS
----------------------------------------------------------------
${SHIFT_STATS.map(s => `${s.label.padEnd(28)} Current: ${String(s.current).padEnd(6)} Prev: ${String(s.previous).padEnd(6)} Delta: ${s.delta}`).join("\n")}

3. SAFETY CHECKLIST STATUS (${completedCount}/${checklist.length} Completed — ${completionPct}%)
----------------------------------------------------------------
${checklist.map(c => `[${c.checked ? "✓" : " "}] (${c.zone.padEnd(4)}) ${c.label}`).join("\n")}

4. SHIFT INCIDENT TIMELINE
----------------------------------------------------------------
${EVENTS.map(e => `${e.time} [Zone ${e.zone}] ${e.msg}`).join("\n")}

================================================================
LOGGED BY: Sentinel X Autonomous Safety Operating System
================================================================`;

    const blob = new Blob([reportText], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `SHIFT_HANDOVER_REPORT_${new Date().toISOString().slice(0, 10)}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const toggleCheck = (id: string) => {
    setChecklist((cl) => cl.map((c) => c.id === id ? { ...c, checked: !c.checked } : c));
  };

  return (
    <div style={{ padding: "0 20px 40px" }}>
      {/* Header */}
      <div className="page-header" style={{ padding: "20px 0 16px" }}>
        <div>
          <div className="page-title">Shift Handover Log</div>
          <div className="page-subtitle">
            Day Shift → Night Shift · {new Date().toLocaleDateString("en-IN", { weekday: "long", month: "long", day: "numeric", year: "numeric" })}
          </div>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <button
            className="btn primary"
            onClick={handleGenerateReport}
            disabled={generating}
            style={{ display: "inline-flex", alignItems: "center", gap: 6 }}
          >
            <FileText size={15} />
            <span>{generating ? "Generating..." : "Generate & Download Handover Report"}</span>
          </button>
          {generated && (
            <button
              className="btn"
              onClick={() => setShowModal(true)}
              style={{ display: "inline-flex", alignItems: "center", gap: 6, borderColor: "var(--alarm-info)", color: "var(--alarm-info)" }}
            >
              <Download size={14} />
              <span>View / Print Printable PDF</span>
            </button>
          )}
        </div>
      </div>

      {/* Shift comparison grid */}
      <div style={{ marginBottom: 24 }}>
        <div className="section-label" style={{ marginBottom: 12 }}>Shift Comparison — Day vs Previous Day</div>
        <div
          className="stagger-children"
          style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))", gap: 10 }}
        >
          {SHIFT_STATS.map(({ label, current, previous, delta, color, worse }) => (
            <div key={label} className="clay-card" style={{ padding: "14px 16px" }}>
              <div style={{ fontSize: 10, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 6 }}>
                {label}
              </div>
              <div style={{ display: "flex", alignItems: "baseline", gap: 8 }}>
                <div style={{ fontSize: 26, fontWeight: 900, color }}>{current}</div>
                <div style={{ fontSize: 11, color: "var(--text-muted)" }}>
                  prev: {previous}
                </div>
              </div>
              {delta && (
                <div
                  style={{
                    fontSize: 11,
                    fontWeight: 700,
                    color: worse ? "var(--risk-critical)" : "var(--risk-safe)",
                    marginTop: 4,
                  }}
                >
                  {worse ? "⬆" : "⬇"} {delta}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      <div className="responsive-row">
        {/* Left Column: AI Summary + Shift Logs + Checklist */}
        <div style={{ flex: 1.3, display: "flex", flexDirection: "column", gap: 20 }}>
          {/* AI Summary */}
          <div className="clay-card info">
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14 }}>
              <Bot size={18} color="var(--accent-blue)" />
              <div style={{ fontWeight: 700, fontSize: 14 }}>AI Handover Summary</div>
              <div className="live-dot" style={{ marginLeft: "auto" }} />
            </div>
            <div
              style={{
                fontSize: 13,
                lineHeight: 1.7,
                color: "var(--text-secondary)",
                whiteSpace: "pre-wrap",
                fontFamily: "var(--font-sans)",
              }}
            >
              {AI_SUMMARY}
            </div>
          </div>

          {/* Shift event log */}
          <div className="clay-card">
            <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 14 }}>Shift Event Log</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              {EVENTS.map(({ time, type, msg, zone }) => (
                <div
                  key={time + msg.slice(0, 10)}
                  style={{
                    display: "flex", gap: 10, padding: "8px 10px",
                    background: type === "alert" ? "rgba(255,59,59,0.05)" : type === "ai" ? "rgba(155,89,255,0.05)" : "rgba(255,255,255,0.02)",
                    borderRadius: "var(--r-sm)",
                    borderLeft: `2px solid ${type === "alert" ? "var(--risk-critical)" : type === "ai" ? "var(--accent-purple)" : "var(--accent-blue)"}`,
                  }}
                >
                  <div style={{ fontSize: 10, color: "var(--text-muted)", fontFamily: "var(--font-mono)", flexShrink: 0, paddingTop: 2 }}>
                    {time}
                  </div>
                  <div style={{ fontSize: 11, lineHeight: 1.5, flex: 1 }}>{msg}</div>
                  <div
                    style={{
                      fontSize: 9, fontWeight: 700, color: "var(--text-muted)",
                      flexShrink: 0, alignSelf: "flex-start", paddingTop: 2,
                    }}
                  >
                    {zone}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Handover checklist */}
          <div className="clay-card">
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
              <div>
                <div style={{ fontWeight: 700, fontSize: 14 }}>Handover Checklist</div>
                <div style={{ fontSize: 12, color: "var(--text-secondary)", marginTop: 2 }}>
                  {completedCount}/{checklist.length} items complete — {completionPct}%
                </div>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <div
                  style={{
                    width: 120, height: 6, borderRadius: 4,
                    background: "rgba(255,255,255,0.06)", overflow: "hidden",
                  }}
                >
                  <div
                    style={{
                      width: `${completionPct}%`, height: "100%",
                      background: completionPct === 100 ? "var(--risk-safe)" : "var(--accent-blue)",
                      transition: "width 0.4s var(--ease-out)",
                    }}
                  />
                </div>
                <div style={{ fontSize: 13, fontWeight: 800, color: completionPct === 100 ? "var(--risk-safe)" : "var(--accent-blue)" }}>
                  {completionPct}%
                </div>
              </div>
            </div>

            <div>
              {checklist.map((item) => (
                <div
                  key={item.id}
                  className="checklist-item"
                  onClick={() => toggleCheck(item.id)}
                  style={{ cursor: "pointer" }}
                >
                  <div className={`check-box ${item.checked ? "checked" : ""}`}>
                    {item.checked && <span style={{ color: "black", fontSize: 11, fontWeight: 900 }}>✓</span>}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 13, opacity: item.checked ? 0.6 : 1, textDecoration: item.checked ? "line-through" : "none", transition: "all 0.2s" }}>
                      {item.label}
                    </div>
                  </div>
                  <div
                    style={{
                      fontSize: 9, fontWeight: 700, padding: "2px 8px",
                      borderRadius: 999, background: "rgba(255,255,255,0.05)",
                      color: "var(--text-muted)", border: "1px solid rgba(255,255,255,0.06)",
                      flexShrink: 0,
                    }}
                  >
                    Zone {item.zone}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column: Shift Handover Archive + Guideline Info */}
        <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 20 }}>
          {/* Shift Handover Logs Archive */}
          <div className="clay-card">
            <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 14 }}>Handover Log History</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {[
                { date: "12 July 2026", shift: "Night → Day Shift", supervisor: "Manish Sinha", status: "Completed", risk: "71%", color: "var(--risk-medium)" },
                { date: "12 July 2026", shift: "Day → Night Shift", supervisor: "S. K. Rao", status: "Completed", risk: "65%", color: "var(--risk-medium)" },
                { date: "11 July 2026", shift: "Night → Day Shift", supervisor: "V. Sharma", status: "Completed", risk: "42%", color: "var(--risk-safe)" },
                { date: "11 July 2026", shift: "Day → Night Shift", supervisor: "Amit Patel", status: "Completed", risk: "40%", color: "var(--risk-safe)" },
              ].map((h, i) => (
                <div key={i} style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.05)", borderRadius: "var(--r-md)", padding: "12px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div>
                    <div style={{ fontSize: 12, fontWeight: 700 }}>{h.shift}</div>
                    <div style={{ fontSize: 10, color: "var(--text-secondary)", marginTop: 2 }}>
                      {h.date} · Supervisor: {h.supervisor}
                    </div>
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <span className="badge" style={{ background: "rgba(255,255,255,0.04)", color: "var(--text-secondary)", fontSize: 10, border: "1px solid rgba(255,255,255,0.08)" }}>
                      {h.status}
                    </span>
                    <div style={{ fontSize: 11, fontWeight: 800, color: h.color, marginTop: 4 }}>
                      Risk: {h.risk}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* OISD Guideline standards card */}
          <div className="clay-card info">
            <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 10 }}>OISD Standard 105 Compliance</div>
            <div style={{ fontSize: 12, color: "var(--text-secondary)", lineHeight: 1.6 }}>
              Pursuant to standard safety handovers:
              <ul style={{ paddingLeft: 16, marginTop: 6 }}>
                <li>All active Work Permits must be counter-signed by incoming supervisors.</li>
                <li>H2S & Hydrocarbon levels must be verified by continuous gas testing.</li>
                <li>PPE compliance stats must be reviewed and certified prior to crew swap.</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
      <AuditReportModal isOpen={showModal} onClose={() => setShowModal(false)} />
    </div>
  );
}
