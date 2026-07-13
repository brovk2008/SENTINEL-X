'use client';
import React, { useState } from 'react';
import { AlertTriangle, Users } from 'lucide-react';

interface DemoCameraFeedProps {
  cameraId: string;
  youtubeId: string | null;
  startSeconds?: number;
  offline?: boolean;
  hasAlert?: boolean;
  alertText?: string;
  workerCount: number;
  ppePct: number;
  name: string;
  zone: string;
  onClick: () => void;
}

export function DemoCameraFeed({
  cameraId,
  youtubeId,
  startSeconds = 0,
  offline = false,
  hasAlert = false,
  alertText,
  workerCount,
  ppePct,
  name,
  zone,
  onClick,
}: DemoCameraFeedProps) {
  const [embedFailed, setEmbedFailed] = useState(false);

  const ppeColor =
    ppePct < 80  ? '#cc2222' :
    ppePct < 100 ? '#cc9900' :
    '#2a7040';

  if (offline) {
    return (
      <div
        style={{
          background: '#0d0d0f',
          border: '1px solid #2e2e36',
          borderRadius: 6,
          aspectRatio: '16/10',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexDirection: 'column',
          gap: 8,
          cursor: 'default',
          position: 'relative',
        }}
      >
        {/* Camera ID */}
        <div style={{ position: 'absolute', top: 6, left: 8, fontSize: 10, fontFamily: 'monospace', color: '#404050', fontWeight: 700 }}>
          {cameraId}
        </div>
        <div style={{ fontSize: 28, opacity: 0.15, color: '#505060' }}>
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <path d="M23 7l-7 5 7 5V7z"/><rect x="1" y="5" width="15" height="14" rx="2" ry="2"/>
            <line x1="1" y1="1" x2="23" y2="23"/>
          </svg>
        </div>
        <div style={{ fontSize: 10, color: '#404050', fontFamily: 'monospace', fontWeight: 600 }}>NO SIGNAL</div>
        <div style={{ fontSize: 9, color: '#303040', fontFamily: 'monospace' }}>{zone} · OFFLINE</div>
      </div>
    );
  }

  const embedUrl = youtubeId && !embedFailed
    ? `https://www.youtube-nocookie.com/embed/${youtubeId}?autoplay=1&mute=1&loop=1&start=${startSeconds}&controls=0&disablekb=1&fs=0&modestbranding=1&iv_load_policy=3&rel=0&playlist=${youtubeId}`
    : null;

  return (
    <div
      onClick={onClick}
      style={{
        position: 'relative',
        border: hasAlert ? '2px solid #cc2222' : '1px solid #2e2e36',
        borderRadius: 6,
        overflow: 'hidden',
        cursor: 'pointer',
        aspectRatio: '16/10',
        background: '#0a0a0c',
        animation: hasAlert ? 'alarm-blink 1.2s ease-in-out infinite' : 'none',
      }}
    >
      {/* Video: YouTube embed or fallback dark canvas */}
      {embedUrl ? (
        <iframe
          src={embedUrl}
          style={{ width: '100%', height: '100%', border: 'none', pointerEvents: 'none', display: 'block' }}
          allow="autoplay; encrypted-media"
          title={name}
          onError={() => setEmbedFailed(true)}
        />
      ) : (
        // Fallback: stylized static noise pattern (canvas-based)
        <div style={{
          width: '100%',
          height: '100%',
          background: 'linear-gradient(135deg, #0d0d10 0%, #151518 50%, #0d0d10 100%)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: 10,
          color: '#303040',
          fontFamily: 'monospace',
        }}>
          LIVE FEED
        </div>
      )}

      {/* CRT scanlines overlay */}
      <div className="cctv-scanlines" />

      {/* Slight green tint (night-vision feel on some cameras) */}
      <div style={{
        position: 'absolute', inset: 0,
        background: 'rgba(0, 16, 0, 0.07)',
        pointerEvents: 'none',
      }} />

      {/* Top bar: Camera ID + REC + ALERT */}
      <div style={{
        position: 'absolute', top: 0, left: 0, right: 0,
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        padding: '4px 8px',
        background: 'linear-gradient(to bottom, rgba(0,0,0,0.8), transparent)',
        pointerEvents: 'none',
      }}>
        <span style={{ fontSize: 10, fontFamily: 'monospace', color: '#c0c0c0', fontWeight: 700, letterSpacing: '0.05em' }}>
          {cameraId}
        </span>
        <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
          {hasAlert && (
            <span style={{ fontSize: 9, color: '#cc2222', fontWeight: 800, fontFamily: 'monospace', letterSpacing: '0.06em' }}>
              ● ALERT
            </span>
          )}
          <span style={{ fontSize: 9, color: '#cc3333', fontWeight: 700, fontFamily: 'monospace' }}>
            ● REC
          </span>
        </div>
      </div>

      {/* Bottom bar: Zone + Name + PPE + Workers */}
      <div style={{
        position: 'absolute', bottom: 0, left: 0, right: 0,
        display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end',
        padding: '4px 8px',
        background: 'linear-gradient(to top, rgba(0,0,0,0.85), transparent)',
        pointerEvents: 'none',
      }}>
        <div>
          <div style={{ fontSize: 9, color: '#707080', fontFamily: 'monospace', lineHeight: 1 }}>{zone}</div>
          <div style={{ fontSize: 10, color: '#c0c0c0', fontFamily: 'monospace', fontWeight: 600, lineHeight: 1.3 }}>
            {name.includes('—') ? name.split('—')[1].trim() : name}
          </div>
          {hasAlert && alertText && (
            <div style={{ fontSize: 9, color: '#cc2222', fontFamily: 'monospace', fontWeight: 700, marginTop: 1 }}>
              ⚠ {alertText}
            </div>
          )}
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: 10, fontWeight: 700, fontFamily: 'monospace', color: ppeColor, lineHeight: 1 }}>
            PPE {ppePct}%
          </div>
          <div style={{ fontSize: 9, color: '#707080', fontFamily: 'monospace', lineHeight: 1.3, display: 'flex', alignItems: 'center', gap: 3, justifyContent: 'flex-end' }}>
            <Users size={8} />
            {workerCount}
          </div>
        </div>
      </div>
    </div>
  );
}
