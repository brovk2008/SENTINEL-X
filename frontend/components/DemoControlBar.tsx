"use client";
import React, { useState } from "react";
import { Siren, RotateCcw, Volume2, VolumeX, Smartphone, FileText, AlertTriangle } from "lucide-react";
import { useStore } from "../lib/store";
import { playIndustrialSiren, announceSafetyAlert, stopAudioAlert } from "../lib/audio-annunciator";
import { AlertDispatcherModal } from "./AlertDispatcherModal";
import { AuditReportModal } from "./AuditReportModal";

export function DemoControlBar() {
  const setPlantRisk = useStore((s) => s.setPlantRisk);
  const updateSensor = useStore((s) => s.updateSensor);
  const addAlert = useStore((s) => s.addAlert);

  const [audioMuted, setAudioMuted] = useState(false);
  const [activeScenario, setActiveScenario] = useState<string | null>(null);
  const [dispatcherOpen, setDispatcherOpen] = useState(false);
  const [auditOpen, setAuditOpen] = useState(false);

  const triggerH2SGasLeak = () => {
    setActiveScenario("H2S Gas Leak (Zone C)");
    setPlantRisk(84);
    updateSensor("h2s-zc-01", { status: "crit", value: "45.2", rawValue: 45.2 });
    updateSensor("h2s-zc-02", { status: "crit", value: "38.6", rawValue: 38.6 });

    addAlert({
      id: `alert-${Date.now()}`,
      title: "H2S Gas Release — Zone C Compressor Bay (45.2 ppm)",
      severity: "CRITICAL",
      zone: "ZC",
      timestamp: new Date().toISOString(),
      read: false,
    });

    if (!audioMuted) {
      playIndustrialSiren(4000);
      setTimeout(() => {
        announceSafetyAlert("Attention Zone C. H2S gas buildup detected at 45 ppm. Controlled evacuation initiated by Sentinel X AI.");
      }, 1000);
    }

    setDispatcherOpen(true);
  };

  const triggerCompressorFailure = () => {
    setActiveScenario("Compressor C-301 Failure");
    setPlantRisk(74);
    updateSensor("vib-c301", { status: "crit", value: "11.4", rawValue: 11.4 });

    addAlert({
      id: `alert-${Date.now()}`,
      title: "Compressor C-301 Severe Vibration Alert (11.4 mm/s)",
      severity: "HIGH",
      zone: "ZB",
      timestamp: new Date().toISOString(),
      read: false,
    });

    if (!audioMuted) {
      announceSafetyAlert("Warning: Compressor C-301 vibration exceeds critical limit. Maintenance dispatch recommended.");
    }
  };

  const resetNormal = () => {
    setActiveScenario(null);
    setPlantRisk(18);
    updateSensor("h2s-zc-01", { status: "normal", value: "3.2", rawValue: 3.2 });
    updateSensor("h2s-zc-02", { status: "normal", value: "2.8", rawValue: 2.8 });
    updateSensor("vib-c301", { status: "normal", value: "4.6", rawValue: 4.6 });
    stopAudioAlert();

    if (!audioMuted) {
      announceSafetyAlert("Sentinel X System reset to normal operational baseline.");
    }
  };

  const toggleAudio = () => {
    if (!audioMuted) {
      stopAudioAlert();
    }
    setAudioMuted(!audioMuted);
  };

  return (
    <>
      <div
        style={{
          position: "fixed",
          bottom: 12,
          left: "50%",
          transform: "translateX(-50%)",
          zIndex: 150,
          background: "var(--bg-elevated)",
          border: "1px solid var(--border-bright)",
          borderRadius: "var(--r-lg)",
          boxShadow: "var(--shadow-lg)",
          padding: "8px 16px",
          display: "flex",
          alignItems: "center",
          gap: 12,
          maxWidth: "92vw",
          overflowX: "auto",
        }}
      >
        {/* Label */}
        <div style={{ display: "flex", alignItems: "center", gap: 6, flexShrink: 0 }}>
          <span className="live-dot" />
          <span style={{ fontSize: 11, fontWeight: 700, fontFamily: "var(--font-mono)", color: "var(--text-secondary)" }}>
            HACKATHON DEMO BAR:
          </span>
        </div>

        {/* Trigger H2S Gas Leak Button */}
        <button
          onClick={triggerH2SGasLeak}
          className="btn danger"
          style={{ fontSize: 11, padding: "5px 10px", gap: 5 }}
        >
          <Siren size={13} />
          <span>Trigger H₂S Gas Leak (Zone C)</span>
        </button>

        {/* Trigger Compressor Failure Button */}
        <button
          onClick={triggerCompressorFailure}
          className="btn"
          style={{ fontSize: 11, padding: "5px 10px", gap: 5, borderColor: "var(--alarm-high)", color: "var(--alarm-high)" }}
        >
          <AlertTriangle size={13} />
          <span>Trigger Compressor Failure</span>
        </button>

        {/* Dispatcher Modal Trigger */}
        <button
          onClick={() => setDispatcherOpen(true)}
          className="btn"
          style={{ fontSize: 11, padding: "5px 10px", gap: 5 }}
        >
          <Smartphone size={13} />
          <span>View Alerts Log</span>
        </button>

        {/* PDF Audit Report Button */}
        <button
          onClick={() => setAuditOpen(true)}
          className="btn"
          style={{ fontSize: 11, padding: "5px 10px", gap: 5, borderColor: "var(--alarm-info)", color: "var(--alarm-info)" }}
        >
          <FileText size={13} />
          <span>Export OISD Report</span>
        </button>

        {/* Reset Button */}
        <button
          onClick={resetNormal}
          className="btn-ghost"
          style={{ fontSize: 11, padding: "5px 10px", gap: 5 }}
        >
          <RotateCcw size={13} />
          <span>Reset Normal</span>
        </button>

        {/* Audio Mute/Unmute Toggle */}
        <button
          onClick={toggleAudio}
          className="btn-ghost"
          style={{ fontSize: 11, padding: "5px 8px", color: audioMuted ? "var(--text-muted)" : "var(--alarm-normal)" }}
          title={audioMuted ? "Audio Muted" : "Audio Annunciator Active"}
        >
          {audioMuted ? <VolumeX size={14} /> : <Volume2 size={14} />}
        </button>
      </div>

      {/* Dispatcher Modal */}
      <AlertDispatcherModal
        isOpen={dispatcherOpen}
        onClose={() => setDispatcherOpen(false)}
        scenarioTitle={activeScenario || "H2S Gas Buildup — Zone C"}
      />

      {/* Audit Report Modal */}
      <AuditReportModal
        isOpen={auditOpen}
        onClose={() => setAuditOpen(false)}
      />
    </>
  );
}
