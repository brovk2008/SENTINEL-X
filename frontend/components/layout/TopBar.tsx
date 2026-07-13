"use client";
import React from "react";
import { ThemeToggle } from "./ThemeToggle";

export function TopBar() {
  return (
    <header className="topbar">
      <div className="left" style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <img src="/logo.png" alt="Sentinel X Logo" style={{ width: 28, height: 28, objectFit: "contain", borderRadius: 6 }} />
        <div style={{ fontWeight: 800, fontSize: 15, letterSpacing: "-0.02em" }}>Sentinel X</div>
      </div>
      <div className="right">
        <ThemeToggle />
      </div>
    </header>
  );
}
