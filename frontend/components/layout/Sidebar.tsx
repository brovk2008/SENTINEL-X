"use client";
import React from "react";

import { HomeIcon } from "../icons/HomeIcon";
import { StatsIcon } from "../icons/StatsIcon";
import { AlertIcon } from "../icons/AlertIcon";

export function Sidebar() {
  return (
    <aside className="sidebar" aria-label="Main navigation">
      <nav>
        <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 12 }}>
          <li><a href="/dashboard" title="Dashboard"><HomeIcon /></a></li>
          <li><a href="/dashboard" title="Stats"><StatsIcon /></a></li>
          <li><a href="/dashboard" title="Alerts"><AlertIcon /></a></li>
        </ul>
      </nav>
    </aside>
  );
}
