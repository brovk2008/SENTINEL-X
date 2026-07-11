"use client";
import type { CSSProperties } from "react";
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
      gradient: "linear-gradient(135deg, #25a6f1, #54b9ff)",
      sub: "All systems nominal",
    },
    {
      label: "Workers On Site",
      value: analytics.workers_on_site ?? 17,
      icon: Users,
      color: "var(--accent-cyan)",
      gradient: "linear-gradient(135deg, #5A8DEE, #00CFDD)",
      sub: `${analytics.active_permits ?? 3} active permits`,
    },
    {
      label: "Compliance Score",
      value: `${analytics.compliance_score ?? 85.7}%`,
      icon: Shield,
      color: (analytics.compliance_score as number ?? 85) > 90 ? "var(--risk-low)" : "var(--risk-medium)",
      gradient: "linear-gradient(135deg, #39DA8A, #80FF72)",
      sub: "Last checked 30s ago",
    },
    {
      label: "Incidents Today",
      value: analytics.incidents_today ?? 0,
      icon: AlertTriangle,
      color: (analytics.incidents_today as number ?? 0) > 0 ? "var(--risk-critical)" : "var(--risk-low)",
      gradient: "linear-gradient(135deg, #FF5B5C, #FDAC41)",
      sub: `${analytics.incidents_this_week ?? 2} this week`,
    },
    {
      label: "AI Prevented",
      value: analytics.ai_prevented_today ?? 3,
      icon: TrendingUp,
      color: "var(--accent-purple)",
      gradient: "linear-gradient(135deg, #a955ff, #ea51ff)",
      sub: "Incidents averted today",
    },
    {
      label: "Financial Exposure",
      value: `₹${((analytics.financial_exposure as number ?? 2100000) / 100000).toFixed(1)}L`,
      icon: FileText,
      color: "var(--risk-high)",
      gradient: "linear-gradient(135deg, #FF9966, #FF5E62)",
      sub: "If all risks materialize",
    },
  ];

  return (
    <div className="stat-grid">
      {stats.map((stat) => {
        const Icon = stat.icon;
        return (
          <div key={stat.label} className="glass-card stat-card" style={{ "--stat-gradient": stat.gradient } as CSSProperties}>
            <div className="stat-head">
              <Icon size={14} color={stat.color} />
              <span className="stat-label">{stat.label.toUpperCase()}</span>
            </div>
            <div className="stat-value" style={{ color: stat.color }}>{String(stat.value)}</div>
            <div className="stat-sub">{stat.sub}</div>
          </div>
        );
      })}
    </div>
  );
}
