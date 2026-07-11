"use client";
import { ReactNode, useCallback, useEffect, useRef } from "react";
import { useStore } from "../../lib/store";

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

  const handleMessage = useCallback(
    (msg: { type: string; data: unknown }) => {
      switch (msg.type) {
        case "init": {
          const d = msg.data as { sensors?: Parameters<typeof setSensors>[0]; plant_risk_score?: number };
          if (d.sensors) setSensors(d.sensors);
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
          setCompoundRisks([risk]);
          addNotification({
            id: risk.rule_id + Date.now(),
            title: `Alert: ${risk.title}`,
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
    },
    [
      addAlert,
      addDebateMessage,
      addNotification,
      setCompoundRisks,
      setEmergencyActive,
      setPlantRiskScore,
      setSensors,
      updateCameraDetections,
    ]
  );

  const connect = useCallback(() => {
    try {
      const ws = new WebSocket(`${WS_URL}/ws/live`);
      wsRef.current = ws;

      ws.onopen = () => {
        setWsConnected(true);
        console.log("[SafetyOS] WebSocket connected");
      };

      ws.onclose = () => {
        setWsConnected(false);
        console.log("[SafetyOS] WebSocket disconnected; reconnecting in 3s");
        reconnectTimer.current = setTimeout(connect, 3000);
      };

      ws.onerror = (event) => {
        console.warn("[SafetyOS] WebSocket error:", event);
      };

      ws.onmessage = (event) => {
        try {
          handleMessage(JSON.parse(event.data));
        } catch (error) {
          console.warn("WS parse error:", error);
        }
      };
    } catch (error) {
      console.warn("WS connect failed:", error);
      reconnectTimer.current = setTimeout(connect, 3000);
    }
  }, [handleMessage, setWsConnected]);

  useEffect(() => {
    connect();
    return () => {
      wsRef.current?.close();
      if (reconnectTimer.current) clearTimeout(reconnectTimer.current);
    };
  }, [connect]);

  return <>{children}</>;
}
