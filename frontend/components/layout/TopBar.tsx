"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Bell, CircleDot, Search, ShieldCheck } from "lucide-react";
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
  const { wsConnected, notificationUnreadCount, setNotificationPanelOpen } = useStore();

  return (
    <header className="topbar">
      <div className="topbar__status" title={wsConnected ? "Live feed connected" : "Live feed reconnecting"}>
        <span className={`topbar__pulse ${wsConnected ? "" : "topbar__pulse--red"}`} />
        <div>
          <span>SafetyOS Command</span>
          <strong>{wsConnected ? "Live Operations" : "Reconnecting"}</strong>
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
        <div className="topbar-search">
          <Search size={15} />
          <span>Search telemetry</span>
        </div>
        <div className="topbar-chip">
          <ShieldCheck size={15} />
          ISO 45001
        </div>
        <button
          type="button"
          className="topbar-icon-button"
          onClick={() => setNotificationPanelOpen(true)}
          aria-label="Open notifications"
          title="Open notifications"
        >
          <Bell size={17} />
          {notificationUnreadCount > 0 && <span>{notificationUnreadCount > 9 ? "9+" : notificationUnreadCount}</span>}
        </button>
        <div className="topbar-chip topbar-chip--compact">
          <CircleDot size={14} />
          IAD
        </div>
        <ThemeToggle />
      </div>
    </header>
  );
}
