"use client";
import { create } from "zustand";

export interface SensorReading {
  id: string;
  name: string;
  value: string;
  timestamp: string;
}

export interface AlertItem {
  id: string;
  title: string;
  severity: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  timestamp: string;
  read?: boolean;
}

interface SafetyState {
  sensors: Record<string, SensorReading>;
  setSensors: (s: Record<string, SensorReading>) => void;
  updateSensor: (id: string, data: Partial<SensorReading>) => void;
  alerts: AlertItem[];
  addAlert: (a: AlertItem) => void;
  markAlertRead: (id: string) => void;
}

export const useStore = create<SafetyState>((set) => ({
  sensors: {},
  setSensors: (s) => set({ sensors: s }),
  updateSensor: (id, data) => set((state) => ({ sensors: { ...state.sensors, [id]: { ...(state.sensors[id] || { id, name: id, value: '—', timestamp: new Date().toISOString() }), ...data } } })),
  alerts: [],
  addAlert: (a) => set((state) => ({ alerts: [a, ...state.alerts].slice(0, 50) })),
  markAlertRead: (id) => set((state) => ({ alerts: state.alerts.map((x) => (x.id === id ? { ...x, read: true } : x)) })),
}));
