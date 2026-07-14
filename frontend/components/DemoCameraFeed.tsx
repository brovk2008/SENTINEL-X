// frontend/components/DemoCameraFeed.tsx
// Full rewrite using HTML5 Video frames rendered onto a canvas overlayed with CV boxes.

'use client';
import { useEffect, useRef, useState } from 'react';

interface CameraFeed {
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

interface Props {
  feed: CameraFeed;
  onClick: () => void;
}

// Worker detection boxes - pre-computed positions for each camera
const WORKER_POSITIONS: Record<string, Array<{x: number, y: number, w: number, h: number, ppe: boolean}>> = {
  "CAM-01": [{x:15,y:20,w:18,h:40,ppe:true},{x:45,y:15,w:16,h:38,ppe:true},{x:65,y:25,w:17,h:35,ppe:true},{x:80,y:20,w:16,h:38,ppe:true}],
  "CAM-02": [{x:30,y:20,w:18,h:40,ppe:true},{x:60,y:15,w:16,h:38,ppe:true}],
  "CAM-03": [{x:10,y:20,w:17,h:38,ppe:true},{x:28,y:15,w:16,h:40,ppe:true},{x:46,y:22,w:17,h:36,ppe:true},{x:62,y:18,w:16,h:38,ppe:true},{x:72,y:20,w:17,h:40,ppe:false},{x:82,y:15,w:15,h:38,ppe:false}],
  "CAM-04": [{x:25,y:30,w:16,h:35,ppe:true},{x:50,y:25,w:16,h:38,ppe:true},{x:72,y:28,w:15,h:36,ppe:true}],
  "CAM-05": [{x:40,y:25,w:18,h:40,ppe:true}],
  "CAM-06": [{x:45,y:20,w:17,h:38,ppe:true}],
  "CAM-07": [{x:20,y:25,w:16,h:38,ppe:true},{x:50,y:20,w:17,h:40,ppe:false},{x:75,y:22,w:16,h:38,ppe:true}],
};

export function DemoCameraFeed({ feed, onClick }: Props) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [videoLoaded, setVideoLoaded] = useState(false);
  const [videoError, setVideoError] = useState(false);

  useEffect(() => {
    if (!feed.video_url || feed.offline) return;
    const video = videoRef.current;
    if (!video) return;

    video.src = feed.video_url;
    video.muted = true;
    video.loop = true;
    video.playsInline = true;
    video.crossOrigin = 'anonymous';

    const onLoad = () => {
      setVideoLoaded(true);
      video.play().catch(() => setVideoError(true));
    };
    const onError = () => setVideoError(true);

    video.addEventListener('canplay', onLoad);
    video.addEventListener('error', onError);
    video.load();

    return () => {
      video.removeEventListener('canplay', onLoad);
      video.removeEventListener('error', onError);
    };
  }, [feed.video_url]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const workers = WORKER_POSITIONS[feed.camera_id] || [];
    let frame = 0;

    const draw = () => {
      const w = canvas.width;
      const h = canvas.height;

      ctx.clearRect(0, 0, w, h);

      // Draw from video if loaded, else dark background
      const video = videoRef.current;
      if (video && videoLoaded && !videoError) {
        try {
          ctx.drawImage(video, 0, 0, w, h);
          // Green tint overlay for CCTV feel
          ctx.fillStyle = 'rgba(0, 15, 0, 0.12)';
          ctx.fillRect(0, 0, w, h);
        } catch {
          ctx.fillStyle = feed.fallback_color;
          ctx.fillRect(0, 0, w, h);
        }
      } else {
        // Animated dark background (shows something is happening)
        ctx.fillStyle = feed.offline ? '#080808' : feed.fallback_color;
        ctx.fillRect(0, 0, w, h);

        if (!feed.offline) {
          // Animated scan line
          const scanY = (frame * 2) % h;
          ctx.fillStyle = 'rgba(0, 255, 0, 0.03)';
          ctx.fillRect(0, scanY, w, 2);

          // Random static noise dots
          if (frame % 3 === 0) {
            for (let i = 0; i < 30; i++) {
              ctx.fillStyle = `rgba(0,200,0,${Math.random() * 0.08})`;
              ctx.fillRect(Math.random() * w, Math.random() * h, 1, 1);
            }
          }
        }
      }

      // Draw PPE detection boxes
      workers.forEach((worker, i) => {
        const wx = (worker.x / 100) * w;
        const wy = (worker.y / 100) * h;
        const ww = (worker.w / 100) * w;
        const wh = (worker.h / 100) * h;

        // Slight drift animation
        const drift = Math.sin(frame * 0.02 + i) * 1.5;

        const color = worker.ppe ? '#00ff44' : '#ff3333';
        const label = worker.ppe ? 'PPE ✓ OK' : 'PPE ✗ VIOLATION';

        // Detection box
        ctx.strokeStyle = color;
        ctx.lineWidth = 1.5;
        ctx.setLineDash([]);
        ctx.strokeRect(wx + drift, wy, ww, wh);

        // Corner markers (CCTV tracking feel)
        const cw = 6;
        ctx.lineWidth = 2;
        ctx.strokeStyle = color;
        // Top-left corner
        ctx.beginPath();
        ctx.moveTo(wx + drift, wy + cw);
        ctx.lineTo(wx + drift, wy);
        ctx.lineTo(wx + drift + cw, wy);
        ctx.stroke();
        // Top-right corner
        ctx.beginPath();
        ctx.moveTo(wx + drift + ww - cw, wy);
        ctx.lineTo(wx + drift + ww, wy);
        ctx.lineTo(wx + drift + ww, wy + cw);
        ctx.stroke();

        // Label background
        const labelW = worker.ppe ? 58 : 90;
        const labelH = 13;
        ctx.fillStyle = worker.ppe ? 'rgba(0,150,40,0.85)' : 'rgba(180,0,0,0.85)';
        ctx.fillRect(wx + drift, wy - labelH - 1, labelW, labelH);

        ctx.fillStyle = '#ffffff';
        ctx.font = `bold 8px "Courier New", monospace`;
        ctx.fillText(label, wx + drift + 2, wy - 4);
      });

      // Scanline overlay
      for (let y = 0; y < h; y += 3) {
        ctx.fillStyle = 'rgba(0, 0, 0, 0.06)';
        ctx.fillRect(0, y, w, 1);
      }

      // Alert flash for cameras with alerts
      if (feed.has_alert && Math.floor(frame / 15) % 2 === 0) {
        ctx.strokeStyle = 'rgba(255, 0, 0, 0.6)';
        ctx.lineWidth = 3;
        ctx.strokeRect(1, 1, w - 2, h - 2);
      }

      frame++;
      requestAnimationFrame(draw);
    };

    const animFrame = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(animFrame);
  }, [feed, videoLoaded, videoError]);

  if (feed.offline) {
    return (
      <div
        style={{
          position: 'relative',
          background: '#080808',
          border: '1px solid #1a1a20',
          borderRadius: 6,
          aspectRatio: '16/10',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexDirection: 'column',
          gap: 6,
          cursor: 'default',
          overflow: 'hidden',
        }}
      >
        <div style={{ fontSize: 11, color: '#303030', fontFamily: 'monospace', fontWeight: 700 }}>
          NO SIGNAL
        </div>
        <div style={{ fontSize: 9, color: '#202020', fontFamily: 'monospace' }}>
          {feed.camera_id} — OFFLINE
        </div>
      </div>
    );
  }

  return (
    <div
      onClick={onClick}
      style={{
        position: 'relative',
        border: feed.has_alert ? '2px solid #cc2222' : '1px solid #2e2e36',
        borderRadius: 6,
        overflow: 'hidden',
        cursor: 'pointer',
        aspectRatio: '16/10',
        background: feed.fallback_color,
        animation: feed.has_alert ? 'none' : 'none',
      }}
    >
      {/* Hidden video element for frame source */}
      <video
        ref={videoRef}
        style={{ display: 'none' }}
        muted
        loop
        playsInline
        preload="auto"
      />

      {/* Canvas with detection overlays */}
      <canvas
        ref={canvasRef}
        width={320}
        height={200}
        style={{ width: '100%', height: '100%', display: 'block' }}
      />

      {/* Top bar overlay */}
      <div style={{
        position: 'absolute', top: 0, left: 0, right: 0,
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        padding: '3px 6px',
        background: 'linear-gradient(to bottom, rgba(0,0,0,0.8), transparent)',
      }}>
        <span style={{ fontSize: 9, fontFamily: 'monospace', color: '#c0c0c0', fontWeight: 700 }}>
          {feed.camera_id}
        </span>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          {feed.has_alert && (
            <span style={{ fontSize: 8, color: '#ff4444', fontWeight: 700, fontFamily: 'monospace' }}>
              ⚠ ALERT
            </span>
          )}
          <span style={{ fontSize: 8, color: '#ff3333', fontWeight: 700, fontFamily: 'monospace' }}>
            ● REC
          </span>
        </div>
      </div>

      {/* Bottom bar overlay */}
      <div style={{
        position: 'absolute', bottom: 0, left: 0, right: 0,
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        padding: '3px 6px',
        background: 'linear-gradient(to top, rgba(0,0,0,0.85), transparent)',
      }}>
        <div>
          <div style={{ fontSize: 8, color: '#606070', fontFamily: 'monospace' }}>{feed.zone}</div>
          <div style={{ fontSize: 9, color: '#a0a0b0', fontFamily: 'monospace', fontWeight: 600 }}>
            {feed.name.split('—')[1]?.trim() || feed.name}
          </div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{
            fontSize: 9, fontWeight: 700, fontFamily: 'monospace',
            color: feed.ppe_pct < 80 ? '#cc3333' : feed.ppe_pct < 100 ? '#cc9900' : '#22aa55',
          }}>
            PPE {feed.ppe_pct}%
          </div>
          <div style={{ fontSize: 8, color: '#606070', fontFamily: 'monospace' }}>
            {feed.workers} workers
          </div>
        </div>
      </div>
    </div>
  );
}
