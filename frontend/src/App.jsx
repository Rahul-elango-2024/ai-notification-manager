import { useEffect, useState } from "react";
import "./App.css";

function App() {
  const [kpis, setKpis] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    try {
      const monitoringResponse = await fetch(
        "http://localhost:5000/api/monitoring"
      );
      const monitoringData = await monitoringResponse.json();

      const alertsResponse = await fetch(
        "http://localhost:5000/api/alerts"
      );
      const alertsData = await alertsResponse.json();

      setKpis(monitoringData);
      setAlerts(alertsData);
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
    } finally {
      setLoading(false);
    }
  };

  const resolveAlert = async (id) => {
    try {
      const response = await fetch(
        `http://localhost:5000/api/alerts/${id}/resolve`,
        {
          method: "PUT",
        }
      );

      if (!response.ok) {
        throw new Error("Failed to resolve alert");
      }

      await fetchData();
    } catch (error) {
      console.error("Error resolving alert:", error);
    }
  };

  useEffect(() => {
    fetchData();

    const interval = setInterval(fetchData, 5000);

    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return <div className="loading">Loading dashboard...</div>;
  }

  return (
    <div className="dashboard">
      <header className="header">
        <div>
          <h1>AI Notification Manager</h1>
          <p>Real-Time Enterprise KPI Monitoring Dashboard</p>
        </div>

        <button className="refresh-btn" onClick={fetchData}>
          Refresh
        </button>
      </header>

      <section className="summary">
        <div className="summary-card">
          <h3>Total KPIs</h3>
          <h2>{kpis.length}</h2>
        </div>

        <div className="summary-card">
          <h3>Normal</h3>
          <h2>{kpis.filter((kpi) => kpi.status === "NORMAL").length}</h2>
        </div>

        <div className="summary-card">
          <h3>Warnings</h3>
          <h2>{kpis.filter((kpi) => kpi.status === "WARNING").length}</h2>
        </div>

        <div className="summary-card">
          <h3>Critical</h3>
          <h2>{kpis.filter((kpi) => kpi.status === "CRITICAL").length}</h2>
        </div>
      </section>

      <section>
        <h2 className="section-title">KPI Monitoring</h2>

        <div className="kpi-grid">
          {kpis.map((kpi) => (
            <div
              className={`kpi-card ${kpi.status.toLowerCase()}`}
              key={kpi.id}
            >
              <div className="kpi-header">
                <h3>{kpi.kpi_name}</h3>
                <span className={`status ${kpi.status.toLowerCase()}`}>
                  {kpi.status}
                </span>
              </div>

              <p className="department">{kpi.department}</p>

              <div className="value">
                {kpi.current_value} {kpi.unit}
              </div>

              <div className="thresholds">
                <p>
                  <strong>Target:</strong> {kpi.target_value}
                </p>

                <p>
                  <strong>Warning:</strong> {kpi.warning_threshold}
                </p>

                <p>
                  <strong>Critical:</strong> {kpi.critical_threshold}
                </p>
              </div>

              <p className="source">Source: {kpi.source}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="alerts-section">
        <h2 className="section-title">Alerts</h2>

        {alerts.length === 0 ? (
          <div className="no-alerts">No alerts found.</div>
        ) : (
          <div className="alerts-list">
            {alerts.map((alert) => (
              <div
                className={`alert-card ${
                  alert.is_resolved ? "resolved" : "active"
                }`}
                key={alert.id}
              >
                <div>
                  <div className="alert-heading">
                    <span className={`status ${alert.status.toLowerCase()}`}>
                      {alert.status}
                    </span>

                    <strong>{alert.kpi_name}</strong>
                  </div>

                  <p>{alert.message}</p>

                  <small>
                    Department: {alert.department}
                  </small>
                </div>

                {alert.is_resolved ? (
                  <span className="resolved-label">Resolved</span>
                ) : (
                  <button
                    className="resolve-btn"
                    onClick={() => resolveAlert(alert.id)}
                  >
                    Resolve
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

export default App;