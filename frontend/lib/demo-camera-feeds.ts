// frontend/lib/demo-camera-feeds.ts
// Curated YouTube IDs of real industrial/factory footage for demo camera feeds.
// All are publicly embeddable. Falls back gracefully if embed blocked.

export interface DemoCameraConfig {
  camera_id: string;
  name: string;
  zone: string;
  youtube_id: string | null;
  start_seconds: number;
  description: string;
  has_alert?: boolean;
  alert_text?: string;
  offline?: boolean;
}

export const DEMO_CAMERA_FEEDS: DemoCameraConfig[] = [
  {
    camera_id: "CAM-01",
    name: "Zone A — Tank Farm Entry",
    zone: "ZA",
    youtube_id: "RN4V7w8-fBc",
    start_seconds: 30,
    description: "Storage tank farm CCTV overhead angle",
  },
  {
    camera_id: "CAM-02",
    name: "Zone B — Processing Unit",
    zone: "ZB",
    youtube_id: "qJ_KgnOUQkM",
    start_seconds: 0,
    description: "Processing unit floor level camera",
  },
  {
    camera_id: "CAM-03",
    name: "Zone C — Compressor Bay",
    zone: "ZC",
    youtube_id: "Y7hDNzjRqdk",
    start_seconds: 15,
    description: "Compressor bay — CRITICAL ZONE",
    has_alert: true,
    alert_text: "PPE Violation — 1 worker no helmet",
  },
  {
    camera_id: "CAM-04",
    name: "Zone D — Control Room",
    zone: "ZD",
    youtube_id: "sZ_1YEuFqL4",
    start_seconds: 0,
    description: "Main control room operations",
  },
  {
    camera_id: "CAM-05",
    name: "Zone A — Tank Farm Overview",
    zone: "ZA",
    youtube_id: "N7N6GOYIX7A",
    start_seconds: 45,
    description: "Tank farm wide angle overview",
  },
  {
    camera_id: "CAM-06",
    name: "Zone B — Rotating Equipment",
    zone: "ZB",
    youtube_id: "Ul6oZ2QFFHY",
    start_seconds: 10,
    description: "Rotating equipment area",
  },
  {
    camera_id: "CAM-07",
    name: "Main Gate — Entry Point",
    zone: "GATE",
    youtube_id: "PFRCq8LXX8U",
    start_seconds: 0,
    description: "Plant main entry gate",
    has_alert: true,
    alert_text: "Unauthorized entry — no permit verified",
  },
  {
    camera_id: "CAM-08",
    name: "Zone F — Flare Stack",
    zone: "ZF",
    youtube_id: null,
    start_seconds: 0,
    description: "Flare stack — camera offline",
    offline: true,
  },
];
