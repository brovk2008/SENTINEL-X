import React from 'react';
export function StatsIcon({ size = 18 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="3" y="10" width="3" height="11" rx="1" fill="#4a80ff" />
      <rect x="9" y="6" width="3" height="15" rx="1" fill="#00d4ff" />
      <rect x="15" y="3" width="3" height="18" rx="1" fill="#aa55ff" />
    </svg>
  );
}
