"use client";
import React from "react";
import { FileText, Printer, ShieldCheck, Download, X } from "lucide-react";

interface AuditReportModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function AuditReportModal({ isOpen, onClose }: AuditReportModalProps) {
  if (!isOpen) return null;

  const handlePrint = () => {
    window.print();
  };

  const reportDate = new Date().toLocaleDateString("en-IN", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return (
    <div className="modal-overlay" onClick={onClose} style={{ zIndex: 300 }}>
      <div
        className="modal-box"
        style={{ maxWidth: 750, background: "#ffffff", color: "#111111", padding: 32, borderRadius: 8 }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header toolbar for web display */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: 20,
            paddingBottom: 12,
            borderBottom: "2px solid #e0e0e0",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 8, color: "#1a5fa0" }}>
            <FileText size={20} />
            <span style={{ fontWeight: 800, fontSize: 16 }}>OFFICIAL STATUTORY AUDIT REPORT</span>
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <button
              onClick={handlePrint}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 6,
                padding: "6px 14px",
                background: "#1a5fa0",
                color: "white",
                border: "none",
                borderRadius: 4,
                fontWeight: 700,
                fontSize: 12,
                cursor: "pointer",
              }}
            >
              <Printer size={14} />
              Print / Save PDF
            </button>
            <button
              onClick={onClose}
              style={{ background: "none", border: "1px solid #ccc", padding: "6px 12px", borderRadius: 4, cursor: "pointer" }}
            >
              <X size={14} />
            </button>
          </div>
        </div>

        {/* Printable Certificate Body */}
        <div id="printable-audit-report" style={{ fontFamily: "Arial, sans-serif", fontSize: 12, lineHeight: 1.6 }}>
          {/* Document Header */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 20 }}>
            <div>
              <h2 style={{ fontSize: 20, fontWeight: 900, color: "#1a5fa0", margin: 0 }}>BHARAT PETROCHEMICALS LIMITED</h2>
              <div style={{ fontSize: 11, color: "#555", fontWeight: 700 }}>REFINERY DIVISION · UNIT 3 (VIZAG FACILITY)</div>
              <div style={{ fontSize: 10, color: "#777" }}>Statutory Compliance Audit Certificate — OISD-STD-105 / 118</div>
            </div>
            <div style={{ textAlign: "right", fontSize: 11, fontFamily: "monospace" }}>
              <div style={{ fontWeight: 700, color: "#111" }}>REPORT ID: AUD-2026-0847</div>
              <div>DATE: {reportDate}</div>
              <div>STATUS: <span style={{ color: "#2a7040", fontWeight: 800 }}>PASSED (85.7%)</span></div>
            </div>
          </div>

          <hr style={{ border: "none", borderTop: "1px solid #ddd", margin: "16px 0" }} />

          {/* Plant Summary Metrics Table */}
          <table style={{ width: "100%", borderCollapse: "collapse", marginBottom: 20 }}>
            <thead>
              <tr style={{ background: "#f2f4f8", textAlign: "left", fontSize: 11 }}>
                <th style={{ padding: 8, border: "1px solid #ddd" }}>AUDIT PARAMETER</th>
                <th style={{ padding: 8, border: "1px solid #ddd" }}>EVALUATED METRIC</th>
                <th style={{ padding: 8, border: "1px solid #ddd" }}>STATUTORY LIMIT</th>
                <th style={{ padding: 8, border: "1px solid #ddd" }}>COMPLIANCE STATUS</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td style={{ padding: 8, border: "1px solid #ddd" }}>H₂S Gas Monitoring</td>
                <td style={{ padding: 8, border: "1px solid #ddd", fontFamily: "monospace" }}>3.2 ppm TWA</td>
                <td style={{ padding: 8, border: "1px solid #ddd", fontFamily: "monospace" }}>10.0 ppm (STEL)</td>
                <td style={{ padding: 8, border: "1px solid #ddd", color: "#2a7040", fontWeight: 700 }}>COMPLIANT ✓</td>
              </tr>
              <tr>
                <td style={{ padding: 8, border: "1px solid #ddd" }}>SCADA LOTO Interlocks</td>
                <td style={{ padding: 8, border: "1px solid #ddd", fontFamily: "monospace" }}>100% Verified</td>
                <td style={{ padding: 8, border: "1px solid #ddd", fontFamily: "monospace" }}>OISD-STD-118</td>
                <td style={{ padding: 8, border: "1px solid #ddd", color: "#2a7040", fontWeight: 700 }}>COMPLIANT ✓</td>
              </tr>
              <tr>
                <td style={{ padding: 8, border: "1px solid #ddd" }}>Worker Heat Strain (PSI)</td>
                <td style={{ padding: 8, border: "1px solid #ddd", fontFamily: "monospace" }}>PSI 4.2 (Moderate)</td>
                <td style={{ padding: 8, border: "1px solid #ddd", fontFamily: "monospace" }}>PSI &lt; 7.5</td>
                <td style={{ padding: 8, border: "1px solid #ddd", color: "#2a7040", fontWeight: 700 }}>COMPLIANT ✓</td>
              </tr>
              <tr>
                <td style={{ padding: 8, border: "1px solid #ddd" }}>Work Permits (PTW)</td>
                <td style={{ padding: 8, border: "1px solid #ddd", fontFamily: "monospace" }}>3 Active (0 Unverified)</td>
                <td style={{ padding: 8, border: "1px solid #ddd", fontFamily: "monospace" }}>Zero Unverified</td>
                <td style={{ padding: 8, border: "1px solid #ddd", color: "#2a7040", fontWeight: 700 }}>COMPLIANT ✓</td>
              </tr>
            </tbody>
          </table>

          {/* Executive AI Debate Decision Consensus */}
          <div style={{ background: "#f8f9fc", borderLeft: "4px solid #1a5fa0", padding: 14, marginBottom: 20 }}>
            <div style={{ fontWeight: 700, fontSize: 12, color: "#1a5fa0", marginBottom: 4 }}>
              AI GOVERNANCE CONSENSUS LOG (7-AGENT DEBATE ENGINE)
            </div>
            <div style={{ fontSize: 11, color: "#333" }}>
              <strong>Scenario Evaluated:</strong> Zone C H₂S Gas Release during active Confined Space permit P-2241.<br />
              <strong>Consensus Decision:</strong> Controlled partial shutdown of Zone C. SCBA rescue standby deployed. Work permit suspended pending GSO clearance.<br />
              <strong>Risk Reduction Trajectory:</strong> Plant Risk 84% → 18%. Calculated avoided liability: ₹34.0 crore.
            </div>
          </div>

          {/* Signatures Footer */}
          <div style={{ display: "flex", justifyContent: "space-between", marginTop: 40, paddingTop: 20, borderTop: "1px solid #ddd" }}>
            <div style={{ textAlign: "center" }}>
              <div style={{ fontFamily: "monospace", fontSize: 11, fontWeight: 700 }}>SENTINEL X AI SYSTEM</div>
              <div style={{ fontSize: 10, color: "#777" }}>Automated System Signature</div>
            </div>
            <div style={{ textAlign: "center" }}>
              <div style={{ borderBottom: "1px solid #333", width: 160, marginBottom: 4 }} />
              <div style={{ fontSize: 11, fontWeight: 700 }}>Chief Safety Officer</div>
              <div style={{ fontSize: 10, color: "#777" }}>Unit 3 Inspection Board</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
