// frontend/lib/demo-camera-feeds.ts
// Curated direct MP4 video URLs of real industrial/factory footage for demo camera feeds.
// Replaces fragile YouTube embeds with high-performance direct video playback.

export interface DemoCameraConfig {
  camera_id: string;
  name: string;
  zone: string;
  video_url: string | null;
  fallback_color: string;
  workers: number;
  ppe_pct: number;
  has_alert: boolean;
  offline?: boolean;
}

export const DEMO_CAMERA_FEEDS: DemoCameraConfig[] = [
  {
    camera_id: "CAM-01",
    name: "Zone A — Tank Farm Entry",
    zone: "ZA",
    video_url: "https://videos.pexels.com/video-files/3249063/3249063-uhd_2560_1440_25fps.mp4",
    fallback_color: "#0d1a0d",
    workers: 4,
    ppe_pct: 100,
    has_alert: false,
  },
  {
    camera_id: "CAM-02",
    name: "Zone B — Processing Unit",
    zone: "ZB",
    video_url: "https://videos.pexels.com/video-files/2098823/2098823-hd_1280_720_25fps.mp4",
    fallback_color: "#0d100d",
    workers: 2,
    ppe_pct: 100,
    has_alert: false,
  },
  {
    camera_id: "CAM-03",
    name: "Zone C — Compressor Bay",
    zone: "ZC",
    video_url: "https://videos.pexels.com/video-files/3168389/3168389-uhd_2560_1440_25fps.mp4",
    fallback_color: "#1a0d0d",
    workers: 6,
    ppe_pct: 83,
    has_alert: true,
  },
  {
    camera_id: "CAM-04",
    name: "Zone D — Control Room",
    zone: "ZD",
    video_url: "https://videos.pexels.com/video-files/3249063/3249063-hd_1280_720_25fps.mp4",
    fallback_color: "#0d0d1a",
    workers: 3,
    ppe_pct: 100,
    has_alert: false,
  },
  {
    camera_id: "CAM-05",
    name: "Zone A — Tank Overview",
    zone: "ZA",
    video_url: "https://videos.pexels.com/video-files/2098823/2098823-uhd_2560_1440_25fps.mp4",
    fallback_color: "#0a120a",
    workers: 1,
    ppe_pct: 100,
    has_alert: false,
  },
  {
    camera_id: "CAM-06",
    name: "Zone B — Compressor Area",
    zone: "ZB",
    video_url: "https://videos.pexels.com/video-files/3168389/3168389-hd_1280_720_25fps.mp4",
    fallback_color: "#0d100d",
    workers: 1,
    ppe_pct: 100,
    has_alert: false,
  },
  {
    camera_id: "CAM-07",
    name: "Main Gate — Entry",
    zone: "GATE",
    video_url: "https://videos.pexels.com/video-files/2098823/2098823-hd_1280_720_25fps.mp4",
    fallback_color: "#120d0d",
    workers: 3,
    ppe_pct: 67,
    has_alert: true,
  },
  {
    camera_id: "CAM-08",
    name: "Zone F — Flare Stack",
    zone: "ZF",
    video_url: null,
    fallback_color: "#0a0a0a",
    workers: 0,
    ppe_pct: 0,
    has_alert: false,
    offline: true,
  },
];
