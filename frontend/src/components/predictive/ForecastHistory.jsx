import React from "react";
import "./ForecastHistory.css";

export default function ForecastHistory({ history }) {
  if (!history || history.length === 0) {
    return (
      <div className="forecast-history-container enterprise-card">
        <div className="card-header">
          <h3 className="card-title">Forecast History</h3>
        </div>
        <div className="history-list">
          <div className="history-body empty-history-state">
            No history data available
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="forecast-history-container enterprise-card">
      <div className="card-header">
        <h3 className="card-title">Forecast History</h3>
      </div>
      <div className="history-list">
        <div className="history-header">
          <div className="hist-col time-col">Time</div>
          <div className="hist-col target-col">KPI</div>
          <div className="hist-col event-col">Forecast Event</div>
          <div className="hist-col conf-col">Confidence</div>
          <div className="hist-col status-col">Status</div>
        </div>
        <div className="history-body">
          {history.map((item, idx) => {
            const timeStr = new Date(item.generated_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
            return (
              <div key={idx} className="history-row">
                <div className="hist-col time-col">{timeStr}</div>
                <div className="hist-col target-col">{item.kpi_name}</div>
                <div className="hist-col event-col" title={item.ai_recommendation || item.trend}>{item.ai_recommendation || `Trend: ${item.trend}`}</div>
                <div className="hist-col conf-col">{item.confidence_percentage}%</div>
                <div className="hist-col status-col">
                  <span className={`status-badge ${item.risk_level?.toLowerCase()}`}>{item.risk_level}</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
