"use client";
import { useState, useEffect } from "react";
import { FileText, Download, Sparkles } from "lucide-react";

interface ReportType { id: string; name: string; description: string }

export default function ReportsPage() {
  const [types, setTypes] = useState<ReportType[]>([]);
  const [selected, setSelected] = useState<string>("");
  const [generating, setGenerating] = useState(false);
  const [result, setResult] = useState<{ download_url: string; content_preview: string } | null>(null);

  const loadTypes = async () => {
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/reports/types`);
      const d = await res.json();
      setTypes(d.report_types || []);
      if (d.report_types?.length > 0) setSelected(d.report_types[0].id);
    } catch {}
  };

  useEffect(() => { loadTypes(); }, []);

  const generateReport = async () => {
    if (!selected || generating) return;
    setGenerating(true);
    setResult(null);
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/reports/generate/${selected}`, { method: "POST" });
      const d = await res.json();
      setResult(d);
    } catch {}
    setGenerating(false);
  };

  return (
    <div style={{ padding: "24px", minHeight: "100vh" }}>
      <div style={{ marginBottom: "20px" }}>
        <h1 style={{ fontSize: "22px", fontWeight: "800", letterSpacing: "-0.02em" }}>Safety & Compliance Reports</h1>
        <p style={{ fontSize: "12px", color: "var(--text-muted)", marginTop: "2px" }}>
          AI-generated safety summaries and official regulatory-compliant documents
        </p>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "300px 1fr", gap: "16px", maxWidth: "900px" }}>
        {/* Reports selector card */}
        <div className="glass-card" style={{ padding: "20px", display: "flex", flexDirection: "column", gap: "12px", alignSelf: "start" }}>
          <div style={{ fontSize: "11px", color: "var(--text-muted)", fontWeight: "600", letterSpacing: "0.06em" }}>SELECT REPORT TYPE</div>
          <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
            {types.map((type) => (
              <label key={type.id} style={{
                display: "flex",
                flexDirection: "column",
                gap: "3px",
                padding: "10px",
                borderRadius: "8px",
                border: `1px solid ${selected === type.id ? "var(--accent-primary)" : "var(--glass-border)"}`,
                background: selected === type.id ? "rgba(74,128,255,0.08)" : "transparent",
                cursor: "pointer",
              }}>
                <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                  <input
                    type="radio"
                    name="report"
                    checked={selected === type.id}
                    onChange={() => setSelected(type.id)}
                    style={{ accentColor: "var(--accent-primary)" }}
                  />
                  <span style={{ fontSize: "12px", fontWeight: "700", color: selected === type.id ? "var(--accent-primary)" : "var(--text-primary)" }}>
                    {type.name}
                  </span>
                </div>
                <span style={{ fontSize: "11px", color: "var(--text-secondary)", marginLeft: "18px" }}>{type.description}</span>
              </label>
            ))}
          </div>

          <button onClick={generateReport} className="btn btn-primary" style={{ width: "100%", marginTop: "10px" }} disabled={generating}>
            <Sparkles size={14} /> {generating ? "Generating..." : "Generate AI Report"}
          </button>
        </div>

        {/* Report Preview */}
        <div className="glass-card" style={{ padding: "20px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "14px" }}>
            <span style={{ fontSize: "13px", fontWeight: "700" }}>Report Preview</span>
            {result && (
              <a href={`${process.env.NEXT_PUBLIC_API_URL}${result.download_url}`} download className="btn btn-primary btn-sm">
                <Download size={13} /> Download PDF
              </a>
            )}
          </div>

          {generating ? (
            <div style={{ display: "flex", flexDirection: "column", gap: "10px", padding: "20px 0" }}>
              <div className="skeleton" style={{ height: "16px", width: "90%" }} />
              <div className="skeleton" style={{ height: "16px", width: "80%" }} />
              <div className="skeleton" style={{ height: "16px", width: "95%" }} />
            </div>
          ) : result ? (
            <pre style={{
              background: "var(--glass-xs)",
              border: "1px solid var(--glass-border)",
              borderRadius: "8px",
              padding: "16px",
              fontSize: "12px",
              fontFamily: "var(--font-mono)",
              color: "var(--text-primary)",
              whiteSpace: "pre-wrap",
              maxHeight: "350px",
              overflowY: "auto",
            }}>
              {result.content_preview}
            </pre>
          ) : (
            <div style={{ textAlign: "center", padding: "60px 0", opacity: 0.4 }}>
              <FileText size={40} style={{ margin: "0 auto 12px" }} />
              <div style={{ fontSize: "13px" }}>Choose a report type and click &quot;Generate AI Report&quot;</div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
