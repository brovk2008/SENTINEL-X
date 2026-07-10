"use client";
import { useEffect, useMemo, useState } from "react";

interface HandoverReport {
  outgoing_shift: string;
  incoming_shift: string;
  handover_time: string;
  ai_summary: string;
  open_items: Array<{ type: string; title: string; duration?: string; ticket?: string; expires?: string }>;
  shift_metrics: {
    alerts_handled: number;
    near_misses: number;
    compliance_pct: number;
    maintenance_completed: string;
  };
}

const PROGRESS_LINES = [
  "Initializing handover matrix...",
  "Fetching AI safety summary...",
  "Compiling open action items...",
  "Assessing shift metrics...",
  "Rendering digital signature interface...",
];

export default function ShiftHandoverPage() {
  const [report, setReport] = useState<HandoverReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeLine, setActiveLine] = useState(0);
  const [accepted, setAccepted] = useState(false);
  const [signature, setSignature] = useState("");

  useEffect(() => {
    const timer = window.setInterval(() => {
      setActiveLine((prev) => Math.min(prev + 1, PROGRESS_LINES.length));
    }, 400);
    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    async function loadReport() {
      try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/workers/handover-report`);
        const data = await res.json();
        setReport(data);
      } catch (error) {
        console.warn("Failed to load handover report", error);
      } finally {
        setLoading(false);
      }
    }

    loadReport();
  }, []);

  useEffect(() => {
    if (!accepted) return;
    const stanza = "Digital handover accepted by Shift Lead.";
    let idx = 0;
    const writer = window.setInterval(() => {
      if (idx >= stanza.length) {
        window.clearInterval(writer);
        return;
      }
      setSignature((prev) => prev + stanza[idx]);
      idx += 1;
    }, 40);
    return () => window.clearInterval(writer);
  }, [accepted]);

  const statusLines = useMemo(() => {
    return PROGRESS_LINES.map((line, index) => ({
      text: line,
      active: index <= activeLine,
    }));
  }, [activeLine]);

  return (
    <div style={{ padding: "24px", minHeight: "100vh" }}>
      <div style={{ marginBottom: "24px", display: "flex", alignItems: "center", justifyContent: "space-between", gap: "16px" }}>
        <div>
          <div style={{ fontSize: "22px", fontWeight: 800, letterSpacing: "-0.02em" }}>Shift Handover</div>
          <div style={{ fontSize: "12px", color: "var(--text-muted)", marginTop: "4px" }}>AI-assisted handover briefing for the incoming shift</div>
        </div>
        <div style={{ display: "inline-flex", alignItems: "center", gap: "8px", background: "rgba(0,255,136,0.08)", border: "1px solid rgba(0,255,136,0.18)", padding: "10px 14px", borderRadius: "999px" }}>
          <span style={{ width: "10px", height: "10px", borderRadius: "50%", background: "#00ff88" }} />
          ONLINE HANDOVER
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 360px", gap: "18px" }}>
        <div style={{ display: "grid", gap: "18px" }}>
          <div style={{ padding: "22px", borderRadius: "24px", background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}>
            <div style={{ fontSize: "13px", color: "var(--text-muted)", marginBottom: "14px" }}>TERMINAL HANDOVER STREAM</div>
            <div style={{ fontFamily: "var(--font-mono)", fontSize: "13px", lineHeight: 1.6, minHeight: "240px", color: "#d8f8c8", whiteSpace: "pre-wrap", overflowWrap: "break-word", background: "rgba(0,0,0,0.12)", borderRadius: "18px", padding: "18px", border: "1px solid rgba(0,255,136,0.1)" }}>
              {statusLines.map((line, index) => (
                <div key={index} style={{ opacity: line.active ? 1 : 0.35, transition: "opacity 0.2s" }}>
                  {line.active ? `> ${line.text}` : ""}
                </div>
              ))}
            </div>
          </div>

          <div style={{ padding: "22px", borderRadius: "24px", background: "rgba(13,13,26,0.98)", border: "1px solid rgba(255,255,255,0.06)" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "16px" }}>
              <div style={{ fontSize: "13px", fontWeight: 700, color: "#00ff88" }}>AI Summary</div>
              <div style={{ fontSize: "11px", color: "var(--text-muted)" }}>{report ? "Ready" : "Loading..."}</div>
            </div>
            <div style={{ fontSize: "14px", color: "var(--text-primary)", lineHeight: 1.75, minHeight: "140px" }}>
              {loading && !report ? "Fetching the latest shift handover data from the plant brain..." : report?.ai_summary}
            </div>
          </div>

          <div style={{ display: "grid", gap: "14px" }}>
            <div style={{ padding: "20px", borderRadius: "24px", background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}>
              <div style={{ fontSize: "13px", fontWeight: 700, color: "#00ff88", marginBottom: "10px" }}>Open Items</div>
              <div style={{ display: "grid", gap: "12px" }}>
                {report?.open_items.map((item, index) => (
                  <div key={index} style={{ display: "grid", gap: "6px", padding: "12px", borderRadius: "18px", background: "rgba(255,255,255,0.02)" }}>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "12px" }}>
                      <span style={{ fontSize: "11px", color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.12em" }}>{item.type}</span>
                      <span style={{ fontSize: "11px", color: "#00ff88" }}>{item.duration ?? item.expires ?? item.ticket ?? "Pending"}</span>
                    </div>
                    <div style={{ fontSize: "14px", fontWeight: 700, color: "var(--text-primary)" }}>{item.title}</div>
                  </div>
                ))}
              </div>
            </div>

            <div style={{ padding: "20px", borderRadius: "24px", background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}>
              <div style={{ fontSize: "13px", fontWeight: 700, color: "#00ff88", marginBottom: "10px" }}>Shift Metrics</div>
              <div style={{ display: "grid", gap: "10px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", gap: "12px", fontSize: "13px" }}>
                  <span>Alerts handled</span>
                  <strong>{report?.shift_metrics.alerts_handled ?? "—"}</strong>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", gap: "12px", fontSize: "13px" }}>
                  <span>Near misses</span>
                  <strong>{report?.shift_metrics.near_misses ?? "—"}</strong>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", gap: "12px", fontSize: "13px" }}>
                  <span>Compliance</span>
                  <strong>{report?.shift_metrics.compliance_pct ?? "—"}%</strong>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", gap: "12px", fontSize: "13px" }}>
                  <span>Maintenance completed</span>
                  <strong>{report?.shift_metrics.maintenance_completed ?? "—"}</strong>
                </div>
              </div>
            </div>
          </div>
        </div>

        <aside style={{ padding: "22px", borderRadius: "24px", background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", minHeight: "440px", display: "grid", gap: "16px" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "12px" }}>
            <div>
              <div style={{ fontSize: "13px", fontWeight: 700, color: "#00ff88" }}>Handover Snapshot</div>
              <div style={{ fontSize: "11px", color: "var(--text-muted)" }}>Shift pair & signature</div>
            </div>
            <div style={{ fontSize: "12px", color: "var(--text-muted)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: "999px", padding: "6px 10px" }}>
              {report?.handover_time ?? "—"}
            </div>
          </div>

          <div style={{ display: "grid", gap: "12px" }}>
            <div style={{ fontSize: "12px", color: "var(--text-muted)" }}>Outgoing</div>
            <div style={{ fontSize: "14px", fontWeight: 700, color: "var(--text-primary)" }}>{report?.outgoing_shift ?? "—"}</div>
          </div>

          <div style={{ display: "grid", gap: "12px" }}>
            <div style={{ fontSize: "12px", color: "var(--text-muted)" }}>Incoming</div>
            <div style={{ fontSize: "14px", fontWeight: 700, color: "var(--text-primary)" }}>{report?.incoming_shift ?? "—"}</div>
          </div>

          <button
            type="button"
            onClick={() => setAccepted(true)}
            className="btn btn-primary"
            style={{ width: "100%", padding: "14px 18px", fontWeight: 700 }}
          >
            {accepted ? "Handover Accepted" : "Accept Handover"}
          </button>

          <div style={{ fontSize: "11px", color: "var(--text-muted)", minHeight: "52px", whiteSpace: "pre-wrap", fontFamily: "var(--font-mono)", background: "rgba(0,0,0,0.12)", borderRadius: "16px", padding: "14px" }}>
            {accepted ? signature || "Signing digital handover..." : "Signature pending — accept to complete the handover protocol."}
          </div>
        </aside>
      </div>
    </div>
  );
}
