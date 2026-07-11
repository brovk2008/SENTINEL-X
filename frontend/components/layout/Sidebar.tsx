"use client";
import React from "react";

export function Sidebar() {
  return (
    <aside className="sidebar" aria-label="Main navigation">
      <nav>
        <ul style={{listStyle:'none',padding:0,margin:0,display:'flex',flexDirection:'column',gap:10}}>
          <li><a href="#">🏠</a></li>
          <li><a href="#">📊</a></li>
          <li><a href="#">⚙️</a></li>
        </ul>
      </nav>
    </aside>
  );
}
