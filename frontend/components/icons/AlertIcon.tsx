import React from 'react';
export function AlertIcon({ size = 18 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M12 2L2 20h20L12 2z" fill="#ff2244" />
      <path d="M12 9v4" stroke="#fff" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="12" cy="17" r="1" fill="#fff" />
    </svg>
  );
}
