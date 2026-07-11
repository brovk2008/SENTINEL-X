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
        <span className="text-xs text-gray-300 font-mono">
          {demoMode ? '🟢 DEMO MODE' : '⚪ LIVE MODE'}
        </span>
      </label>
    </div>
  );
}
