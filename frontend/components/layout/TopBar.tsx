"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ShieldCheck } from "lucide-react";
import { ThemeToggle } from "./ThemeToggle";
import { useStore } from "../../lib/store";

const TOP_NAV = [
  { href: "/", label: "Home" },
  { href: "/sensors", label: "Sensors" },
  { href: "/cameras", label: "Vision" },
  { href: "/agents", label: "Agents" },
  { href: "/reports", label: "Reports" },
  { href: "/settings", label: "Settings" },
];

export function TopBar() {
  const pathname = usePathname();
  const { wsConnected } = useStore();

  return (
    <header className="topbar">
      <div className="topbar__left">
        <div className="topbar__status" title={wsConnected ? "Live feed connected" : "Live feed reconnecting"}>
          <span className={`topbar__pulse ${wsConnected ? "" : "topbar__pulse--red"}`} />
          <span>{wsConnected ? "Live" : "Connecting"}</span>
          <span style={{ color: "var(--text-muted)", fontWeight: 400 }}>·</span>
          <strong>Bharat Petrochemicals — Unit 3, Visakhapatnam</strong>
        </div>
      </div>

      <nav className="topbar-nav" aria-label="Primary">
        <ul className="topbar-nav-list" role="menubar">
          {TOP_NAV.map((item) => {
            const active = pathname === item.href;
            return (
              <li key={item.href} role="none">
                <Link
                  role="menuitem"
                  aria-current={active ? "page" : undefined}
                  href={item.href}
                  className={`topbar-nav__link ${active ? "active" : ""}`}
                  title={item.label}
                >
                  {item.label}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      <div className="topbar__actions">
        <div className="topbar-chip">
          <ShieldCheck size={14} style={{ color: "var(--success)" }} />
          ISO 45001
        </div>
        <ThemeToggle />
      </div>
    </header>
  );
}
