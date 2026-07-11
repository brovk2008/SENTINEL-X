"use client";
import React, { useEffect } from "react";
import { useStore } from "../../lib/store";

export function WSProvider({ children }: { children: React.ReactNode }) {
  const updateSensor = useStore((s) => s.updateSensor);
  const addAlert = useStore((s) => s.addAlert);

  useEffect(() => {
    const url = process.env.NEXT_PUBLIC_WS_URL;
    let ws: WebSocket | null = null;
    let demoTimer: any = null;

    if (url) {
      try {
        ws = new WebSocket(url);
        ws.onmessage = (ev) => {
          try {
            const d = JSON.parse(ev.data);
            if (d.type === "sensor") updateSensor(d.id, { name: d.name, value: d.value, timestamp: d.timestamp });
            if (d.type === "alert") addAlert({ id: d.id, title: d.title, severity: d.severity || 'MEDIUM', timestamp: d.timestamp });
          } catch (e) {
            // ignore
          }
        };
      } catch (e) {
        ws = null;
      }
    }

    // Demo fallback if no real WS
    if (!ws) {
      const sensors = [
        { id: "boiler-3", name: "Boiler 3 Temp", value: "78°C" },
        { id: "h2s-a", name: "H2S Sensor - Bay A", value: "0.4 ppm" },
        { id: "press-7", name: "Pressure - Line 7", value: "3.2 bar" },
      ];
      // seed
      sensors.forEach((s, i) => updateSensor(s.id, { name: s.name, value: s.value, timestamp: new Date().toISOString() }));
      demoTimer = setInterval(() => {
        // random update
        const idx = Math.floor(Math.random() * sensors.length);
        const s = sensors[idx];
        const nextValue = Math.floor(Math.random() * 100);
        updateSensor(s.id, { value: `${nextValue}${s.id.includes('Temp') || s.name.includes('Temp') ? '°C' : s.id.includes('press') ? ' bar' : (s.id.includes('h2s') ? ' ppm' : '')}`, timestamp: new Date().toISOString() });
        // occasionally emit an alert
        if (Math.random() > 0.93) {
          addAlert({ id: `a-${Date.now()}`, title: `${s.name} threshold exceeded`, severity: 'HIGH', timestamp: new Date().toISOString() });
        }
      }, 3500);
    }

    return () => {
      if (ws) ws.close();
      if (demoTimer) clearInterval(demoTimer);
    };
  }, [updateSensor, addAlert]);

  return <>{children}</>;
}
