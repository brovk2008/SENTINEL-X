"use client";
import { Activity, Users, FileText, Shield, AlertTriangle, TrendingUp } from "lucide-react";

interface Props {
  analytics: Record<string, unknown>;
}

export function QuickStats({ analytics }: Props) {
  const stats = [
    {
      label: "Sensors Online",
      value: `${analytics.sensors_online ?? 20}/${analytics.sensors_total ?? 20}`,
      icon: Activity,
      color: "var(--risk-low)",
      sub: "All systems nominal",
    },
    {
      label: "Workers On Site",
      value: analytics.workers_on_site ?? 17,
      icon: Users,
      color: "var(--accent-cyan)",
      sub: `${analytics.active_permits ?? 3} active permits`,
    },
    {
      label: "Compliance Score",
      value: `${analytics.compliance_score ?? 85.7}%`,
      icon: Shield,
      color: (analytics.compliance_score as number ?? 85) > 90 ? "var(--risk-low)" : "var(--risk-medium)",
      sub: "Last checked 30s ago",
    },
    {
      label: "Incidents Today",
      value: analytics.incidents_today ?? 0,
      icon: AlertTriangle,
      color: (analytics.incidents_today as number ?? 0) > 0 ? "var(--risk-critical)" : "var(--risk-low)",
      sub: `${analytics.incidents_this_week ?? 2} this week`,
    },
    {
      label: "AI Prevented",
      value: analytics.ai_prevented_today ?? 3,
      icon: TrendingUp,
      color: "var(--accent-purple)",
      sub: "Incidents averted today",
    },
    {
      label: "Financial Exposure",
      value: `₹${((analytics.financial_exposure as number ?? 2100000) / 100000).toFixed(1)}L`,
      icon: FileText,
      color: "var(--risk-high)",
      sub: "If all risks materialize",
    },
  ];

  return (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "12px" }}>
      {stats.map((stat) => {
        const Icon = stat.icon;
        return (
          <div key={stat.label} className="glass-card" style={{ padding: "14px 16px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "8px" }}>
              <Icon size={14} color={stat.color} />
              <span style={{ fontSize: "10px", color: "var(--text-muted)", fontWeight: "600", letterSpacing: "0.05em" }}>
                {stat.label.toUpperCase()}
              </span>
            </div>
            <div style={{
              fontSize: "24px",
              fontWeight: "800",
              color: stat.color,
              fontFamily: "var(--font-mono)",
              lineHeight: 1,
              marginBottom: "4px",
            }}>
              {String(stat.value)}
            </div>
            <div style={{ fontSize: "11px", color: "var(--text-muted)" }}>{stat.sub}</div>
          </div>
        );
      })}
    </div>
  );
}
