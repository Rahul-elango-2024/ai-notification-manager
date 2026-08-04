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

function ForecastTooltip({ active, payload, label }) {
  if (!active || !payload?.length) {
    return null;
  }

  const item = payload[0].payload;

  return (
    <div className="predictive-chart-tooltip">
      <strong>{label}</strong>
      <span className="tooltip-line danger">Critical: {item.historical_value}</span>
      <span className="tooltip-line warning">Forecast: {item.forecasted_value}</span>
      <span className="tooltip-line muted">
        Range: {Math.round(item.lower_bound)} - {Math.round(item.upper_bound)}
      </span>
    </div>
  );
}

function ForecastLegend() {
  return (
    <div className="predictive-chart-legend">
      <span><i className="legend-swatch history" />Historical</span>
      <span><i className="legend-swatch forecast" />Forecast</span>
      <span><i className="legend-swatch target" />Target</span>
    </div>
  );
}

export default function ForecastChart({ forecasts }) {
  if (!forecasts || forecasts.length === 0) {
    return (
      <div className="forecast-chart-container panel">
        <div className="panel-header">
          <div>
            <h2>System Health Forecast</h2>
            <p>Projected KPI trajectory and control thresholds.</p>
          </div>
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
    <div className="forecast-chart-container panel">
      <div className="panel-header">
        <div>
          <h2>{targetForecast.kpi_name} Forecast</h2>
          <p>Automatically switches grid and labels for the active theme.</p>
        </div>
      </div>
      <div className="chart-body">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={data} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
            <CartesianGrid stroke="var(--border)" strokeDasharray="3 3" vertical={false} />
            <XAxis dataKey="time" stroke="var(--text-muted)" fontSize={12} tickLine={false} axisLine={false} />
            <YAxis stroke="var(--text-muted)" fontSize={12} tickLine={false} axisLine={false} domain={["auto", "auto"]} />
            <Tooltip cursor={false} content={<ForecastTooltip />} />
            <Legend content={<ForecastLegend />} />
            
            {/* Confidence Band */}
            <Area type="monotone" dataKey="upper_bound" stroke="none" fill="var(--primary)" fillOpacity={0.12} />
            <Area type="monotone" dataKey="lower_bound" stroke="none" fill="var(--card)" fillOpacity={1} />
            
            {/* Warning / Critical Thresholds */}
            <ReferenceLine y={targetForecast.warning_threshold} stroke="var(--warning)" strokeDasharray="3 3" label={{ position: 'insideTopLeft', value: 'Warning', fill: 'var(--warning)', fontSize: 10 }} />
            <ReferenceLine y={targetForecast.critical_threshold} stroke="var(--danger)" strokeDasharray="3 3" label={{ position: 'insideTopLeft', value: 'Critical', fill: 'var(--danger)', fontSize: 10 }} />
            
            {/* Target Line */}
            <ReferenceLine y={targetForecast.target_value} stroke="var(--success)" strokeDasharray="3 3" label={{ position: 'insideTopLeft', value: 'Target', fill: 'var(--success)', fontSize: 10 }} />

            {/* Historical Line */}
            <Line type="monotone" dataKey="historical_value" name="Historical" stroke="var(--text-muted)" strokeWidth={2} dot={false} activeDot={{ r: 4 }} />
            
            {/* Forecast Line */}
            <Line type="monotone" dataKey="forecasted_value" name="Forecast" stroke="var(--primary)" strokeWidth={2} strokeDasharray="5 5" dot={false} activeDot={{ r: 4 }} />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
