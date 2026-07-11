"use client";
import React from "react";

import { useStore } from "@/lib/store";

export function SensorTicker() {
  const sensors = useStore((s) => s.sensors);
  const items = Object.values(sensors);
  if (items.length === 0) {
    const demo = [
      { id: 1, name: "Boiler 3 Temp", value: "—" },
      { id: 2, name: "H2S Sensor - Bay A", value: "—" },
    ];
    const track = [...demo, ...demo];
    return (
      <div className="sensor-ticker" role="region" aria-label="Sensor ticker">
        <div className="ticker-track">
          {track.map((it, idx) => (
            <div className="ticker-item" key={`${it.id}-${idx}`}>
              <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{it.name}</div>
              <div style={{ fontSize: 13, fontWeight: 700 }}>{it.value}</div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  const track = [...items, ...items];

  return (
    <div className="sensor-ticker" role="region" aria-label="Sensor ticker">
      <div className="ticker-track">
        {track.map((it: any, idx: number) => (
          <div className="ticker-item" key={`${it.id}-${idx}`}>
            <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{it.name}</div>
            <div style={{ fontSize: 13, fontWeight: 700 }}>{it.value}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
