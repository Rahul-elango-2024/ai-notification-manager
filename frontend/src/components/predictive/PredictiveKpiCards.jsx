import React from "react";
import { Activity, AlertTriangle, AlertOctagon, TrendingUp, ShieldAlert } from "lucide-react";
import "./PredictiveKpiCards.css";

export default function PredictiveKpiCards({ overview }) {
  const kpis = [
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
        <div key={idx} className={`metric-card predictive-kpi-card ${kpi.status}`}>
          <div className="metric-card-top">
            <div className={`metric-icon ${kpi.status === "critical" ? "red" : kpi.status === "warning" ? "blue" : "green"}`}>
              {kpi.icon}
            </div>
            <span className="metric-label">{kpi.title}</span>
          </div>
          <strong className="metric-value">
            {kpi.value} <span className="predictive-kpi-unit">{kpi.unit}</span>
          </strong>
          <span className="metric-description">
            Forecasted from live telemetry
          </span>
          <div className="predictive-kpi-track" aria-hidden="true">
            <span className={`predictive-kpi-fill ${kpi.status}`} />
          </div>
        </div>
      ))}
    </div>
  );
}
