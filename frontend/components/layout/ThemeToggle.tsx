"use client";

import { Moon, Sun } from "lucide-react";
import { useEffect, useState } from "react";

type ThemeMode = "dark" | "light";

export function ThemeToggle() {
  const [theme, setTheme] = useState<ThemeMode>("dark");

  useEffect(() => {
    try {
      const stored = window.localStorage.getItem("safetyos-theme") as ThemeMode | null;
      const initial = stored === "light" || stored === "dark" ? stored : "dark";
      setTheme(initial);
      document.documentElement.dataset.theme = initial;
    } catch {
      // ignore
    }

    const onStorage = (e: StorageEvent) => {
      if (e.key === "safetyos-theme") {
        const val = e.newValue === "light" ? "light" : "dark";
        setTheme(val);
        document.documentElement.dataset.theme = val;
      }
    };

    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  const applyTheme = (next: ThemeMode) => {
    try {
      window.localStorage.setItem("safetyos-theme", next);
    } catch {}
    const doApply = () => (document.documentElement.dataset.theme = next);
    if ("startViewTransition" in document) document.startViewTransition(doApply);
    else doApply();
  };

  const toggleTheme = () => {
    const next: ThemeMode = theme === "dark" ? "light" : "dark";
    setTheme(next);
    applyTheme(next);
  };

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      toggleTheme();
    }
  };

  return (
    <button
      type="button"
      className="theme-toggle"
      onClick={toggleTheme}
      onKeyDown={onKeyDown}
      aria-pressed={theme === "dark" ? "false" : "true"}
      aria-label="Toggle color theme"
      title="Toggle color theme"
    >
      <span className="theme-toggle__track" role="presentation">
        <span className="theme-toggle__thumb" aria-hidden>
          {theme === "dark" ? <Moon size={15} /> : <Sun size={15} />}
        </span>
      </span>
    </button>
  );
}
