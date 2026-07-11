"use client";
import React from "react";

export function SensorTicker() {
  const items = [
    { id: 1, name: "Boiler 3 Temp", value: "78°C" },
    { id: 2, name: "H2S Sensor - Bay A", value: "0.4 ppm" },
    { id: 3, name: "Pressure - Line 7", value: "3.2 bar" },
    { id: 4, name: "Vibration - Motor 2", value: "OK" },
  ];

  // Duplicate items for smooth scroll loop
  const track = [...items, ...items];

  return (
    <div className="sensor-ticker" aria-hidden={false} role="region" aria-label="Sensor ticker">
      <div className="ticker-track">
        {track.map((it, idx) => (
          <div className="ticker-item" key={`${it.id}-${idx}`}>
            <div style={{fontSize:11,color:'var(--text-muted)'}}>{it.name}</div>
            <div style={{fontSize:13,fontWeight:700}}>{it.value}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
