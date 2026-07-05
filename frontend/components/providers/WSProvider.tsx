"use client";
import { useEffect, useRef, ReactNode } from "react";
import { useStore } from "@/lib/store";

const WS_URL = process.env.NEXT_PUBLIC_WS_URL || "ws://localhost:8000";

export function WSProvider({ children }: { children: ReactNode }) {
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimer = useRef<ReturnType<typeof setTimeout>>();

  const {
    setWsConnected,
    setSensors,
    setPlantRiskScore,
    addAlert,
    setCompoundRisks,
    addDebateMessage,
    setEmergencyActive,
    updateCameraDetections,
    addNotification,
  } = useStore();

  const connect = () => {
    try {
      const ws = new WebSocket(`${WS_URL}/ws/live`);
      wsRef.current = ws;

      ws.onopen = () => {
        setWsConnected(true);
        console.log("[SafetyOS] WebSocket connected");
      };

      ws.onclose = () => {
        setWsConnected(false);
        console.log("[SafetyOS] WebSocket disconnected — reconnecting in 3s");
        reconnectTimer.current = setTimeout(connect, 3000);
      };

      ws.onerror = (e) => {
        console.warn("[SafetyOS] WebSocket error:", e);
      };

      ws.onmessage = (event) => {
        try {
          const msg = JSON.parse(event.data);
          handleMessage(msg);
        } catch (e) {
          console.warn("WS parse error:", e);
        }
      };
    } catch (e) {
      console.warn("WS connect failed:", e);
      reconnectTimer.current = setTimeout(connect, 3000);
    }
  };

  const handleMessage = (msg: { type: string; data: unknown }) => {
    switch (msg.type) {
      case "init": {
        const d = msg.data as { sensors?: Record<string, unknown>; plant_risk_score?: number; active_alerts?: unknown[] };
        if (d.sensors) setSensors(d.sensors as Parameters<typeof setSensors>[0]);
        if (d.plant_risk_score !== undefined) setPlantRiskScore(d.plant_risk_score);
        break;
      }
      case "sensor_update":
        setSensors(msg.data as Parameters<typeof setSensors>[0]);
        break;
      case "risk_update": {
        const d = msg.data as { plant_risk_score: number };
        if (d.plant_risk_score !== undefined) setPlantRiskScore(d.plant_risk_score);
        break;
      }
      case "alert": {
        const alert = msg.data as Parameters<typeof addAlert>[0];
        addAlert(alert);
        addNotification(alert);
        break;
      }
      case "compound_risk": {
        const risk = msg.data as Parameters<typeof setCompoundRisks>[0][number];
        setCompoundRisks([risk]); // Latest compound risk
        addNotification({
          id: risk.rule_id + Date.now(),
          title: `⚠️ ${risk.title}`,
          severity: risk.severity as "CRITICAL" | "HIGH" | "MEDIUM" | "LOW",
          timestamp: risk.detected_at,
        });
        break;
      }
      case "agent_message":
        addDebateMessage(msg.data as Parameters<typeof addDebateMessage>[0]);
        break;
      case "emergency":
        setEmergencyActive(true);
        break;
      case "camera_update": {
        const d = msg.data as { camera_id: string };
        updateCameraDetections(d.camera_id, msg.data);
        break;
      }
      case "notification":
        addNotification(msg.data as Parameters<typeof addNotification>[0]);
        break;
    }
  };

  useEffect(() => {
    connect();
    return () => {
      wsRef.current?.close();
      if (reconnectTimer.current) clearTimeout(reconnectTimer.current);
    };
  }, []);

  return <>{children}</>;
}
