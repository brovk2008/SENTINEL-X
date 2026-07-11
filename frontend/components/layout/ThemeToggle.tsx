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
    <button aria-pressed={theme === 'dark' ? false : true} onClick={toggle} title="Toggle theme" className="theme-toggle">
      {theme === "dark" ? "🌙" : "☀️"}
    </button>
  );
}
