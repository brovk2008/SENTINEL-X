"use client";
import { useEffect, useState } from "react";

const statusSteps = [
  { threshold: 15, label: "Connecting to plant sensors..." },
  { threshold: 30, label: "Loading knowledge graph..." },
  { threshold: 45, label: "Activating AI agents..." },
  { threshold: 60, label: "Analyzing compound risks..." },
  { threshold: 75, label: "Running compliance checks..." },
  { threshold: 90, label: "Calibrating risk models..." },
  { threshold: 100, label: "SafetyOS Online. The factory has a brain." },
];

export function LoadingScreen({ children }: { children: React.ReactNode }) {
  const [progress, setProgress] = useState(0);
  const [active, setActive] = useState(true);
  const [fading, setFading] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const alreadySeen = window.localStorage.getItem("safetyos_loading_shown");
    if (alreadySeen) {
      setActive(false);
      return;
    }

    window.localStorage.setItem("safetyos_loading_shown", "true");
    const start = performance.now();
    const interval = window.setInterval(() => {
      const elapsed = Math.min(3000, performance.now() - start);
      const nextProgress = Math.floor((elapsed / 3000) * 100);
      setProgress(nextProgress);
      if (elapsed >= 3000) {
        window.clearInterval(interval);
        setFading(true);
        window.setTimeout(() => setActive(false), 800);
      }
    }, 50);

    return () => window.clearInterval(interval);
  }, []);

  const currentStatus = statusSteps.find((step) => progress <= step.threshold)?.label ?? statusSteps[statusSteps.length - 1].label;

  if (!active) {
    return <>{children}</>;
  }

  return (
    <div
      className="loading-overlay"
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 9999,
        background: "#080810",
        color: "white",
        display: "grid",
        placeItems: "center",
        padding: "24px",
        opacity: fading ? 0 : 1,
        transition: "opacity 0.8s ease",
      }}
    >
      <div style={{ maxWidth: "620px", width: "100%", textAlign: "center" }}>
        <div style={{ marginBottom: "28px" }}>
          <div style={{ fontSize: "14px", letterSpacing: "0.28em", color: "#00ff88", textTransform: "uppercase", marginBottom: "14px" }}>
            SafetyOS INITIALIZING
          </div>
          <div style={{ display: "inline-flex", alignItems: "center", gap: "10px", marginBottom: "14px" }}>
            <div style={{ width: "48px", height: "48px", borderRadius: "14px", background: "rgba(0,255,136,0.12)", display: "grid", placeItems: "center" }}>
              <span style={{ fontSize: "26px", fontWeight: 800, color: "#00ff88" }}>🏭</span>
            </div>
            <div style={{ textAlign: "left" }}>
              <div style={{ fontSize: "26px", fontWeight: 800, letterSpacing: "-0.03em" }}>SafetyOS</div>
              <div style={{ fontSize: "13px", color: "rgba(255,255,255,0.7)" }}>AI Operating System for Industrial Safety</div>
            </div>
          </div>
        </div>

        <div style={{ marginBottom: "22px", padding: "26px", borderRadius: "28px", background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "14px" }}>
            <div style={{ fontSize: "14px", fontWeight: 700, color: "#00ff88" }}>Boot sequence</div>
            <div style={{ fontSize: "12px", color: "rgba(255,255,255,0.65)" }}>{progress}%</div>
          </div>
          <div style={{ height: "10px", borderRadius: "999px", overflow: "hidden", background: "rgba(255,255,255,0.08)" }}>
            <div style={{ width: `${progress}%`, height: "100%", background: "linear-gradient(90deg, #00ff88, #44ffaa)", boxShadow: "0 0 20px rgba(0,255,136,0.35)" }} />
          </div>
          <div style={{ marginTop: "14px", color: "rgba(255,255,255,0.75)", fontSize: "13px", minHeight: "24px" }}>
            {currentStatus}
          </div>
        </div>

        <div style={{ display: "grid", gap: "10px", textAlign: "left" }}>
          {statusSteps.map((step) => (
            <div key={step.label} style={{ display: "flex", alignItems: "center", gap: "10px", opacity: progress >= step.threshold ? 1 : 0.35, transition: "opacity 0.25s" }}>
              <div style={{ width: "10px", height: "10px", borderRadius: "50%", background: progress >= step.threshold ? "#00ff88" : "rgba(255,255,255,0.18)" }} />
              <div style={{ fontSize: "12px", color: "rgba(255,255,255,0.72)" }}>{step.label}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
