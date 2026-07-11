"use client";
import React, { useEffect, useState } from "react";

export function ThemeToggle() {
  const [theme, setTheme] = useState("dark");
  useEffect(() => {
    try {
      const t = window.localStorage.getItem("safetyos-theme");
      if (t === "light" || t === "dark") {
        setTheme(t);
        document.documentElement.dataset.theme = t;
      }
    } catch {}
  }, []);

  const toggle = () => {
    const next = theme === "dark" ? "light" : "dark";
    setTheme(next);
    try { window.localStorage.setItem("safetyos-theme", next); } catch {}
    document.documentElement.dataset.theme = next;
  };

  return (
    <button aria-pressed={theme === 'dark' ? false : true} onClick={toggle} title="Toggle theme" className="theme-toggle" aria-label="Toggle theme">
      {theme === "dark" ? <span style={{display:'inline-flex',alignItems:'center'}}><svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M21 12.8A9 9 0 1111.2 3 7 7 0 0021 12.8z" fill="#B3C7FF" /></svg></span> : <span style={{display:'inline-flex',alignItems:'center'}}><svg width="16" height="16" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="4" fill="#FFD54A" /><g stroke="#FFD54A" strokeWidth="1.4" strokeLinecap="round"><path d="M12 2v2" /><path d="M12 20v2" /><path d="M4.9 4.9l1.4 1.4" /><path d="M17.7 17.7l1.4 1.4" /><path d="M2 12h2" /><path d="M20 12h2" /><path d="M4.9 19.1l1.4-1.4" /><path d="M17.7 6.3l1.4-1.4" /></g></svg></span>}
    </button>
  );
}
