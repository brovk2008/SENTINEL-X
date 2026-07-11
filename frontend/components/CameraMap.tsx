"use client";
import React from "react";

export function CameraMap() {
  return (
    <div className="glass-card" style={{ minHeight: 220, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontWeight: 700, marginBottom: 6 }}>Camera Streams</div>
        <div style={{ color: 'var(--text-muted)' }}>Placeholder for camera grid / plant map. Connect real streams or map here.</div>
      </div>
    </div>
  );
}
