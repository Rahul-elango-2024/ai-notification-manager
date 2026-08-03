import React from "react";
import { Activity, AlertTriangle, AlertOctagon, TrendingUp, ShieldAlert } from "lucide-react";
import "./PredictiveKpiCards.css";

export default function PredictiveKpiCards({ overview }) {
    {
      title: "Risk Score",
      value: overview?.overallRiskScore || 0,
      unit: "/ 100",
      status: overview?.overallRiskLevel === "CRITICAL" ? "critical" : overview?.overallRiskLevel === "HIGH" ? "warning" : "normal",
      icon: <Activity size={20} />,
    },
    {
      title: "Predicted Criticals",
      value: overview?.predictedCriticalAlerts || 0,
      unit: "alerts",
      status: overview?.predictedCriticalAlerts > 0 ? "critical" : "normal",
      icon: <AlertOctagon size={20} />,
    },
    {
      title: "Predicted Warnings",
      value: overview?.predictedWarningAlerts || 0,
      unit: "alerts",
      status: overview?.predictedWarningAlerts > 0 ? "warning" : "normal",
      icon: <AlertTriangle size={20} />,
    },
    {
      title: "Predicted Anomalies",
      value: overview?.predictedAnomaliesCount || 0,
      unit: "events",
      status: overview?.predictedAnomaliesCount > 0 ? "critical" : "normal",
      icon: <ShieldAlert size={20} />,
    },
    {
      title: "Monitored KPIs",
      value: overview?.totalKpisMonitored || 0,
      unit: "total",
      status: "normal",
      icon: <TrendingUp size={20} />,
    }
  ];

  return (
    <div className="predictive-kpi-grid">
      {kpis.map((kpi, idx) => (
        <div key={idx} className={`kpi-card kpi-card-${kpi.status}`}>
          <div className="kpi-header">
            <span className="kpi-title">{kpi.title}</span>
            <span className="kpi-icon">{kpi.icon}</span>
          </div>
          <div className="kpi-value-container">
            <span className="kpi-value">{kpi.value}</span>
            <span className="kpi-unit">{kpi.unit}</span>
          </div>
        </div>
      ))}
    </div>
  );
}
