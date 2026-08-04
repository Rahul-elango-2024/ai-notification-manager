import React from "react";
import "./ForecastHistory.css";

export default function ForecastHistory({ history }) {
  if (!history || history.length === 0) {
    return (
      <div className="forecast-history-container panel">
        <div className="panel-header">
          <div>
            <h2>Forecast History</h2>
            <p>Latest AI forecast events in chronological order.</p>
          </div>
        </div>
        <div className="empty-history-state">No history data available</div>
      </div>
    );
  }

  return (
    <div className="forecast-history-container panel">
      <div className="panel-header">
        <div>
          <h2>Forecast History</h2>
          <p>Latest AI forecast events in chronological order.</p>
        </div>
      </div>
      <div className="data-table-wrapper predictive-table-wrapper">
        <table className="data-table predictive-data-table">
          <thead>
            <tr>
              <th>Time</th>
              <th>KPI</th>
              <th>Forecast Event</th>
              <th>Confidence</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {history.map((item, idx) => {
              const timeStr = new Date(item.generated_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
              return (
                <tr key={idx}>
                  <td className="table-primary">{timeStr}</td>
                  <td>{item.kpi_name}</td>
                  <td className="table-secondary" title={item.ai_recommendation || item.trend}>
                    {item.ai_recommendation || `Trend: ${item.trend}`}
                  </td>
                  <td>{item.confidence_percentage}%</td>
                  <td>
                    <span className={`status-badge ${item.risk_level?.toLowerCase()}`}>{item.risk_level}</span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
