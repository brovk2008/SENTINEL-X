"use client";
import { create } from "zustand";

export interface SensorReading {
  sensor_id: string;
  name: string;
  type: string;
  unit: string;
  zone: string;
  value: number;
  risk_level: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  warning_threshold: number;
  critical_threshold: number;
  normal_range: [number, number];
  timestamp: string;
  is_anomaly: boolean;
}

export interface Alert {
  id: string;
  title: string;
  description?: string;
  severity: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  zone?: string;
  risk_score?: number;
  timestamp: string;
  read?: boolean;
  dismissed?: boolean;
  factors?: Array<{ label: string; value: number }>;
  explanation?: string;
  recommended_action?: string;
  confidence?: number;
  is_false_alarm_unlikely?: boolean;
  compound_factors?: string[];
  ai_explanation?: string;
  risk_probability?: number;
  is_compound?: boolean;
}

export interface AgentMessage {
  session_id: string;
  agent_key: string;
  agent_name: string;
  emoji: string;
  color: string;
  message: string;
  timestamp: string;
  is_final: boolean;
}

export interface CompoundRisk {
  rule_id: string;
  title: string;
  zone: string;
  risk_probability: number;
  severity: string;
  factors: Array<{ description: string; current_value: string; threshold: string; severity: string }>;
  recommended_action: string;
  estimated_time_to_critical?: string;
  similar_incident?: string;
  ai_explanation?: string;
  detected_at: string;
}

interface SafetyOSState {
  // Connection
  wsConnected: boolean;
  setWsConnected: (v: boolean) => void;

  // Sensors
  sensors: Record<string, SensorReading>;
  setSensors: (s: Record<string, SensorReading>) => void;
  updateSensor: (id: string, reading: SensorReading) => void;

  // Risk
  plantRiskScore: number;
  setPlantRiskScore: (score: number) => void;

  // Alerts
  alerts: Alert[];
  alertUnreadCount: number;
  addAlert: (alert: Alert) => void;
  markAlertRead: (id: string) => void;
  clearAlerts: () => void;

  // Compound risks
  compoundRisks: CompoundRisk[];
  setCompoundRisks: (risks: CompoundRisk[]) => void;

  // Agent debate
  currentDebateSession: string | null;
  debateMessages: AgentMessage[];
  isDebateRunning: boolean;
  setDebateRunning: (v: boolean) => void;
  addDebateMessage: (msg: AgentMessage) => void;
  clearDebate: () => void;
  startDebateSession: (id: string) => void;

  // Emergency
  emergencyActive: boolean;
  setEmergencyActive: (v: boolean) => void;

  // Camera detections
  cameraDetections: Record<string, unknown>;
  updateCameraDetections: (camId: string, data: unknown) => void;

  // Notifications (in-app)
  notifications: Alert[];
  addNotification: (n: Alert) => void;
  markNotificationRead: (id: string) => void;
  dismissNotification: (id: string) => void;
  markAllNotificationsRead: () => void;
  notificationUnreadCount: number;
  notificationPanelOpen: boolean;
  setNotificationPanelOpen: (open: boolean) => void;
  unreadCount: number;
 
  // Settings
  llmProvider: string;
  llmModel: string;
  setLLMConfig: (provider: string, model: string) => void;

  // Demo Mode
  demoMode: boolean;
  setDemoMode: (v: boolean) => void;
  demoStep: number;
  setDemoStep: (step: number) => void;
  demoHighlight: string | null;
  setDemoHighlight: (highlight: string | null) => void;
}

export const useStore = create<SafetyOSState>((set) => ({
  wsConnected: false,
  setWsConnected: (v) => set({ wsConnected: v }),

  sensors: {},
  setSensors: (sensors) => set({ sensors }),
  updateSensor: (id, reading) =>
    set((state) => ({ sensors: { ...state.sensors, [id]: reading } })),

  plantRiskScore: 0,
  setPlantRiskScore: (score) => set({ plantRiskScore: score }),

  alerts: [],
  alertUnreadCount: 0,
  addAlert: (alert) =>
    set((state) => ({
      alerts: [alert, ...state.alerts.slice(0, 49)], // Keep last 50
      alertUnreadCount: state.alertUnreadCount + 1,
    })),
  markAlertRead: (id) =>
    set((state) => ({
      alerts: state.alerts.map((a) => (a.id === id ? { ...a, read: true } : a)),
      alertUnreadCount: Math.max(0, state.alertUnreadCount - 1),
    })),
  clearAlerts: () => set({ alerts: [], alertUnreadCount: 0 }),
 
  compoundRisks: [],
  setCompoundRisks: (risks) => set({ compoundRisks: risks }),

  currentDebateSession: null,
  debateMessages: [],
  isDebateRunning: false,
  setDebateRunning: (v) => set({ isDebateRunning: v }),
  addDebateMessage: (msg) =>
    set((state) => ({ debateMessages: [...state.debateMessages, msg] })),
  clearDebate: () => set({ debateMessages: [], currentDebateSession: null }),
  startDebateSession: (id) => set({ currentDebateSession: id, debateMessages: [] }),

  emergencyActive: false,
  setEmergencyActive: (v) => set({ emergencyActive: v }),

  cameraDetections: {},
  updateCameraDetections: (camId, data) =>
    set((state) => ({ cameraDetections: { ...state.cameraDetections, [camId]: data } })),

  notifications: [],
  notificationUnreadCount: 0,
  notificationPanelOpen: false,
  unreadCount: 0,
  addNotification: (n) =>
    set((state) => ({
      notifications: [n, ...state.notifications.slice(0, 19)],
      notificationUnreadCount: state.notificationUnreadCount + 1,
      unreadCount: state.notificationUnreadCount + 1,
    })),
  markNotificationRead: (id) =>
    set((state) => ({
      notifications: state.notifications.map((n) => (n.id === id ? { ...n, read: true } : n)),
      notificationUnreadCount: Math.max(0, state.notificationUnreadCount - 1),
      unreadCount: Math.max(0, state.notificationUnreadCount - 1),
    })),
  dismissNotification: (id) =>
    set((state) => ({
      notifications: state.notifications.filter((n) => n.id !== id),
    })),
  markAllNotificationsRead: () =>
    set((state) => ({
      notifications: state.notifications.map((n) => ({ ...n, read: true })),
      notificationUnreadCount: 0,
      unreadCount: 0,
    })),
  setNotificationPanelOpen: (open) => set({ notificationPanelOpen: open }),

  llmProvider: "gemini",
  llmModel: "gemini-2.0-flash-exp",
  setLLMConfig: (provider, model) => set({ llmProvider: provider, llmModel: model }),

  // Demo Mode
  demoMode: false,
  setDemoMode: (v) => set({ demoMode: v }),
  demoStep: 0,
  setDemoStep: (step) => set({ demoStep: step }),
  demoHighlight: null,
  setDemoHighlight: (highlight) => set({ demoHighlight: highlight }),
}));
