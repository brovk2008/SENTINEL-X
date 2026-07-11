"use client";
import React from "react";

export function HistoryChart({ values = [] }: { values?: number[] }) {
  if (!values || values.length === 0) return <div style={{ color: 'var(--text-muted)' }}>No data</div>;
  const w = 300; const h = 60; const max = Math.max(...values); const min = Math.min(...values);
  const points = values.map((v, i) => {
    const x = (i / (values.length - 1)) * w;
    const y = h - ((v - min) / (max - min || 1)) * h;
    return `${x},${y}`;
  }).join(' ');
  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} role="img" aria-label="Historical chart">
      <polyline fill="none" stroke="var(--accent-2)" strokeWidth={2} points={points} strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
