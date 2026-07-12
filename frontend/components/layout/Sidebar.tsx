"use client";
import React from "react";

import { HomeIcon } from "../icons/HomeIcon";
import { StatsIcon } from "../icons/StatsIcon";
import { AlertIcon } from "../icons/AlertIcon";

import { BrandMark } from "./BrandMark";

export function Sidebar() {
  return (
    <aside className="sidebar" aria-label="Main navigation">
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', paddingBottom: 8 }}>
        <BrandMark size={36} />
      </div>
      <nav>
        <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 12 }}>
          <li><a href="/dashboard" title="Dashboard" aria-label="Dashboard"><HomeIcon /></a></li>
          <li><a href="/dashboard" title="Stats" aria-label="Stats"><StatsIcon /></a></li>
          <li><a href="/dashboard" title="Alerts" aria-label="Alerts"><AlertIcon /></a></li>
        </ul>
      </nav>
    </aside>
  );
}
