"use client";
import { useEffect, useState } from "react";

const statusSteps = [
  { threshold: 15, label: "Connecting to plant sensors" },
  { threshold: 30, label: "Loading knowledge graph" },
  { threshold: 45, label: "Activating AI agents" },
  { threshold: 60, label: "Analyzing compound risks" },
  { threshold: 75, label: "Running compliance checks" },
  { threshold: 90, label: "Calibrating risk models" },
  { threshold: 100, label: "SafetyOS online" },
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
      const elapsed = Math.min(2400, performance.now() - start);
      const nextProgress = Math.floor((elapsed / 2400) * 100);
      setProgress(nextProgress);
      if (elapsed >= 2400) {
        window.clearInterval(interval);
        setFading(true);
        window.setTimeout(() => setActive(false), 600);
      }
    }, 50);

    return () => window.clearInterval(interval);
  }, []);

  const currentStatus = statusSteps.find((step) => progress <= step.threshold)?.label ?? statusSteps[statusSteps.length - 1].label;

  if (!active) return <>{children}</>;

  return (
    <div
      style={{
        position: "fixed", inset: 0, zIndex: 9999,
        background: "var(--bg-canvas)", color: "var(--text-primary)",
        display: "grid", placeItems: "center", padding: 24,
        opacity: fading ? 0 : 1, transition: "opacity 0.6s ease",
      }}
    >
      <div style={{ maxWidth: 440, width: "100%" }}>
        <div style={{ marginBottom: 28 }}>
          <div style={{
            fontSize: 10, letterSpacing: "0.2em", color: "var(--accent)",
            textTransform: "uppercase", fontWeight: 700, marginBottom: 12,
          }}>
            SafetyOS
          </div>
          <div style={{
            fontSize: 26, fontWeight: 700, letterSpacing: "-0.02em",
            color: "var(--text-primary)", marginBottom: 4,
          }}>
            AI Operating System
          </div>
          <div style={{ fontSize: 13, color: "var(--text-secondary)" }}>
            for Industrial Safety
          </div>
        </div>

        <div className="card" style={{ padding: 20, marginBottom: 16 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
            <div style={{ fontSize: 12, fontWeight: 600, color: "var(--text-primary)" }}>Boot sequence</div>
            <div style={{ fontSize: 12, color: "var(--text-muted)", fontFamily: "var(--font-mono)" }}>{progress}%</div>
          </div>
          <div style={{ height: 4, borderRadius: "var(--radius-full)", overflow: "hidden", background: "var(--bg-subtle)" }}>
            <div style={{
              width: `${progress}%`, height: "100%", background: "var(--accent)",
              transition: "width 0.1s linear",
            }} />
          </div>
          <div style={{ marginTop: 12, color: "var(--text-secondary)", fontSize: 12, minHeight: 20 }}>
            {currentStatus}
          </div>
        </div>

        <div style={{ display: "grid", gap: 8 }}>
          {statusSteps.map((step) => {
            const done = progress >= step.threshold;
            return (
              <div key={step.label} style={{
                display: "flex", alignItems: "center", gap: 10,
                opacity: done ? 1 : 0.4, transition: "opacity 0.2s",
              }}>
                <div style={{
                  width: 8, height: 8, borderRadius: "50%",
                  background: done ? "var(--accent)" : "var(--border-strong)",
                }} />
                <div style={{ fontSize: 12, color: "var(--text-secondary)" }}>{step.label}</div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
