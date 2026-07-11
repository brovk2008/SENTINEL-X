"use client";
import React from "react";
import dynamic from "next/dynamic";

const ReactPlayer = dynamic(() => import('react-player'), { ssr: false });

export function CameraMap() {
  const stream = process.env.NEXT_PUBLIC_CAMERA_URL || "";
  return (
    <div className="glass-card" style={{ minHeight: 220 }}>
      {stream ? (
        <div style={{ position: 'relative', paddingTop: '56.25%' }}>
          <div style={{ position: 'absolute', inset: 0 }}>
            <ReactPlayer {...({ url: stream, width: '100%', height: '100%', controls: true, playing: false } as any)} />
          </div>
        </div>
      ) : (
        <div style={{ minHeight: 220, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column' }}>
          <div style={{ fontWeight: 700, marginBottom: 6 }}>Camera Streams</div>
          <div style={{ color: 'var(--text-muted)' }}>No camera feed configured. Set NEXT_PUBLIC_CAMERA_URL to preview a stream.</div>
        </div>
      )}
    </div>
  );
}
