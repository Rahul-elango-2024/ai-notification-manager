import { useEffect, useState } from "react";
import "./App.css";

function App() {
  const [kpis, setKpis] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [notificationLogs, setNotificationLogs] = useState([]);
  const [notificationRoutes, setNotificationRoutes] = useState([]);
  const [loading, setLoading] = useState(true);

  const [kpiValues, setKpiValues] = useState({});
  const [updatingKpi, setUpdatingKpi] = useState(null);

  const [newRoute, setNewRoute] = useState({
    department_id: "",
    severity: "WARNING",
    channel: "EMAIL",
    recipient: "",
  });

  const [savingRoute, setSavingRoute] = useState(false);

  // ==========================================
  // FETCH DASHBOARD DATA
  // ==========================================
  const fetchData = async () => {
    try {
      // Fetch KPI monitoring data
      const monitoringResponse = await fetch(
        "http://localhost:5000/api/monitoring"
      );

      if (!monitoringResponse.ok) {
        throw new Error("Failed to fetch monitoring data");
      }

      const monitoringData = await monitoringResponse.json();

      // Fetch alerts
      const alertsResponse = await fetch(
        "http://localhost:5000/api/alerts"
      );

      if (!alertsResponse.ok) {
        throw new Error("Failed to fetch alerts");
      }

      const alertsData = await alertsResponse.json();

      // Fetch notification history
      const notificationResponse = await fetch(
        "http://localhost:5000/api/notification-logs"
      );

      let notificationData = [];

      if (notificationResponse.ok) {
        notificationData = await notificationResponse.json();
      } else {
        console.error("Failed to fetch notification logs");
      }

      // Fetch notification routes
      const routesResponse = await fetch(
        "http://localhost:5000/api/notification-routes"
      );

      let routesData = [];

      if (routesResponse.ok) {
        routesData = await routesResponse.json();
      } else {
        console.error("Failed to fetch notification routes");
      }

      setKpis(monitoringData);
      setAlerts(alertsData);
      setNotificationLogs(notificationData);
      setNotificationRoutes(routesData);
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
    } finally {
      setLoading(false);
    }
  };

  // ==========================================
  // UPDATE KPI VALUE
  // ==========================================
  const updateKpiValue = async (kpiId) => {
    const value = kpiValues[kpiId];

    if (value === undefined || value === "") {
      alert("Please enter a KPI value.");
      return;
    }

    setUpdatingKpi(kpiId);

    try {
      const response = await fetch(
        `http://localhost:5000/api/kpis/${kpiId}/readings`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            value: Number(value),
            source: "Dashboard Manual Update",
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message || "Failed to update KPI value"
        );
      }

      setKpiValues((previousValues) => ({
        ...previousValues,
        [kpiId]: "",
      }));

      await fetchData();
    } catch (error) {
      console.error("Error updating KPI:", error);
      alert(error.message);
    } finally {
      setUpdatingKpi(null);
    }
  };

  // ==========================================
  // RESOLVE ALERT
  // ==========================================
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
      alert(error.message);
    }
  };

  // ==========================================
  // CREATE NOTIFICATION ROUTE
  // ==========================================
  const createNotificationRoute = async (event) => {
    event.preventDefault();

    if (
      !newRoute.department_id ||
      !newRoute.recipient.trim()
    ) {
      alert(
        "Please select a department and enter a recipient email."
      );
      return;
    }

    setSavingRoute(true);

    try {
      const response = await fetch(
        "http://localhost:5000/api/notification-routes",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            ...newRoute,
            department_id: Number(
              newRoute.department_id
            ),
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message ||
            "Failed to create notification route"
        );
      }

      setNewRoute({
        department_id: "",
        severity: "WARNING",
        channel: "EMAIL",
        recipient: "",
      });

      await fetchData();

      alert("Notification route created successfully.");
    } catch (error) {
      console.error(
        "Error creating notification route:",
        error
      );

      alert(error.message);
    } finally {
      setSavingRoute(false);
    }
  };

  // ==========================================
  // TOGGLE NOTIFICATION ROUTE
  // ==========================================
  const toggleNotificationRoute = async (id) => {
    try {
      const response = await fetch(
        `http://localhost:5000/api/notification-routes/${id}/toggle`,
        {
          method: "PUT",
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message ||
            "Failed to update notification route"
        );
      }

      await fetchData();
    } catch (error) {
      console.error(
        "Error toggling notification route:",
        error
      );

      alert(error.message);
    }
  };

  // ==========================================
  // DELETE NOTIFICATION ROUTE
  // ==========================================
  const deleteNotificationRoute = async (id) => {
    const shouldDelete = window.confirm(
      "Are you sure you want to delete this notification route?"
    );

    if (!shouldDelete) {
      return;
    }

    try {
      const response = await fetch(
        `http://localhost:5000/api/notification-routes/${id}`,
        {
          method: "DELETE",
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message ||
            "Failed to delete notification route"
        );
      }

      await fetchData();
    } catch (error) {
      console.error(
        "Error deleting notification route:",
        error
      );

      alert(error.message);
    }
  };

  // ==========================================
  // FORMAT DATE
  // ==========================================
  const formatDate = (dateValue) => {
    if (!dateValue) {
      return "-";
    }

    return new Date(dateValue).toLocaleString();
  };

  // ==========================================
  // GET UNIQUE DEPARTMENTS
  // ==========================================
  const departments = [
    ...new Map(
      kpis.map((kpi) => [
        kpi.department_id,
        {
          id: kpi.department_id,
          name: kpi.department,
        },
      ])
    ).values(),
  ];

  // ==========================================
  // AUTO REFRESH
  // ==========================================
  useEffect(() => {
    fetchData();

    const interval = setInterval(fetchData, 5000);

    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <div className="loading">
        Loading dashboard...
      </div>
    );
  }

  return (
    <div className="dashboard">

      {/* ======================================
          HEADER
      ====================================== */}

      <header className="header">
        <div>
          <h1>AI Notification Manager</h1>

          <p>
            Real-Time Enterprise KPI Monitoring Dashboard
          </p>
        </div>

        <button
          className="refresh-btn"
          onClick={fetchData}
        >
          Refresh
        </button>
      </header>

      {/* ======================================
          SUMMARY CARDS
      ====================================== */}

      <section className="summary">

        <div className="summary-card">
          <h3>Total KPIs</h3>
          <h2>{kpis.length}</h2>
        </div>

        <div className="summary-card">
          <h3>Normal</h3>

          <h2>
            {
              kpis.filter(
                (kpi) => kpi.status === "NORMAL"
              ).length
            }
          </h2>
        </div>

        <div className="summary-card">
          <h3>Warnings</h3>

          <h2>
            {
              kpis.filter(
                (kpi) => kpi.status === "WARNING"
              ).length
            }
          </h2>
        </div>

        <div className="summary-card">
          <h3>Critical</h3>

          <h2>
            {
              kpis.filter(
                (kpi) => kpi.status === "CRITICAL"
              ).length
            }
          </h2>
        </div>

      </section>

      {/* ======================================
          KPI MONITORING
      ====================================== */}

      <section>

        <h2 className="section-title">
          KPI Monitoring
        </h2>

        <div className="kpi-grid">

          {kpis.map((kpi) => (

            <div
              className={`kpi-card ${kpi.status.toLowerCase()}`}
              key={kpi.id}
            >

              <div className="kpi-header">

                <h3>
                  {kpi.kpi_name}
                </h3>

                <span
                  className={`status ${kpi.status.toLowerCase()}`}
                >
                  {kpi.status}
                </span>

              </div>

              <p className="department">
                {kpi.department}
              </p>

              <div className="value">
                {kpi.current_value} {kpi.unit}
              </div>

              <div className="thresholds">

                <p>
                  <strong>Target:</strong>{" "}
                  {kpi.target_value}
                </p>

                <p>
                  <strong>Warning:</strong>{" "}
                  {kpi.warning_threshold}
                </p>

                <p>
                  <strong>Critical:</strong>{" "}
                  {kpi.critical_threshold}
                </p>

              </div>

              <p className="source">
                Source: {kpi.source || "Unknown"}
              </p>

              <div className="kpi-update">

                <input
                  type="number"
                  placeholder={`Enter new value (${kpi.unit})`}
                  value={kpiValues[kpi.id] || ""}
                  onChange={(event) =>
                    setKpiValues(
                      (previousValues) => ({
                        ...previousValues,
                        [kpi.id]:
                          event.target.value,
                      })
                    )
                  }
                />

                <button
                  onClick={() =>
                    updateKpiValue(kpi.id)
                  }
                  disabled={
                    updatingKpi === kpi.id
                  }
                >
                  {updatingKpi === kpi.id
                    ? "Updating..."
                    : "Update Value"}
                </button>

              </div>

            </div>

          ))}

        </div>

      </section>

      {/* ======================================
          ALERTS
      ====================================== */}

      <section className="alerts-section">

        <h2 className="section-title">
          Alerts
        </h2>

        {alerts.length === 0 ? (

          <div className="no-alerts">
            No alerts found.
          </div>

        ) : (

          <div className="alerts-list">

            {alerts.map((alert) => (

              <div
                className={`alert-card ${
                  alert.is_resolved
                    ? "resolved"
                    : "active"
                }`}
                key={alert.id}
              >

                <div>

                  <div className="alert-heading">

                    <span
                      className={`status ${alert.status.toLowerCase()}`}
                    >
                      {alert.status}
                    </span>

                    <strong>
                      {alert.kpi_name}
                    </strong>

                  </div>

                  <p>
                    {alert.message}
                  </p>

                  <small>
                    Department:{" "}
                    {alert.department}
                  </small>

                </div>

                {alert.is_resolved ? (

                  <span className="resolved-label">
                    Resolved
                  </span>

                ) : (

                  <button
                    className="resolve-btn"
                    onClick={() =>
                      resolveAlert(alert.id)
                    }
                  >
                    Resolve
                  </button>

                )}

              </div>

            ))}

          </div>

        )}

      </section>

      {/* ======================================
          NOTIFICATION ROUTING MANAGEMENT
      ====================================== */}

      <section className="routing-section">

        <h2 className="section-title">
          Notification Routing Management
        </h2>

        <div className="route-management-card">

          <h3>Add Notification Route</h3>

          <form
            className="route-form"
            onSubmit={createNotificationRoute}
          >

            <select
              value={newRoute.department_id}
              onChange={(event) =>
                setNewRoute({
                  ...newRoute,
                  department_id:
                    event.target.value,
                })
              }
            >
              <option value="">
                Select Department
              </option>

              {departments.map((department) => (

                <option
                  key={department.id}
                  value={department.id}
                >
                  {department.name}
                </option>

              ))}

            </select>

            <select
              value={newRoute.severity}
              onChange={(event) =>
                setNewRoute({
                  ...newRoute,
                  severity: event.target.value,
                })
              }
            >
              <option value="WARNING">
                WARNING
              </option>

              <option value="CRITICAL">
                CRITICAL
              </option>
            </select>

            <select
              value={newRoute.channel}
              onChange={(event) =>
                setNewRoute({
                  ...newRoute,
                  channel: event.target.value,
                })
              }
            >
              <option value="EMAIL">
                EMAIL
              </option>
            </select>

            <input
              type="email"
              placeholder="Recipient email"
              value={newRoute.recipient}
              onChange={(event) =>
                setNewRoute({
                  ...newRoute,
                  recipient:
                    event.target.value,
                })
              }
            />

            <button
              type="submit"
              disabled={savingRoute}
            >
              {savingRoute
                ? "Adding..."
                : "Add Route"}
            </button>

          </form>

        </div>

        {notificationRoutes.length === 0 ? (

          <div className="no-alerts">
            No notification routes found.
          </div>

        ) : (

          <div className="notification-table-container">

            <table className="notification-table">

              <thead>
                <tr>
                  <th>ID</th>
                  <th>Department</th>
                  <th>Severity</th>
                  <th>Channel</th>
                  <th>Recipient</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>

              <tbody>

                {notificationRoutes.map((route) => (

                  <tr key={route.id}>

                    <td>
                      {route.id}
                    </td>

                    <td>
                      {route.department}
                    </td>

                    <td>

                      <span
                        className={`status ${route.severity.toLowerCase()}`}
                      >
                        {route.severity}
                      </span>

                    </td>

                    <td>
                      {route.channel}
                    </td>

                    <td>
                      {route.recipient}
                    </td>

                    <td>

                      <span
                        className={`route-status ${
                          route.is_active
                            ? "active"
                            : "inactive"
                        }`}
                      >
                        {route.is_active
                          ? "ACTIVE"
                          : "INACTIVE"}
                      </span>

                    </td>

                    <td>

                      <div className="route-actions">

                        <button
                          className="toggle-route-btn"
                          onClick={() =>
                            toggleNotificationRoute(
                              route.id
                            )
                          }
                        >
                          {route.is_active
                            ? "Deactivate"
                            : "Activate"}
                        </button>

                        <button
                          className="delete-route-btn"
                          onClick={() =>
                            deleteNotificationRoute(
                              route.id
                            )
                          }
                        >
                          Delete
                        </button>

                      </div>

                    </td>

                  </tr>

                ))}

              </tbody>

            </table>

          </div>

        )}

      </section>

      {/* ======================================
          NOTIFICATION HISTORY
      ====================================== */}

      <section className="notification-section">

        <h2 className="section-title">
          Notification History
        </h2>

        {notificationLogs.length === 0 ? (

          <div className="no-alerts">
            No notification history found.
          </div>

        ) : (

          <div className="notification-table-container">

            <table className="notification-table">

              <thead>
                <tr>
                  <th>ID</th>
                  <th>Alert ID</th>
                  <th>Recipient</th>
                  <th>Channel</th>
                  <th>Status</th>
                  <th>Sent Time</th>
                  <th>Error</th>
                </tr>
              </thead>

              <tbody>

                {notificationLogs.map((log) => (

                  <tr key={log.id}>

                    <td>
                      {log.id}
                    </td>

                    <td>
                      {log.alert_id || "-"}
                    </td>

                    <td>
                      {log.recipient}
                    </td>

                    <td>
                      {log.channel}
                    </td>

                    <td>

                      <span
                        className={`notification-status ${
                          log.status === "SENT"
                            ? "sent"
                            : "failed"
                        }`}
                      >
                        {log.status}
                      </span>

                    </td>

                    <td>
                      {formatDate(log.sent_at)}
                    </td>

                    <td>
                      {log.error_message || "-"}
                    </td>

                  </tr>

                ))}

              </tbody>

            </table>

          </div>

        )}

      </section>

    </div>
  );
}

export default App;