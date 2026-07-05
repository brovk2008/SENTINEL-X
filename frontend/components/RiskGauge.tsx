"use client";
import { useEffect, useRef } from "react";

interface Props {
  score: number;
  size?: number;
}

export function RiskGauge({ score, size = 160 }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const getColor = (s: number) => {
    if (s >= 75) return "#ff2244";
    if (s >= 50) return "#ff8800";
    if (s >= 30) return "#ffcc00";
    return "#00e676";
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

    const w = size;
    const h = size;
    const cx = w / 2;
    const cy = h / 2 + 10;
    const r = (size / 2) * 0.8;
    const dpr = window.devicePixelRatio || 1;

    canvas.width = w * dpr;
    canvas.height = h * dpr;
    canvas.style.width = `${w}px`;
    canvas.style.height = `${h}px`;
    ctx.scale(dpr, dpr);

    ctx.clearRect(0, 0, w, h);

    const startAngle = Math.PI * 0.75;
    const endAngle = Math.PI * 2.25;
    const totalAngle = endAngle - startAngle;

    // Track background
    ctx.beginPath();
    ctx.arc(cx, cy, r, startAngle, endAngle);
    ctx.strokeStyle = "rgba(255,255,255,0.06)";
    ctx.lineWidth = 14;
    ctx.lineCap = "round";
    ctx.stroke();

    // Color gradient track
    if (score > 0) {
      const gradient = ctx.createLinearGradient(0, 0, w, 0);
      gradient.addColorStop(0, "#00e676");
      gradient.addColorStop(0.5, "#ffcc00");
      gradient.addColorStop(0.75, "#ff8800");
      gradient.addColorStop(1, "#ff2244");

      const fillEnd = startAngle + (score / 100) * totalAngle;
      ctx.beginPath();
      ctx.arc(cx, cy, r, startAngle, fillEnd);
      ctx.strokeStyle = gradient;
      ctx.lineWidth = 14;
      ctx.lineCap = "round";
      ctx.stroke();

      // Glow effect on needle tip
      const needleX = cx + Math.cos(fillEnd) * r;
      const needleY = cy + Math.sin(fillEnd) * r;
      const color = getColor(score);
      const glowGrad = ctx.createRadialGradient(needleX, needleY, 0, needleX, needleY, 20);
      glowGrad.addColorStop(0, color + "80");
      glowGrad.addColorStop(1, "transparent");
      ctx.beginPath();
      ctx.arc(needleX, needleY, 20, 0, Math.PI * 2);
      ctx.fillStyle = glowGrad;
      ctx.fill();
    }

    // Tick marks
    for (let i = 0; i <= 10; i++) {
      const angle = startAngle + (i / 10) * totalAngle;
      const inner = r - 20;
      const outer = r - 10;
      ctx.beginPath();
      ctx.moveTo(cx + Math.cos(angle) * inner, cy + Math.sin(angle) * inner);
      ctx.lineTo(cx + Math.cos(angle) * outer, cy + Math.sin(angle) * outer);
      ctx.strokeStyle = "rgba(255,255,255,0.15)";
      ctx.lineWidth = i % 5 === 0 ? 2 : 1;
      ctx.stroke();
    }

    // Score text
    ctx.fillStyle = getColor(score);
    ctx.font = `bold ${size * 0.2}px 'JetBrains Mono', monospace`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(score.toFixed(0), cx, cy - 8);

    // Label text
    ctx.fillStyle = "rgba(255,255,255,0.4)";
    ctx.font = `600 ${size * 0.065}px Inter, sans-serif`;
    ctx.letterSpacing = "0.1em";
    ctx.fillText(getLabel(score), cx, cy + size * 0.14);

  }, [score, size]);

  return <canvas ref={canvasRef} style={{ display: "block" }} />;
}
