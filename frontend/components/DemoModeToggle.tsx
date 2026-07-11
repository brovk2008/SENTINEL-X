'use client';

import { useStore } from '../lib/store';
import { useEffect, useState } from 'react';

export function DemoModeToggle() {
  const { demoMode, setDemoMode } = useStore();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  return (
    <div className="fixed top-4 right-4 z-50 flex items-center gap-2 px-3 py-2 
                    bg-black/40 backdrop-blur-sm border border-white/10 rounded-lg">
      <label className="flex items-center gap-2 cursor-pointer">
        <input
          type="checkbox"
          checked={demoMode}
          onChange={(e) => setDemoMode(e.target.checked)}
          className="w-4 h-4 rounded"
        />
        <span className="text-xs text-gray-300 font-mono" style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
          <span style={{ width: 10, height: 10, borderRadius: 999, display: 'inline-block', background: demoMode ? 'var(--risk-low)' : 'rgba(255,255,255,0.32)', boxShadow: demoMode ? '0 0 10px rgba(0,255,136,0.18)' : 'none' }} aria-hidden />
          <span>{demoMode ? 'DEMO MODE' : 'LIVE MODE'}</span>
        </span>
      </label>
    </div>
  );
}
