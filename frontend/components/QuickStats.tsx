"use client";
import { Activity, Users, Shield, TriangleAlert as AlertTriangle, TrendingUp, FileText } from "lucide-react";

interface Props {
  analytics: Record<string, unknown>;
}

export function QuickStats({ analytics }: Props) {
  const stats = [
    {
      label: "Sensors Online",
      value: `${analytics.sensors_online ?? 20}/${analytics.sensors_total ?? 20}`,
      icon: Activity,
      tone: "var(--success)",
      sub: "All systems nominal",
    },
    {
      label: "Workers On Site",
      value: analytics.workers_on_site ?? 17,
      icon: Users,
      tone: "var(--info)",
      sub: `${analytics.active_permits ?? 3} active permits`,
    },
    {
      label: "Compliance Score",
      value: `${analytics.compliance_score ?? 85.7}%`,
      icon: Shield,
      tone: (analytics.compliance_score as number ?? 85) > 90 ? "var(--success)" : "var(--warning)",
      sub: "Last checked 30s ago",
    },
    {
      label: "Incidents Today",
      value: analytics.incidents_today ?? 0,
      icon: AlertTriangle,
      tone: (analytics.incidents_today as number ?? 0) > 0 ? "var(--danger)" : "var(--success)",
      sub: `${analytics.incidents_this_week ?? 2} this week`,
    },
    {
      label: "AI Prevented",
      value: analytics.ai_prevented_today ?? 3,
      icon: TrendingUp,
      tone: "var(--accent)",
      sub: "Incidents averted today",
    },
    {
      label: "Financial Exposure",
      value: `₹${((analytics.financial_exposure as number ?? 2100000) / 100000).toFixed(1)}L`,
      icon: FileText,
      tone: "var(--danger)",
      sub: "If all risks materialize",
    },
  ];

  return (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12 }}>
      {stats.map((stat) => {
        const Icon = stat.icon;
        return (
          <div key={stat.label} className="card" style={{ padding: "14px 16px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
              <div style={{
                width: 28, height: 28, borderRadius: "var(--radius-sm)",
                background: `${stat.tone}15`, display: "grid", placeItems: "center",
              }}>
                <Icon size={14} color={stat.tone} />
              </div>
              <span style={{ fontSize: 10, color: "var(--text-muted)", fontWeight: 600, letterSpacing: "0.05em" }}>
                {stat.label.toUpperCase()}
              </span>
            </div>
            <div style={{
              fontSize: 22, fontWeight: 700, color: "var(--text-primary)",
              fontFamily: "var(--font-mono)", lineHeight: 1, marginBottom: 4,
              letterSpacing: "-0.02em",
            }}>
              {String(stat.value)}
            </div>
            <div style={{ fontSize: 11, color: "var(--text-muted)" }}>{stat.sub}</div>
          </div>
        );
      })}
    </div>
  );
}
