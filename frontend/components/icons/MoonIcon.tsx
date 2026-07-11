import React from 'react';
export function MoonIcon({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M21 12.8A9 9 0 1111.2 3 7 7 0 0021 12.8z" fill="#B3C7FF" />
    </svg>
  );
}
