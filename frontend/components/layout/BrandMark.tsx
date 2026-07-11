"use client";

import React from "react";

export function BrandMark({ size = 42 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 64 64"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden
    >
      <defs>
        <linearGradient id="g1" x1="0" x2="1" y1="0" y2="1">
          <stop offset="0%" stopColor="#5a8dee" />
          <stop offset="100%" stopColor="#a955ff" />
        </linearGradient>
        <filter id="f1" x="-20%" y="-20%" width="140%" height="140%" colorInterpolationFilters="sRGB">
          <feDropShadow dx="0" dy="8" stdDeviation="14" floodOpacity="0.18" floodColor="#000" />
        </filter>
      </defs>

      <g filter="url(#f1)">
        <rect x="4" y="4" width="56" height="56" rx="14" fill="url(#g1)" />
        <path d="M20 36c2-6 8-10 14-10s12 4 14 10" stroke="rgba(255,255,255,0.95)" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
        <circle cx="32" cy="22" r="4" fill="rgba(255,255,255,0.95)" />
      </g>
    </svg>
  );
}
