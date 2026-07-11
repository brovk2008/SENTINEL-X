"use client";
import React from "react";
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Tooltip,
  Filler,
} from 'chart.js';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Tooltip, Filler);

export function HistoryChart({ values = [] }: { values?: number[] }) {
  const data = {
    labels: values.map((_, i) => i.toString()),
    datasets: [
      {
        label: 'History',
        data: values,
        fill: true,
        backgroundColor: 'rgba(0,212,255,0.08)',
        borderColor: 'rgba(0,212,255,0.9)',
        tension: 0.3,
        pointRadius: 0,
      },
    ],
  };

  const opts = { plugins: { legend: { display: false } }, scales: { x: { display: false }, y: { display: false } } };

  return <div style={{ width: '100%', maxWidth: 320 }}><Line data={data} options={opts as any} /></div>;
}
