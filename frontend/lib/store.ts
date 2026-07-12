"use client";
import { create } from "zustand";

export interface SensorReading {
  id: string;
  name: string;
  value: string;
  unit?: string;
  rawValue?: number;
  zone?: string;
  type?: string;
  status?: "normal" | "warn" | "crit" | "ok" | "offline";
  trend?: "up" | "down" | "flat";
  history?: number[];
  timestamp: string;
  threshold?: { warn: number; crit: number; max: number };
}

export interface AlertItem {
  id: string;
  title: string;
  severity: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  zone?: string;
  timestamp: string;
  read?: boolean;
}

export interface ConnectSource {
  id: string;
  name: string;
  protocol: "mqtt" | "opcua" | "modbus" | "rtsp" | "http_poll" | "simulated";
  host: string;
  port: number;
  status: "connected" | "disconnected" | "error" | "standby" | "connecting";
  tags_count?: number;
  last_seen?: string | null;
  error?: string | null;
}

interface SafetyState {
  // Sensors
  sensors: Record<string, SensorReading>;
  setSensors: (s: Record<string, SensorReading>) => void;
  updateSensor: (id: string, data: Partial<SensorReading>) => void;

  // Alerts
  alerts: AlertItem[];
  addAlert: (a: AlertItem) => void;
  markAlertRead: (id: string) => void;
  clearAlerts: () => void;

  // Plant
  plantRisk: number;
  setPlantRisk: (r: number) => void;

  // Connectivity
  connectSources: ConnectSource[];
  setConnectSources: (s: ConnectSource[]) => void;
  updateConnectSource: (id: string, data: Partial<ConnectSource>) => void;

  // Workers
  workerCount: number;
  setWorkerCount: (n: number) => void;
}

export const useStore = create<SafetyState>((set) => ({
  // ── Sensors ──
  sensors: {},
  setSensors: (s) => set({ sensors: s }),
  updateSensor: (id, data) =>
    set((state) => {
      const existing = state.sensors[id] || {
        id, name: id, value: "—", timestamp: new Date().toISOString(),
      };
      const updated = { ...existing, ...data };

      // Maintain history array (last 30 readings)
      if (data.rawValue !== undefined) {
        const hist = [...(existing.history || []), data.rawValue].slice(-30);
        updated.history = hist;
      }
      return { sensors: { ...state.sensors, [id]: updated } };
    }),

  // ── Alerts ──
  alerts: [],
  addAlert: (a) =>
    set((state) => ({ alerts: [a, ...state.alerts].slice(0, 50) })),
  markAlertRead: (id) =>
    set((state) => ({
      alerts: state.alerts.map((x) => (x.id === id ? { ...x, read: true } : x)),
    })),
  clearAlerts: () => set({ alerts: [] }),

  // ── Plant ──
  plantRisk: 84,
  setPlantRisk: (r) => set({ plantRisk: r }),

  // ── Connectivity ──
  connectSources: [],
  setConnectSources: (s) => set({ connectSources: s }),
  updateConnectSource: (id, data) =>
    set((state) => ({
      connectSources: state.connectSources.map((s) =>
        s.id === id ? { ...s, ...data } : s
      ),
    })),

  // ── Workers ──
  workerCount: 48,
  setWorkerCount: (n) => set({ workerCount: n }),
}));
