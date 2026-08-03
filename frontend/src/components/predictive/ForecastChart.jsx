import React from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ReferenceLine,
  Area,
  ComposedChart,
} from "recharts";
import "./ForecastChart.css";

export default function ForecastChart({ forecasts }) {
  if (!forecasts || forecasts.length === 0) {
    return (
      <div className="forecast-chart-container enterprise-card">
        <div className="chart-header">
          <h3 className="chart-title">System Health Forecast</h3>
        </div>
        <div className="chart-body empty-chart-state">
          No forecast data available
        </div>
      </div>
    );
  }

  // Pick the most critical forecast to visualize, or default to the first one
  const targetForecast = forecasts.find(f => f.risk_level === 'CRITICAL') 
    || forecasts.find(f => f.risk_level === 'HIGH') 
    || forecasts[0];

  // Map the nested periods into a time series
  const data = [];
  
  // Add 'Now' point
  data.push({
    time: "Now",
    historical_value: targetForecast.current_value,
    forecasted_value: targetForecast.current_value,
    lower_bound: targetForecast.current_value,
    upper_bound: targetForecast.current_value
  });

  const periodKeys = ["1h", "24h", "7d", "30d"];
  periodKeys.forEach(key => {
    if (targetForecast.periods && targetForecast.periods[key]) {
      const p = targetForecast.periods[key];
      const date = new Date(p.time);
      const label = key === '1h' ? date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) 
                  : key === '24h' ? 'Tomorrow'
                  : key === '7d' ? '+7 Days'
                  : '+30 Days';
      
      const val = p.value;
      const margin = val * 0.1; // 10% confidence margin

      data.push({
        time: label,
        historical_value: null,
        forecasted_value: val,
        lower_bound: val - margin,
        upper_bound: val + margin
      });
    }
  });

  return (
    <div className="forecast-chart-container enterprise-card">
      <div className="chart-header">
        <h3 className="chart-title">{targetForecast.kpi_name} Forecast</h3>
        <div className="chart-actions">
          <button className="chart-btn">Zoom</button>
          <button className="chart-btn">Pan</button>
        </div>
      </div>
      <div className="chart-body">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={data} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
            <XAxis dataKey="time" stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} />
            <YAxis stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} domain={['auto', 'auto']} />
            <Tooltip
              cursor={false}
              contentStyle={{ backgroundColor: "#0f172a", borderColor: "#334155", borderRadius: "6px", color: "#f8fafc" }}
              itemStyle={{ color: "#cbd5e1" }}
            />
            <Legend wrapperStyle={{ fontSize: "12px", color: "#94a3b8" }} iconType="circle" />
            
            {/* Confidence Band */}
            <Area type="monotone" dataKey="upper_bound" stroke="none" fill="#3b82f6" fillOpacity={0.1} />
            <Area type="monotone" dataKey="lower_bound" stroke="none" fill="#0f172a" fillOpacity={1} />
            
            {/* Warning / Critical Thresholds */}
            <ReferenceLine y={targetForecast.warning_threshold} stroke="#f59e0b" strokeDasharray="3 3" label={{ position: 'insideTopLeft', value: 'Warning', fill: '#f59e0b', fontSize: 10 }} />
            <ReferenceLine y={targetForecast.critical_threshold} stroke="#ef4444" strokeDasharray="3 3" label={{ position: 'insideTopLeft', value: 'Critical', fill: '#ef4444', fontSize: 10 }} />
            
            {/* Target Line */}
            <ReferenceLine y={targetForecast.target_value} stroke="#10b981" strokeDasharray="3 3" label={{ position: 'insideTopLeft', value: 'Target', fill: '#10b981', fontSize: 10 }} />

            {/* Historical Line */}
            <Line type="monotone" dataKey="historical_value" name="Historical" stroke="#94a3b8" strokeWidth={2} dot={false} activeDot={{ r: 4 }} />
            
            {/* Forecast Line */}
            <Line type="monotone" dataKey="forecasted_value" name="Forecast" stroke="#3b82f6" strokeWidth={2} strokeDasharray="5 5" dot={false} activeDot={{ r: 4 }} />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
