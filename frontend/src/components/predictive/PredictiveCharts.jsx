import React, { memo, useState } from "react";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from "recharts";

const data = [
  { date: "Jul 25", critical: 1, high: 3, medium: 4, previous: 2, pctChange: "+50%", trend: "UP", confidence: "94%" },
  { date: "Jul 26", critical: 2, high: 4, medium: 3, previous: 3, pctChange: "+33%", trend: "UP", confidence: "96%" },
  { date: "Jul 27", critical: 1, high: 2, medium: 5, previous: 3, pctChange: "-33%", trend: "DOWN", confidence: "98%" },
  { date: "Jul 28", critical: 3, high: 5, medium: 2, previous: 2, pctChange: "+150%", trend: "UP", confidence: "95%" },
  { date: "Jul 29", critical: 2, high: 3, medium: 4, previous: 4, pctChange: "-25%", trend: "DOWN", confidence: "97%" },
  { date: "Jul 30", critical: 4, high: 6, medium: 3, previous: 3, pctChange: "+66%", trend: "UP", confidence: "92%" },
  { date: "Jul 31", critical: 2, high: 4, medium: 2, previous: 4, pctChange: "-50%", trend: "DOWN", confidence: "99%" },
];

// Custom Hover Tooltip
const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    const item = payload[0].payload;
    return (
      <div className="chart-hover-popover" style={{ background: "#FFFFFF", border: "1px solid #E5E7EB", padding: "10px", borderRadius: "8px", boxShadow: "0 4px 12px rgba(0,0,0,0.1)", fontSize: "12px" }}>
        <strong style={{ color: "#111827" }}>{label} Telemetry Brief</strong>
        <div style={{ color: "#DC2626", marginTop: "4px" }}>Critical Incidents: {item.critical}</div>
        <div style={{ color: "#F59E0B" }}>High Priority: {item.high}</div>
        <div style={{ color: "#2563EB" }}>Medium Level: {item.medium}</div>
        <div style={{ borderTop: "1px solid #E5E7EB", marginTop: "6px", paddingTop: "4px", color: "#6B7280" }}>
          Prev Day: {item.previous} ({item.pctChange} {item.trend}) | Conf: {item.confidence}
        </div>
      </div>
    );
  }
  return null;
};

const PredictiveCharts = memo(function PredictiveCharts() {
  const [chartType, setChartType] = useState("all");

  const exportCSV = () => {
    const headers = "Date,Critical,High,Medium,Previous,PctChange,Trend,Confidence\n";
    const rows = data.map((d) => `${d.date},${d.critical},${d.high},${d.medium},${d.previous},${d.pctChange},${d.trend},${d.confidence}`).join("\n");
    const blob = new Blob([headers + rows], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "predictive_telemetry_export.csv";
    a.click();
  };

  return (
    <div className="section-card trend-chart-card">
      <div className="section-card-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div>
          <h2 className="section-title">AI Incident & KPI Telemetry Forecast</h2>
          <span className="caption-text">Interactive Recharts Multi-Series Trend Line</span>
        </div>
        <div style={{ display: "flex", gap: "8px" }}>
          <button className="secondary-button small-btn" onClick={exportCSV}>
            Export CSV
          </button>
        </div>
      </div>

      <div style={{ width: "100%", height: 260, marginTop: "12px" }}>
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id="colorCritical" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#DC2626" stopOpacity={0.4} />
                <stop offset="95%" stopColor="#DC2626" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="colorHigh" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#F59E0B" stopOpacity={0.4} />
                <stop offset="95%" stopColor="#F59E0B" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="colorMedium" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#2563EB" stopOpacity={0.4} />
                <stop offset="95%" stopColor="#2563EB" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
            <XAxis dataKey="date" stroke="#6B7280" fontSize={11} />
            <YAxis stroke="#6B7280" fontSize={11} />
            <Tooltip content={<CustomTooltip />} />
            <Legend wrapperStyle={{ fontSize: "11px", paddingTop: "6px" }} />
            <Area type="monotone" dataKey="critical" stroke="#DC2626" fillOpacity={1} fill="url(#colorCritical)" name="Critical" />
            <Area type="monotone" dataKey="high" stroke="#F59E0B" fillOpacity={1} fill="url(#colorHigh)" name="High" />
            <Area type="monotone" dataKey="medium" stroke="#2563EB" fillOpacity={1} fill="url(#colorMedium)" name="Medium" />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
});

export default PredictiveCharts;
