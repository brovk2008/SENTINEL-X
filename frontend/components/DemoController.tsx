"use client";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { X, RotateCcw } from "lucide-react";
import { useStore } from "@/lib/store";

const demoSteps = [
  { title: "Trigger Zone C Alert", description: "Call the risk simulator and navigate to Mission Control" },
  { title: "Show Plant Map Alert", description: "Highlight the live plant map with the new alert" },
  { title: "Run Agent Debate", description: "Navigate to the Debate Room and trigger the scripted debate" },
  { title: "Show Prediction Score", description: "Return to Mission Control and show prediction insight" },
  { title: "Scenario Simulator", description: "Open the simulator and pre-load Scenario A" },
  { title: "Timeline Replay", description: "Open incident replay and auto-play the first incident" },
  { title: "Executive Briefing", description: "Navigate to the executive briefing page" },
  { title: "Knowledge RAG", description: "Open the knowledge assistant with a pre-filled question" },
];

export function DemoController() {
  const router = useRouter();
  const { demoMode, demoStep, setDemoStep, setDemoMode, setDemoHighlight } = useStore();
  const [panelOpen, setPanelOpen] = useState(false);
  const [dragging, setDragging] = useState(false);
  const [position, setPosition] = useState({ x: 24, y: 220 });
  const dragRef = useRef<{ startX: number; startY: number; originX: number; originY: number } | null>(null);

  useEffect(() => {
    const handleMove = (event: MouseEvent) => {
      if (!dragging || !dragRef.current) return;
      const deltaX = event.clientX - dragRef.current.startX;
      const deltaY = event.clientY - dragRef.current.startY;
      setPosition({
        x: Math.max(12, Math.min(window.innerWidth - 340, dragRef.current.originX + deltaX)),
        y: Math.max(12, Math.min(window.innerHeight - 420, dragRef.current.originY + deltaY)),
      });
    };
    const handleUp = () => setDragging(false);
    window.addEventListener("mousemove", handleMove);
    window.addEventListener("mouseup", handleUp);
    return () => {
      window.removeEventListener("mousemove", handleMove);
      window.removeEventListener("mouseup", handleUp);
    };
  }, [dragging]);

  const goToStep = async (index: number) => {
    setDemoMode(true);
    setDemoStep(index + 1);
    switch (index) {
      case 0:
        await fetch(`${process.env.NEXT_PUBLIC_API_URL}/agents/simulate-risk`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ rule_id: 1 }),
        });
        router.push("/");
        setDemoHighlight("plant-map");
        break;
      case 1:
        router.push("/");
        setDemoHighlight("plant-map");
        break;
      case 2:
        router.push("/agents?demo=true&scenario=h2s_confined_space");
        break;
      case 3:
        router.push("/");
        setDemoHighlight("prediction-widget");
        break;
      case 4:
        router.push("/simulator?demo=scenarioA");
        break;
      case 5:
        router.push("/incidents?demo=true");
        break;
      case 6:
        router.push("/executive");
        break;
      case 7:
        router.push("/knowledge?question=What%20is%20the%20safe%20re-entry%20procedure%20after%20H2S%20detection%3F");
        break;
      default:
        break;
    }
  };

  const nextStep = () => {
    const next = Math.min(demoSteps.length - 1, demoStep);
    goToStep(next);
  };

  const prevStep = () => {
    const previous = Math.max(0, demoStep - 2);
    setDemoStep(previous + 1);
  };

  const reset = () => {
    setDemoStep(0);
    setDemoMode(false);
    setDemoHighlight(null);
    setPanelOpen(false);
  };

  return (
    <div>
      {demoMode && (
        <div style={{ position: "fixed", top: "18px", right: "18px", zIndex: 10010, padding: "8px 12px", borderRadius: "999px", background: "rgba(0,255,136,0.18)", color: "#00ff88", fontSize: "11px", fontWeight: 700, boxShadow: "0 10px 30px rgba(0,255,136,0.15)" }}>
          DEMO MODE
        </div>
      )}

      <button
        type="button"
        onClick={() => setPanelOpen((prev) => !prev)}
        style={{
          position: "fixed",
          left: position.x,
          top: position.y,
          zIndex: 10000,
          width: "68px",
          height: "68px",
          borderRadius: "24px",
          background: "linear-gradient(135deg, #44ff99, #18a6ff)",
          color: "white",
          border: "none",
          display: "grid",
          placeItems: "center",
          boxShadow: "0 24px 70px rgba(0,0,0,0.28)",
          cursor: "pointer",
          fontSize: "14px",
          fontWeight: 700,
        }}
      >
        🎬 DEMO
      </button>

      {panelOpen && (
        <div
          style={{
            position: "fixed",
            left: position.x,
            top: position.y + 80,
            zIndex: 10000,
            width: "320px",
            borderRadius: "26px",
            background: "rgba(10,12,24,0.96)",
            border: "1px solid rgba(255,255,255,0.08)",
            boxShadow: "0 32px 120px rgba(0,0,0,0.35)",
            color: "white",
            overflow: "hidden",
          }}
        >
          <div
            onMouseDown={(event) => {
              event.preventDefault();
              setDragging(true);
              dragRef.current = { startX: event.clientX, startY: event.clientY, originX: position.x, originY: position.y };
            }}
            style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "12px", padding: "16px 18px", background: "rgba(255,255,255,0.04)", cursor: "grab" }}
          >
            <div>
              <div style={{ fontSize: "12px", color: "#00ff88", textTransform: "uppercase", letterSpacing: "0.14em", marginBottom: "4px" }}>
                Demo Controller
              </div>
              <div style={{ fontSize: "16px", fontWeight: 700, lineHeight: 1.2 }}>Playbook</div>
            </div>
            <button type="button" onClick={() => setPanelOpen(false)} style={{ border: "none", background: "transparent", color: "white", cursor: "pointer" }}>
              <X size={18} />
            </button>
          </div>

          <div style={{ padding: "16px 18px", display: "grid", gap: "12px" }}>
            {demoSteps.map((step, index) => {
              const status = demoStep === index + 1 ? "Active" : demoStep > index + 1 ? "Done" : "Pending";
              return (
                <button
                  key={step.title}
                  type="button"
                  onClick={() => goToStep(index)}
                  style={{
                    display: "grid",
                    gap: "8px",
                    textAlign: "left",
                    width: "100%",
                    padding: "14px",
                    borderRadius: "16px",
                    background: "rgba(255,255,255,0.04)",
                    border: `1px solid ${demoStep === index + 1 ? "#00ff88" : "rgba(255,255,255,0.08)"}`,
                    color: "white",
                    cursor: "pointer",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "10px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                      <span style={{ fontSize: "14px", color: "#00ff88" }}>{index + 1}</span>
                      <span style={{ fontSize: "14px", fontWeight: 700 }}>{step.title}</span>
                    </div>
                    <span style={{ fontSize: "11px", color: status === "Done" ? "#00ff88" : status === "Active" ? "#ffaa00" : "rgba(255,255,255,0.65)", textTransform: "uppercase", fontWeight: 700 }}>
                      {status}
                    </span>
                  </div>
                  <div style={{ fontSize: "12px", color: "rgba(255,255,255,0.65)" }}>{step.description}</div>
                </button>
              );
            })}
          </div>

          <div style={{ display: "flex", justifyContent: "space-between", gap: "10px", padding: "0 18px 18px" }}>
            <button
              type="button"
              onClick={prevStep}
              className="btn btn-ghost btn-sm"
              style={{ flex: 1 }}
            >
              ← Prev
            </button>
            <button
              type="button"
              onClick={reset}
              className="btn btn-ghost btn-sm"
              style={{ flex: 1 }}
            >
              <RotateCcw size={14} /> Reset
            </button>
            <button
              type="button"
              onClick={nextStep}
              className="btn btn-primary btn-sm"
              style={{ flex: 1 }}
            >
              Next →
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
