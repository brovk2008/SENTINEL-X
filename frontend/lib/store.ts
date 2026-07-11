import { create } from "zustand";

export type Severity = "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";

export interface Sensor {
  sensor_id: string;
  name: string;
  type: string;
  unit: string;
  zone: string;
  value: number;
  risk_level: Severity;
  warning_threshold: number;
  critical_threshold: number;
  normal_range: [number, number];
  is_anomaly?: boolean;
  timestamp?: string;
}

export interface Alert {
  id: string;
  title: string;
  zone?: string;
  risk_score?: number;
  severity: Severity;
  explanation?: string;
  factors?: Array<{ label: string; value: number }>;
  recommended_action?: string;
  confidence?: number;
  is_false_alarm_unlikely?: boolean;
  read?: boolean;
  description?: string;
  timestamp?: string;
}

export interface CompoundRiskFactor {
  severity: "critical" | "high";
  description: string;
  current_value: string;
  threshold: string;
}

export interface CompoundRisk {
  rule_id: string;
  title: string;
  severity: Severity;
  risk_probability: number;
  zone: string;
  estimated_time_to_critical?: string;
  factors: CompoundRiskFactor[];
  ai_explanation?: string;
  recommended_action: string;
  similar_incident?: string;
  detected_at: string;
}

export interface AgentMessage {
  agent_key: string;
  agent_name: string;
  emoji: string;
  message: string;
  timestamp: string;
  is_final?: boolean;
}

export interface AppNotification {
  id: string;
  title: string;
  severity: Severity;
  timestamp: string;
  description?: string;
  zone?: string;
  read?: boolean;
}

export interface CameraDetection {
  camera_id: string;
  workers_detected?: number;
  ppe_compliant?: number;
  restricted_zone_violations?: number;
  detections?: Array<{
    id: string;
    bbox: number[];
    confidence: number;
    ppe_compliant: boolean;
    in_restricted_zone: boolean;
  }>;
}

export interface SensorHistoryPoint {
  timestamp: string;
  value: number;
}

export interface LLMConfig {
  provider: string;
  model: string;
  apiKey?: string;
}

interface StoreState {
  wsConnected: boolean;
  sensors: Record<string, Sensor>;
  plantRiskScore: number;
  alerts: Alert[];
  compoundRisks: CompoundRisk[];
  debateMessages: AgentMessage[];
  isDebateRunning: boolean;
  debateSessionId: string | null;
  emergencyActive: boolean;
  cameraDetections: Record<string, CameraDetection>;
  notifications: AppNotification[];
  notificationPanelOpen: boolean;
  unreadCount: number;
  notificationUnreadCount: number;
  demoMode: boolean;
  demoStep: number;
  demoHighlight: string | null;
  llmConfig: LLMConfig | null;

  setWsConnected: (v: boolean) => void;
  setSensors: (v: Record<string, Sensor> | Sensor[]) => void;
  setPlantRiskScore: (v: number) => void;
  addAlert: (a: Alert) => void;
  markAlertRead: (id: string) => void;
  setCompoundRisks: (r: CompoundRisk[]) => void;
  addDebateMessage: (m: AgentMessage) => void;
  setDebateRunning: (v: boolean) => void;
  startDebateSession: (id: string) => void;
  clearDebate: () => void;
  setEmergencyActive: (v: boolean) => void;
  updateCameraDetections: (cameraId: string, data: unknown) => void;
  addNotification: (n: AppNotification) => void;
  markNotificationRead: (id: string) => void;
  dismissNotification: (id: string) => void;
  markAllNotificationsRead: () => void;
  setNotificationPanelOpen: (v: boolean) => void;
  setDemoMode: (v: boolean) => void;
  setDemoStep: (v: number) => void;
  setDemoHighlight: (v: string | null) => void;
  setLLMConfig: (c: LLMConfig) => void;
}

export const useStore = create<StoreState>((set) => ({
  wsConnected: false,
  sensors: {},
  plantRiskScore: 18,
  alerts: [],
  compoundRisks: [],
  debateMessages: [],
  isDebateRunning: false,
  debateSessionId: null,
  emergencyActive: false,
  cameraDetections: {},
  notifications: [],
  notificationPanelOpen: false,
  unreadCount: 0,
  notificationUnreadCount: 0,
  demoMode: false,
  demoStep: 0,
  demoHighlight: null,
  llmConfig: null,

  setWsConnected: (v) => set({ wsConnected: v }),
  setSensors: (v) =>
    set({
      sensors: Array.isArray(v)
        ? Object.fromEntries(v.map((s) => [s.sensor_id, s]))
        : v,
    }),
  setPlantRiskScore: (v) => set({ plantRiskScore: v }),
  addAlert: (a) =>
    set((s) => ({ alerts: [a, ...s.alerts].slice(0, 50) })),
  markAlertRead: (id) =>
    set((s) => ({
      alerts: s.alerts.map((a) => (a.id === id ? { ...a, read: true } : a)),
    })),
  setCompoundRisks: (r) => set({ compoundRisks: r }),
  addDebateMessage: (m) =>
    set((s) => ({ debateMessages: [...s.debateMessages, m] })),
  setDebateRunning: (v) => set({ isDebateRunning: v }),
  startDebateSession: (id) =>
    set({ debateSessionId: id, debateMessages: [] }),
  clearDebate: () =>
    set({ debateMessages: [], isDebateRunning: false, debateSessionId: null }),
  setEmergencyActive: (v) => set({ emergencyActive: v }),
  updateCameraDetections: (cameraId, data) =>
    set((s) => ({
      cameraDetections: {
        ...s.cameraDetections,
        [cameraId]: data as CameraDetection,
      },
    })),
  addNotification: (n) =>
    set((s) => {
      const notifications = [n, ...s.notifications].slice(0, 100);
      const notificationUnreadCount = notifications.filter(
        (x) => !x.read
      ).length;
      const unreadCount = s.alerts.filter((a) => !a.read).length;
      return { notifications, notificationUnreadCount, unreadCount };
    }),
  markNotificationRead: (id) =>
    set((s) => {
      const notifications = s.notifications.map((n) =>
        n.id === id ? { ...n, read: true } : n
      );
      return {
        notifications,
        notificationUnreadCount: notifications.filter((x) => !x.read).length,
      };
    }),
  dismissNotification: (id) =>
    set((s) => {
      const notifications = s.notifications.filter((n) => n.id !== id);
      return {
        notifications,
        notificationUnreadCount: notifications.filter((x) => !x.read).length,
      };
    }),
  markAllNotificationsRead: () =>
    set((s) => ({
      notifications: s.notifications.map((n) => ({ ...n, read: true })),
      notificationUnreadCount: 0,
    })),
  setNotificationPanelOpen: (v) => set({ notificationPanelOpen: v }),
  setDemoMode: (v) => set({ demoMode: v }),
  setDemoStep: (v) => set({ demoStep: v }),
  setDemoHighlight: (v) => set({ demoHighlight: v }),
  setLLMConfig: (c) => set({ llmConfig: c }),
}));
