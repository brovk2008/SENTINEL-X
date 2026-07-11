"use client";
import { useEffect, useRef } from "react";

interface Props {
  score: number;
  size?: number;
}

export function RiskGauge({ score, size = 160 }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const getColor = (s: number) => {
    if (s >= 75) return "#dc2626";
    if (s >= 50) return "#d97706";
    if (s >= 30) return "#eab308";
    return "#16a34a";
  };

  const getLabel = (s: number) => {
    if (s >= 75) return "CRITICAL";
    if (s >= 50) return "ELEVATED";
    if (s >= 30) return "MODERATE";
    return "NORMAL";
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    canvas.width = size * dpr;
    canvas.height = size * dpr;
    canvas.style.width = `${size}px`;
    canvas.style.height = `${size}px`;
    ctx.scale(dpr, dpr);
    ctx.clearRect(0, 0, size, size);

    const cx = size / 2;
    const cy = size / 2 + 10;
    const r = (size / 2) * 0.8;
    const startAngle = Math.PI * 0.75;
    const endAngle = Math.PI * 2.25;
    const totalAngle = endAngle - startAngle;

    const styles = getComputedStyle(document.documentElement);
    const isDark = document.documentElement.dataset.theme === "dark";
    const trackColor = isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.06)";
    const tickColor = isDark ? "rgba(255,255,255,0.12)" : "rgba(0,0,0,0.12)";
    const labelColor = styles.getPropertyValue("--text-muted").trim() || "#a1a1aa";

    ctx.beginPath();
    ctx.arc(cx, cy, r, startAngle, endAngle);
    ctx.strokeStyle = trackColor;
    ctx.lineWidth = 12;
    ctx.lineCap = "round";
    ctx.stroke();

    if (score > 0) {
      const gradient = ctx.createLinearGradient(0, 0, size, 0);
      gradient.addColorStop(0, "#16a34a");
      gradient.addColorStop(0.5, "#eab308");
      gradient.addColorStop(0.75, "#d97706");
      gradient.addColorStop(1, "#dc2626");

      const fillEnd = startAngle + (score / 100) * totalAngle;
      ctx.beginPath();
      ctx.arc(cx, cy, r, startAngle, fillEnd);
      ctx.strokeStyle = gradient;
      ctx.lineWidth = 12;
      ctx.lineCap = "round";
      ctx.stroke();
    }

    for (let i = 0; i <= 10; i++) {
      const angle = startAngle + (i / 10) * totalAngle;
      const inner = r - 18;
      const outer = r - 10;
      ctx.beginPath();
      ctx.moveTo(cx + Math.cos(angle) * inner, cy + Math.sin(angle) * inner);
      ctx.lineTo(cx + Math.cos(angle) * outer, cy + Math.sin(angle) * outer);
      ctx.strokeStyle = tickColor;
      ctx.lineWidth = i % 5 === 0 ? 1.5 : 1;
      ctx.stroke();
    }

    ctx.fillStyle = getColor(score);
    ctx.font = `bold ${size * 0.22}px 'JetBrains Mono', monospace`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(score.toFixed(0), cx, cy - 8);

    ctx.fillStyle = labelColor;
    ctx.font = `600 ${size * 0.07}px Inter, sans-serif`;
    ctx.fillText(getLabel(score), cx, cy + size * 0.14);
  }, [score, size]);

  return <canvas ref={canvasRef} style={{ display: "block" }} />;
}
