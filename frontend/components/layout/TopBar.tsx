"use client";
import React from "react";
import { ThemeToggle } from "./ThemeToggle";

export function TopBar() {
  return (
    <header className="topbar">
      <div className="left">
        <div style={{fontWeight:700}}>SafetyOS</div>
      </div>
      <div className="right">
        <ThemeToggle />
      </div>
    </header>
  );
}
