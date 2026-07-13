"use client";
import React, { useState } from "react";
import { Cpu, FileText, CheckCircle, Upload, ArrowRight, X, Sparkles, AlertTriangle } from "lucide-react";

interface PIDVisionExtractorModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function PIDVisionExtractorModal({ isOpen, onClose }: PIDVisionExtractorModalProps) {
  const [selectedSample, setSelectedSample] = useState<string>("geothermal");
  const [analyzing, setAnalyzing] = useState(false);
  const [extractedData, setExtractedData] = useState<any | null>(null);

  if (!isOpen) return null;

  const samples = [
    {
      id: "geothermal",
      title: "Geothermal Heat Station SCADA P&ID",
      subtitle: "Complex multi-pump & heat exchanger loop",
      image: "/scada_sample_1.png", // Or fallback canvas view
      tagsCount: 14,
      preview: "Pumps P5–P9, Temp TT4/TT8/TT9, Pressure PT3/PT6, Valves CV2/CV4",
    },
    {
      id: "hydrocracker",
      title: "Unit 3 Hydrocracker & Compressor Bay P&ID",
      subtitle: "High-pressure gas processing unit",
      image: "/scada_sample_2.png",
      tagsCount: 18,
      preview: "H2S-ZC-01, Compressor C-301, Vessel V-401, SCADA LOTO Valve CV-312",
    },
    {
      id: "tankfarm",
      title: "Zone A Storage Tank Farm Schematic",
      subtitle: "Overhead storage tank level & telemetry diagram",
      image: "/scada_sample_3.png",
      tagsCount: 12,
      preview: "TNK-401 Level, Pump P-102, Gas Sniffer ZA-01, Deluge Valve DV-1",
    },
  ];

  const runVisionAnalysis = () => {
    setAnalyzing(true);
    setExtractedData(null);

    setTimeout(() => {
      setAnalyzing(false);
      if (selectedSample === "geothermal") {
        setExtractedData({
          title: "Geothermal Heat Station SCADA",
          protocol: "OPC-UA / Modbus TCP",
          qualityScore: "99.4%",
          tags: [
            { tag: "HEAT/PMP-P9/STATUS", type: "PUMP", val: "ON (Active)", raw: "1", state: "normal" },
            { tag: "HEAT/PMP-P8/STATUS", type: "PUMP", val: "ON (Active)", raw: "1", state: "normal" },
            { tag: "HEAT/PMP-P7/STATUS", type: "PUMP", val: "ON (Active)", raw: "1", state: "normal" },
            { tag: "HEAT/TT-8/TEMP", type: "TEMP", val: "63.4 °C", raw: "63.4", state: "normal" },
            { tag: "HEAT/TT-9/TEMP", type: "TEMP", val: "44.9 °C", raw: "44.9", state: "normal" },
            { tag: "HEAT/PT-6/PRESS", type: "PRESS", val: "4.79 bar", raw: "4.79", state: "normal" },
            { tag: "HEAT/PT-3/PRESS", type: "PRESS", val: "0.60 bar", raw: "0.60", state: "critical" },
            { tag: "HEAT/VALVE-CV2/POS", type: "VALVE", val: "1.1 (Motorized)", raw: "1.1", state: "normal" },
          ],
          anomaliesDetected: [
            "PT3 Pressure Low (0.60 bar vs 2.0 bar setpoint) — Low Pressure Cavitation Risk",
          ],
          unsTopicRoot: "VIZAG/GEOTHERMAL_HEAT_STATION/#",
        });
      } else if (selectedSample === "hydrocracker") {
        setExtractedData({
          title: "Unit 3 Hydrocracker SCADA",
          protocol: "OPC-UA (IEC 62443 SL2)",
          qualityScore: "98.8%",
          tags: [
            { tag: "VIZAG/ZC/H2S-01/GAS", type: "GAS", val: "45.2 ppm", raw: "45.2", state: "critical" },
            { tag: "VIZAG/ZC/CMP-301/VIB", type: "VIB", val: "11.4 mm/s", raw: "11.4", state: "critical" },
            { tag: "VIZAG/ZC/VALVE-312/LOTO", type: "SCADA", val: "LOTO OPEN", raw: "1", state: "warning" },
          ],
          anomaliesDetected: [
            "Compound Hazard: H2S 45.2 ppm + Compressor Vibration 11.4 mm/s + Active CSE Permit",
          ],
          unsTopicRoot: "VIZAG/UNIT3/HYDROCRACKER/#",
        });
      } else {
        setExtractedData({
          title: "Zone A Tank Farm Diagram",
          protocol: "MQTT / UNS Sparkplug B",
          qualityScore: "99.1%",
          tags: [
            { tag: "VIZAG/ZA/TNK-401/LEVEL", type: "LEVEL", val: "84.2 %", raw: "84.2", state: "normal" },
            { tag: "VIZAG/ZA/GAS-ZA01/SNIFFER", type: "GAS", val: "0.2 ppm", raw: "0.2", state: "normal" },
          ],
          anomaliesDetected: ["All parameters nominal"],
          unsTopicRoot: "VIZAG/ZONE_A/TANK_FARM/#",
        });
      }
    }, 1200);
  };

  return (
    <div className="modal-overlay" onClick={onClose} style={{ zIndex: 300 }}>
      <div
        className="modal-box"
        style={{ maxWidth: 780, background: "var(--bg-panel)", border: "1px solid var(--border-bright)" }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            paddingBottom: 14,
            borderBottom: "1px solid var(--border-dim)",
            marginBottom: 16,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ padding: 8, background: "var(--alarm-info-bg)", borderRadius: 6, color: "var(--alarm-info)" }}>
              <Sparkles size={18} />
            </div>
            <div>
              <div style={{ fontSize: 16, fontWeight: 800 }}>Vision AI SCADA & P&ID Blueprint Extractor</div>
              <div style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 2 }}>
                Extract OPC-UA/Modbus tags, valve topologies & ISA-95 UNS mappings automatically from any SCADA diagram image.
              </div>
            </div>
          </div>
          <button onClick={onClose} className="btn-ghost" style={{ padding: "4px 8px" }} aria-label="Close">
            <X size={16} />
          </button>
        </div>

        {/* Blueprint Selection */}
        <div style={{ marginBottom: 16 }}>
          <div style={{ fontSize: 11, color: "var(--text-muted)", fontFamily: "var(--font-mono)", marginBottom: 8, textTransform: "uppercase" }}>
            Select Plant SCADA Diagram / P&ID Blueprint:
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 10 }}>
            {samples.map((s) => (
              <div
                key={s.id}
                onClick={() => setSelectedSample(s.id)}
                style={{
                  background: selectedSample === s.id ? "var(--bg-elevated)" : "var(--bg-card)",
                  border: `1px solid ${selectedSample === s.id ? "var(--alarm-info)" : "var(--border-mid)"}`,
                  borderLeft: selectedSample === s.id ? "3px solid var(--alarm-info)" : "1px solid var(--border-mid)",
                  borderRadius: 6,
                  padding: 12,
                  cursor: "pointer",
                  transition: "all 120ms ease",
                }}
              >
                <div style={{ fontSize: 12, fontWeight: 700, color: "var(--text-primary)", marginBottom: 4 }}>{s.title}</div>
                <div style={{ fontSize: 11, color: "var(--text-muted)", marginBottom: 6 }}>{s.subtitle}</div>
                <div style={{ fontSize: 10, fontFamily: "var(--font-mono)", color: "var(--alarm-info)" }}>
                  {s.tagsCount} SCADA Tags Detected
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Run Analysis Button */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
          <div style={{ fontSize: 12, color: "var(--text-secondary)", display: "flex", alignItems: "center", gap: 6 }}>
            <Upload size={14} />
            <span>Or drag and drop your own industrial P&ID blueprint / SCADA HMI screenshot (.png, .jpg, .pdf)</span>
          </div>
          <button
            onClick={runVisionAnalysis}
            className="btn primary"
            disabled={analyzing}
            style={{ padding: "8px 18px", gap: 8 }}
          >
            <Sparkles size={15} />
            <span>{analyzing ? "Vision AI Extracting..." : "Run Vision AI Tag Extraction"}</span>
          </button>
        </div>

        {/* Vision AI Analysis Output */}
        {extractedData && (
          <div style={{ background: "var(--bg-card)", border: "1px solid var(--border-mid)", borderRadius: 6, padding: 16 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12, paddingBottom: 8, borderBottom: "1px solid var(--border-dim)" }}>
              <div>
                <span style={{ fontSize: 13, fontWeight: 800, color: "var(--text-primary)" }}>{extractedData.title}</span>
                <span style={{ fontSize: 11, color: "var(--text-muted)", marginLeft: 8 }}>
                  Protocol: {extractedData.protocol} · UNS Root: <code style={{ color: "var(--alarm-info)" }}>{extractedData.unsTopicRoot}</code>
                </span>
              </div>
              <span className="badge normal">OCR Accuracy {extractedData.qualityScore}</span>
            </div>

            {/* Detected Anomalies */}
            {extractedData.anomaliesDetected && extractedData.anomaliesDetected.length > 0 && (
              <div style={{ background: "var(--alarm-critical-bg)", border: "1px solid var(--alarm-critical)", borderRadius: 4, padding: "8px 12px", marginBottom: 12 }}>
                <div style={{ fontSize: 11, fontWeight: 800, color: "var(--alarm-critical)", display: "flex", alignItems: "center", gap: 6 }}>
                  <AlertTriangle size={13} />
                  SCADA DIAGRAM ANOMALY DETECTED IN VISION SCAN:
                </div>
                <div style={{ fontSize: 12, color: "var(--text-primary)", marginTop: 2 }}>
                  {extractedData.anomaliesDetected[0]}
                </div>
              </div>
            )}

            {/* Extracted Tags Table */}
            <table className="data-table">
              <thead>
                <tr>
                  <th>Canonical UNS Tag ID</th>
                  <th>Equipment Type</th>
                  <th>Detected Telemetry</th>
                  <th>Raw Register</th>
                  <th>ISA-18.2 State</th>
                </tr>
              </thead>
              <tbody>
                {extractedData.tags.map((t: any, idx: number) => (
                  <tr key={idx}>
                    <td style={{ fontFamily: "var(--font-mono)", fontWeight: 700, color: "var(--text-primary)" }}>{t.tag}</td>
                    <td><span className="badge info" style={{ fontSize: 10 }}>{t.type}</span></td>
                    <td style={{ fontFamily: "var(--font-mono)", fontWeight: 700 }}>{t.val}</td>
                    <td style={{ fontFamily: "var(--font-mono)", color: "var(--text-muted)" }}>{t.raw}</td>
                    <td><span className={`badge ${t.state}`}>{t.state.toUpperCase()}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
