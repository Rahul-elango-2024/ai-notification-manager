import { useEffect, useMemo, useState } from "react";
import "./App.css";

const API_URL = "http://localhost:5000";

function App() {
  const [activePage, setActivePage] = useState("overview");

  const [kpis, setKpis] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [notificationLogs, setNotificationLogs] = useState([]);
  const [notificationRoutes, setNotificationRoutes] = useState([]);

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [kpiValues, setKpiValues] = useState({});
  const [updatingKpi, setUpdatingKpi] = useState(null);

  const [selectedAlertId, setSelectedAlertId] = useState(null);

  const [newRoute, setNewRoute] = useState({
    department_id: "",
    severity: "WARNING",
    channel: "EMAIL",
    recipient: "",
  });

  const [savingRoute, setSavingRoute] = useState(false);

  // ==========================================
  // FETCH ALL DASHBOARD DATA
  // ==========================================
  const fetchData = async (showRefreshing = false) => {
    if (showRefreshing) {
      setRefreshing(true);
    }

    try {
      const [
        monitoringResponse,
        alertsResponse,
        notificationResponse,
        routesResponse,
      ] = await Promise.all([
        fetch(`${API_URL}/api/monitoring`),
        fetch(`${API_URL}/api/alerts`),
        fetch(`${API_URL}/api/notification-logs`),
        fetch(`${API_URL}/api/notification-routes`),
      ]);

      if (!monitoringResponse.ok) {
        throw new Error("Failed to fetch monitoring data");
      }

      if (!alertsResponse.ok) {
        throw new Error("Failed to fetch alerts");
      }

      const monitoringData = await monitoringResponse.json();
      const alertsData = await alertsResponse.json();

      const notificationData = notificationResponse.ok
        ? await notificationResponse.json()
        : [];

      const routesData = routesResponse.ok
        ? await routesResponse.json()
        : [];

      setKpis(monitoringData);
      setAlerts(alertsData);
      setNotificationLogs(notificationData);
      setNotificationRoutes(routesData);

      if (alertsData.length > 0) {
        setSelectedAlertId((currentId) => {
          const stillExists = alertsData.some(
            (alert) => Number(alert.id) === Number(currentId)
          );

          if (stillExists) {
            return currentId;
          }

          const activeAlert = alertsData.find(
            (alert) => !alert.is_resolved
          );

          return activeAlert?.id || alertsData[0].id;
        });
      } else {
        setSelectedAlertId(null);
      }
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // ==========================================
  // UPDATE KPI VALUE
  // ==========================================
  const updateKpiValue = async (kpiId) => {
    const value = kpiValues[kpiId];

    if (
      value === undefined ||
      value === null ||
      value === ""
    ) {
      alert("Please enter a KPI value.");
      return;
    }

    setUpdatingKpi(kpiId);

    try {
      const response = await fetch(
        `${API_URL}/api/kpis/${kpiId}/readings`,
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
  // RESOLVE ALERT - FIXED
  // ==========================================
  const resolveAlert = async (id) => {
    try {
      const response = await fetch(
        `${API_URL}/api/alerts/${id}/resolve`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message ||
            data.error ||
            "Failed to resolve alert"
        );
      }

      setAlerts((previousAlerts) =>
        previousAlerts.map((alert) =>
          Number(alert.id) === Number(id)
            ? {
                ...alert,
                is_resolved: true,
                resolved_at:
                  data.alert?.resolved_at ||
                  new Date().toISOString(),
              }
            : alert
        )
      );

      setSelectedAlertId(id);

      console.log(`Alert #${id} resolved successfully`);
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
        `${API_URL}/api/notification-routes`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            ...newRoute,
            department_id: Number(newRoute.department_id),
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
        `${API_URL}/api/notification-routes/${id}/toggle`,
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
        `${API_URL}/api/notification-routes/${id}`,
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
  // HELPERS
  // ==========================================
  const formatDate = (dateValue) => {
    if (!dateValue) {
      return "-";
    }

    return new Date(dateValue).toLocaleString();
  };

  const formatValue = (value) => {
    if (
      value === undefined ||
      value === null ||
      value === ""
    ) {
      return "-";
    }

    const number = Number(value);

    if (Number.isNaN(number)) {
      return value;
    }

    return number.toLocaleString();
  };

  const getInitials = (name) => {
    if (!name) {
      return "AI";
    }

    return name
      .split(" ")
      .map((word) => word[0])
      .join("")
      .slice(0, 2)
      .toUpperCase();
  };

  const getAlertAnalysis = (message = "") => {
    const recommendationMarker = "Recommendation:";

    if (!message.includes(recommendationMarker)) {
      return {
        summary: "",
        analysis: message,
        recommendation:
          "Review the KPI details and take appropriate corrective action.",
      };
    }

    const [beforeRecommendation, recommendation] =
      message.split(recommendationMarker);

    const lines = beforeRecommendation
      .split("\n")
      .map((line) => line.trim())
      .filter(Boolean);

    return {
      summary: lines[0] || "",
      analysis:
        lines.slice(1).join(" ") ||
        lines[0] ||
        "No analysis available.",
      recommendation:
        recommendation?.trim() ||
        "Review the KPI and take corrective action.",
    };
  };

  // ==========================================
  // COMPUTED DATA
  // ==========================================
  const activeAlerts = useMemo(
    () => alerts.filter((alert) => !alert.is_resolved),
    [alerts]
  );

  const resolvedAlerts = useMemo(
    () => alerts.filter((alert) => alert.is_resolved),
    [alerts]
  );

  const criticalKpis = kpis.filter(
    (kpi) => kpi.status === "CRITICAL"
  ).length;

  const warningKpis = kpis.filter(
    (kpi) => kpi.status === "WARNING"
  ).length;

  const normalKpis = kpis.filter(
    (kpi) => kpi.status === "NORMAL"
  ).length;

  const successfulNotifications =
    notificationLogs.filter(
      (log) => log.status === "SENT"
    ).length;

  const failedNotifications =
    notificationLogs.filter(
      (log) => log.status === "FAILED"
    ).length;

  const selectedAlert =
    alerts.find(
      (alert) =>
        Number(alert.id) === Number(selectedAlertId)
    ) ||
    activeAlerts[0] ||
    alerts[0] ||
    null;

  const selectedAnalysis = selectedAlert
    ? getAlertAnalysis(selectedAlert.message)
    : null;

  const selectedAlertNotification =
    selectedAlert
      ? notificationLogs.find(
          (log) =>
            Number(log.alert_id) ===
            Number(selectedAlert.id)
        )
      : null;

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
  // OPEN ALERTS PAGE
  // ==========================================
  const openAlertsPage = (alertId = null) => {
    if (alertId !== null && alertId !== undefined) {
      setSelectedAlertId(alertId);
    } else {
      const firstActiveAlert = alerts.find(
        (alert) => !alert.is_resolved
      );

      setSelectedAlertId(
        firstActiveAlert?.id ?? alerts[0]?.id ?? null
      );
    }

    setActivePage("alerts");
  };

  // ==========================================
  // AUTO REFRESH
  // ==========================================
  useEffect(() => {
    fetchData();

    const interval = setInterval(() => {
      fetchData();
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <div className="loading-screen">
        <div className="loading-logo">AI</div>

        <h2>AI Notification Manager</h2>

        <p>Loading enterprise monitoring dashboard...</p>
      </div>
    );
  }

  // ==========================================
  // OVERVIEW PAGE
  // ==========================================
  const renderOverview = () => (
    <>
      <div className="page-heading">
        <div>
          <span className="eyebrow">
            REAL-TIME MONITORING
          </span>

          <h1>Dashboard Overview</h1>

          <p>
            Monitor enterprise KPIs, analyze critical
            events and route actionable notifications.
          </p>
        </div>

        <button
          className="primary-button"
          onClick={() => fetchData(true)}
          disabled={refreshing}
        >
          {refreshing
            ? "Refreshing..."
            : "Refresh Data"}
        </button>
      </div>

      <section className="metric-grid">
        <MetricCard
          label="Total KPIs Monitored"
          value={kpis.length}
          icon="◈"
          tone="blue"
          description="Enterprise metrics"
        />

        <MetricCard
          label="Active Alerts"
          value={activeAlerts.length}
          icon="!"
          tone="green"
          description="Requires attention"
        />

        <MetricCard
          label="Critical Events"
          value={criticalKpis}
          icon="▲"
          tone="red"
          description="High-risk conditions"
        />

        <MetricCard
          label="Resolved Alerts"
          value={resolvedAlerts.length}
          icon="✓"
          tone="purple"
          description="Successfully handled"
        />
      </section>

      <section className="overview-layout">
        <div className="panel">
          <div className="panel-header">
            <div>
              <h2>KPI Health Overview</h2>

              <p>
                Current status across monitored
                departments.
              </p>
            </div>

            <button
              className="text-button"
              onClick={() => setActivePage("kpis")}
            >
              View all KPIs
            </button>
          </div>

          <div className="health-summary">
            <HealthItem
              label="Normal"
              value={normalKpis}
              tone="normal"
            />

            <HealthItem
              label="Warning"
              value={warningKpis}
              tone="warning"
            />

            <HealthItem
              label="Critical"
              value={criticalKpis}
              tone="critical"
            />
          </div>

          <div className="compact-kpi-list">
            {kpis.slice(0, 6).map((kpi) => (
              <div
                className="compact-kpi-row"
                key={kpi.id}
              >
                <div className="kpi-identity">
                  <div className="department-avatar">
                    {getInitials(kpi.department)}
                  </div>

                  <div>
                    <strong>{kpi.kpi_name}</strong>
                    <span>{kpi.department}</span>
                  </div>
                </div>

                <div className="compact-value">
                  <strong>
                    {formatValue(kpi.current_value)}
                  </strong>

                  <span>{kpi.unit}</span>
                </div>

                <StatusBadge status={kpi.status} />
              </div>
            ))}
          </div>
        </div>

        <div className="panel alert-detail-panel">
          <div className="panel-header">
            <div>
              <h2>AI Alert Manager</h2>

              <p>
                Active alert intelligence and
                recommended actions.
              </p>
            </div>
          </div>

          {selectedAlert ? (
            <AlertDetail
              alert={selectedAlert}
              analysis={selectedAnalysis}
              notification={selectedAlertNotification}
              formatDate={formatDate}
              onResolve={resolveAlert}
            />
          ) : (
            <EmptyState
              title="No alerts detected"
              description="All monitored KPIs are currently operating without recorded alerts."
            />
          )}
        </div>
      </section>

      <section className="overview-layout lower-overview">
        <div className="panel">
          <div className="panel-header">
            <div>
              <h2>Recent Alerts</h2>

              <p>Latest detected KPI events.</p>
            </div>

            <button
              className="text-button"
              onClick={() => openAlertsPage()}
            >
              Manage alerts
            </button>
          </div>

          {alerts.length === 0 ? (
            <EmptyState
              title="No recent alerts"
              description="New alerts will appear here automatically."
            />
          ) : (
            <div className="data-table-wrapper">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>KPI / Event</th>
                    <th>Department</th>
                    <th>Severity</th>
                    <th>Status</th>
                    <th>Action</th>
                  </tr>
                </thead>

                <tbody>
                  {alerts.slice(0, 5).map((alert) => (
                    <tr key={alert.id}>
                      <td>
                        <div className="table-primary">
                          {alert.kpi_name}
                        </div>

                        <div className="table-secondary">
                          {formatDate(alert.created_at)}
                        </div>
                      </td>

                      <td>{alert.department}</td>

                      <td>
                        <StatusBadge status={alert.status} />
                      </td>

                      <td>
                        <span
                          className={`state-indicator ${
                            alert.is_resolved
                              ? "resolved"
                              : "active"
                          }`}
                        >
                          {alert.is_resolved
                            ? "Resolved"
                            : "Active"}
                        </span>
                      </td>

                      <td>
                        <button
                          className="table-action"
                          onClick={() =>
                            openAlertsPage(alert.id)
                          }
                        >
                          View
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <div className="panel">
          <div className="panel-header">
            <div>
              <h2>Notification Delivery</h2>

              <p>Current communication status.</p>
            </div>
          </div>

          <div className="delivery-stats">
            <div className="delivery-stat success">
              <span>Successfully Sent</span>
              <strong>{successfulNotifications}</strong>
            </div>

            <div className="delivery-stat failed">
              <span>Failed Deliveries</span>
              <strong>{failedNotifications}</strong>
            </div>

            <div className="delivery-stat routes">
              <span>Active Routes</span>

              <strong>
                {
                  notificationRoutes.filter(
                    (route) => route.is_active
                  ).length
                }
              </strong>
            </div>
          </div>

          <div className="benefits-grid">
            <Benefit
              icon="◎"
              title="Real-Time Visibility"
              description="Monitor KPI status and enterprise alerts from one place."
            />

            <Benefit
              icon="⚡"
              title="Faster Response"
              description="Route critical events directly to responsible teams."
            />

            <Benefit
              icon="AI"
              title="Actionable Insights"
              description="Receive AI-assisted analysis and recommended actions."
            />

            <Benefit
              icon="✓"
              title="Accountability"
              description="Track alert resolution and notification delivery."
            />
          </div>
        </div>
      </section>
    </>
  );

  // ==========================================
  // KPI PAGE
  // ==========================================
  const renderKpis = () => (
    <>
      <PageHeader
        eyebrow="PERFORMANCE MONITORING"
        title="KPI Monitoring"
        description="Review live enterprise metrics, thresholds and data sources."
      />

      <div className="kpi-page-grid">
        {kpis.map((kpi) => (
          <div
            className={`professional-kpi-card ${kpi.status.toLowerCase()}`}
            key={kpi.id}
          >
            <div className="professional-kpi-header">
              <div>
                <span className="kpi-department">
                  {kpi.department}
                </span>

                <h3>{kpi.kpi_name}</h3>
              </div>

              <StatusBadge status={kpi.status} />
            </div>

            <div className="large-kpi-value">
              {formatValue(kpi.current_value)}

              <span>{kpi.unit}</span>
            </div>

            <div className="threshold-grid">
              <Threshold
                label="Target"
                value={kpi.target_value}
              />

              <Threshold
                label="Warning"
                value={kpi.warning_threshold}
              />

              <Threshold
                label="Critical"
                value={kpi.critical_threshold}
              />
            </div>

            <div className="kpi-meta">
              <span>Data Source</span>

              <strong>{kpi.source || "Unknown"}</strong>
            </div>

            <div className="kpi-update-form">
              <label>Update KPI Value</label>

              <div>
                <input
                  type="number"
                  placeholder={`Enter value (${kpi.unit})`}
                  value={kpiValues[kpi.id] || ""}
                  onChange={(event) =>
                    setKpiValues(
                      (previousValues) => ({
                        ...previousValues,
                        [kpi.id]: event.target.value,
                      })
                    )
                  }
                />

                <button
                  onClick={() =>
                    updateKpiValue(kpi.id)
                  }
                  disabled={updatingKpi === kpi.id}
                >
                  {updatingKpi === kpi.id
                    ? "Updating..."
                    : "Update"}
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </>
  );

  // ==========================================
  // ALERT PAGE
  // ==========================================
  const renderAlerts = () => (
    <>
      <PageHeader
        eyebrow="AI ALERT INTELLIGENCE"
        title="Alert Manager"
        description="Investigate active events, review AI analysis and manage resolution."
      />

      <div className="alerts-workspace">
        <div className="panel alerts-browser">
          <div className="panel-header">
            <div>
              <h2>Alert Queue</h2>

              <p>
                {activeAlerts.length} active and{" "}
                {resolvedAlerts.length} resolved.
              </p>
            </div>
          </div>

          {alerts.length === 0 ? (
            <EmptyState
              title="No alerts found"
              description="Detected KPI events will appear here."
            />
          ) : (
            <div className="alert-browser-list">
              {alerts.map((alert) => (
                <button
                  className={`alert-browser-item ${
                    Number(selectedAlert?.id) ===
                    Number(alert.id)
                      ? "selected"
                      : ""
                  }`}
                  key={alert.id}
                  onClick={() =>
                    setSelectedAlertId(alert.id)
                  }
                >
                  <div className="alert-browser-top">
                    <StatusBadge status={alert.status} />

                    <span
                      className={`state-indicator ${
                        alert.is_resolved
                          ? "resolved"
                          : "active"
                      }`}
                    >
                      {alert.is_resolved
                        ? "Resolved"
                        : "Active"}
                    </span>
                  </div>

                  <strong>{alert.kpi_name}</strong>

                  <span>{alert.department}</span>

                  <small>
                    {formatDate(alert.created_at)}
                  </small>
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="panel alert-full-detail">
          {selectedAlert ? (
            <AlertDetail
              alert={selectedAlert}
              analysis={selectedAnalysis}
              notification={selectedAlertNotification}
              formatDate={formatDate}
              onResolve={resolveAlert}
              expanded
            />
          ) : (
            <EmptyState
              title="Select an alert"
              description="Choose an alert to review its AI analysis."
            />
          )}
        </div>
      </div>
    </>
  );

  // ==========================================
  // NOTIFICATIONS PAGE
  // ==========================================
  const renderNotifications = () => (
    <>
      <PageHeader
        eyebrow="DELIVERY & AUDIT"
        title="Notification History"
        description="Track successful and failed enterprise alert deliveries."
      />

      <section className="metric-grid compact-metrics">
        <MetricCard
          label="Total Attempts"
          value={notificationLogs.length}
          icon="✉"
          tone="blue"
          description="Notification records"
        />

        <MetricCard
          label="Successfully Sent"
          value={successfulNotifications}
          icon="✓"
          tone="green"
          description="Delivered successfully"
        />

        <MetricCard
          label="Failed"
          value={failedNotifications}
          icon="!"
          tone="red"
          description="Requires review"
        />
      </section>

      <div className="panel">
        <div className="panel-header">
          <div>
            <h2>Delivery Log</h2>

            <p>Full notification audit history.</p>
          </div>
        </div>

        {notificationLogs.length === 0 ? (
          <EmptyState
            title="No notification history"
            description="Notification attempts will be recorded here."
          />
        ) : (
          <div className="data-table-wrapper">
            <table className="data-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Alert</th>
                  <th>Recipient</th>
                  <th>Channel</th>
                  <th>Status</th>
                  <th>Time</th>
                  <th>Details</th>
                </tr>
              </thead>

              <tbody>
                {notificationLogs.map((log) => (
                  <tr key={log.id}>
                    <td>#{log.id}</td>

                    <td>#{log.alert_id || "-"}</td>

                    <td>
                      <div className="table-primary">
                        {log.recipient}
                      </div>
                    </td>

                    <td>{log.channel}</td>

                    <td>
                      <span
                        className={`delivery-badge ${log.status.toLowerCase()}`}
                      >
                        {log.status}
                      </span>
                    </td>

                    <td>{formatDate(log.sent_at)}</td>

                    <td
                      className="error-cell"
                      title={
                        log.error_message ||
                        "No errors"
                      }
                    >
                      {log.error_message
                        ? log.error_message
                        : "Delivered successfully"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </>
  );

  // ==========================================
  // ROUTING PAGE
  // ==========================================
  const renderRouting = () => (
    <>
      <PageHeader
        eyebrow="SMART ROUTING"
        title="Notification Routing"
        description="Configure who receives alerts based on department and severity."
      />

      <div className="routing-layout">
        <div className="panel route-creator">
          <div className="panel-header">
            <div>
              <h2>Add Notification Route</h2>

              <p>Create a new alert delivery rule.</p>
            </div>
          </div>

          <form
            className="professional-route-form"
            onSubmit={createNotificationRoute}
          >
            <label>
              Department

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
                  Select department
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
            </label>

            <label>
              Severity

              <select
                value={newRoute.severity}
                onChange={(event) =>
                  setNewRoute({
                    ...newRoute,
                    severity:
                      event.target.value,
                  })
                }
              >
                <option value="WARNING">
                  Warning
                </option>

                <option value="CRITICAL">
                  Critical
                </option>
              </select>
            </label>

            <label>
              Channel

              <select
                value={newRoute.channel}
                onChange={(event) =>
                  setNewRoute({
                    ...newRoute,
                    channel:
                      event.target.value,
                  })
                }
              >
                <option value="EMAIL">Email</option>
              </select>
            </label>

            <label className="full-field">
              Recipient Email

              <input
                type="email"
                placeholder="manager@company.com"
                value={newRoute.recipient}
                onChange={(event) =>
                  setNewRoute({
                    ...newRoute,
                    recipient:
                      event.target.value,
                  })
                }
              />
            </label>

            <button
              className="primary-button full-field"
              type="submit"
              disabled={savingRoute}
            >
              {savingRoute
                ? "Creating Route..."
                : "Create Notification Route"}
            </button>
          </form>
        </div>

        <div className="panel route-summary-panel">
          <div className="panel-header">
            <div>
              <h2>Routing Summary</h2>

              <p>Current routing configuration.</p>
            </div>
          </div>

          <div className="routing-summary-list">
            <div>
              <span>Total Routes</span>
              <strong>{notificationRoutes.length}</strong>
            </div>

            <div>
              <span>Active Routes</span>

              <strong>
                {
                  notificationRoutes.filter(
                    (route) => route.is_active
                  ).length
                }
              </strong>
            </div>

            <div>
              <span>Inactive Routes</span>

              <strong>
                {
                  notificationRoutes.filter(
                    (route) => !route.is_active
                  ).length
                }
              </strong>
            </div>

            <div>
              <span>Channel</span>
              <strong>Email</strong>
            </div>
          </div>
        </div>
      </div>

      <div className="panel routing-table-panel">
        <div className="panel-header">
          <div>
            <h2>Configured Routes</h2>

            <p>
              Manage alert recipients and routing status.
            </p>
          </div>
        </div>

        {notificationRoutes.length === 0 ? (
          <EmptyState
            title="No routes configured"
            description="Create your first notification route above."
          />
        ) : (
          <div className="data-table-wrapper">
            <table className="data-table">
              <thead>
                <tr>
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
                      <strong>{route.department}</strong>
                    </td>

                    <td>
                      <StatusBadge status={route.severity} />
                    </td>

                    <td>{route.channel}</td>

                    <td>{route.recipient}</td>

                    <td>
                      <span
                        className={`route-state ${
                          route.is_active
                            ? "active"
                            : "inactive"
                        }`}
                      >
                        {route.is_active
                          ? "Active"
                          : "Inactive"}
                      </span>
                    </td>

                    <td>
                      <div className="table-actions">
                        <button
                          className="secondary-button"
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
                          className="danger-button"
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
      </div>
    </>
  );

  const pages = {
    overview: renderOverview,
    kpis: renderKpis,
    alerts: renderAlerts,
    notifications: renderNotifications,
    routing: renderRouting,
  };

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="brand">
          <div className="brand-icon">AI</div>

          <div>
            <strong>AI Notification</strong>
            <span>Manager</span>
          </div>
        </div>

        <nav className="sidebar-nav">
          <NavButton
            active={activePage === "overview"}
            icon="⌂"
            label="Overview"
            onClick={() =>
              setActivePage("overview")
            }
          />

          <NavButton
            active={activePage === "kpis"}
            icon="◇"
            label="KPIs"
            onClick={() => setActivePage("kpis")}
          />

          <NavButton
            active={activePage === "alerts"}
            icon="!"
            label="Alerts"
            badge={activeAlerts.length}
            onClick={() => openAlertsPage()}
          />

          <NavButton
            active={activePage === "notifications"}
            icon="✉"
            label="Notifications"
            onClick={() =>
              setActivePage("notifications")
            }
          />

          <NavButton
            active={activePage === "routing"}
            icon="⇄"
            label="Routing"
            onClick={() =>
              setActivePage("routing")
            }
          />
        </nav>

        <div className="sidebar-footer">
          <div
            className={`system-dot ${
              failedNotifications > 0
                ? "warning"
                : ""
            }`}
          />

          <div>
            <strong>System Monitoring</strong>

            <span>
              {failedNotifications > 0
                ? `${failedNotifications} delivery issue(s)`
                : "All systems operational"}
            </span>
          </div>
        </div>
      </aside>

      <main className="main-content">
        <div className="topbar">
          <div className="topbar-status">
            <span className="live-dot" />
            Live monitoring active
          </div>

          <div className="topbar-meta">
            Auto-refresh every 5 seconds
          </div>
        </div>

        <div className="page-content">
          {pages[activePage]()}
        </div>
      </main>
    </div>
  );
}

// ==========================================
// REUSABLE COMPONENTS
// ==========================================

function NavButton({
  active,
  icon,
  label,
  badge,
  onClick,
}) {
  return (
    <button
      className={`nav-button ${
        active ? "active" : ""
      }`}
      onClick={onClick}
    >
      <span className="nav-icon">{icon}</span>

      <span>{label}</span>

      {badge > 0 && (
        <span className="nav-badge">
          {badge}
        </span>
      )}
    </button>
  );
}

function PageHeader({
  eyebrow,
  title,
  description,
}) {
  return (
    <div className="page-heading">
      <div>
        <span className="eyebrow">
          {eyebrow}
        </span>

        <h1>{title}</h1>

        <p>{description}</p>
      </div>
    </div>
  );
}

function MetricCard({
  label,
  value,
  icon,
  tone,
  description,
}) {
  return (
    <div className={`metric-card ${tone}`}>
      <div className="metric-card-top">
        <div className={`metric-icon ${tone}`}>
          {icon}
        </div>

        <span className="metric-label">
          {label}
        </span>
      </div>

      <strong className="metric-value">
        {value}
      </strong>

      <span className="metric-description">
        {description}
      </span>
    </div>
  );
}

function StatusBadge({ status }) {
  const normalizedStatus =
    status?.toLowerCase() || "normal";

  return (
    <span
      className={`status-badge ${normalizedStatus}`}
    >
      {status}
    </span>
  );
}

function HealthItem({
  label,
  value,
  tone,
}) {
  return (
    <div className={`health-item ${tone}`}>
      <div className="health-icon">
        {tone === "normal"
          ? "✓"
          : tone === "warning"
          ? "!"
          : "▲"}
      </div>

      <div>
        <strong>{value}</strong>
        <span>{label}</span>
      </div>
    </div>
  );
}

function Threshold({ label, value }) {
  return (
    <div className="threshold-item">
      <span>{label}</span>

      <strong>
        {Number(value).toLocaleString()}
      </strong>
    </div>
  );
}

function Benefit({
  icon,
  title,
  description,
}) {
  return (
    <div className="benefit-card">
      <div className="benefit-icon">
        {icon}
      </div>

      <div>
        <strong>{title}</strong>
        <p>{description}</p>
      </div>
    </div>
  );
}

function EmptyState({
  title,
  description,
}) {
  return (
    <div className="empty-state">
      <div className="empty-icon">◇</div>

      <h3>{title}</h3>

      <p>{description}</p>
    </div>
  );
}

// ==========================================
// ENHANCED AI ALERT DETAIL
// ==========================================

function AlertDetail({
  alert,
  analysis,
  notification,
  formatDate,
  onResolve,
  expanded = false,
}) {
  const possibleCauses = Array.isArray(
    alert.possible_causes
  )
    ? alert.possible_causes
    : [];

  const recommendedActions = Array.isArray(
    alert.recommended_actions
  )
    ? alert.recommended_actions
    : [];

  const aiTimeline = Array.isArray(
    alert.ai_timeline
  )
    ? alert.ai_timeline
    : [];

  const hasEnhancedAI =
    alert.risk_score !== null &&
    alert.risk_score !== undefined;

  const deviationValue =
    alert.deviation_percentage !== null &&
    alert.deviation_percentage !== undefined
      ? Math.abs(
          Number(alert.deviation_percentage)
        )
      : null;

  const riskLevel =
    alert.risk_level || "Not Available";

  const riskClass = riskLevel.toLowerCase();

  return (
    <div
      className={`alert-detail ${
        expanded ? "expanded" : ""
      }`}
    >
      <div className="alert-detail-heading">
        <div>
          <div className="alert-title-row">
            <StatusBadge status={alert.status} />

            <span
              className={`state-indicator ${
                alert.is_resolved
                  ? "resolved"
                  : "active"
              }`}
            >
              {alert.is_resolved
                ? "Resolved"
                : "Active"}
            </span>

            {hasEnhancedAI && (
              <span
                className={`ai-risk-badge ${riskClass}`}
              >
                {riskLevel} RISK
              </span>
            )}
          </div>

          <h3>{alert.kpi_name}</h3>

          <p>{alert.department}</p>
        </div>

        {!alert.is_resolved && (
          <button
            className="resolve-button"
            onClick={() =>
              onResolve(alert.id)
            }
          >
            Resolve Alert
          </button>
        )}
      </div>

      <div className="alert-meta-grid">
        <div>
          <span>Alert ID</span>
          <strong>#{alert.id}</strong>
        </div>

        <div>
          <span>Current Value</span>

          <strong>
            {Number(
              alert.current_value
            ).toLocaleString()}
          </strong>
        </div>

        <div>
          <span>Detected</span>

          <strong>
            {formatDate(alert.created_at)}
          </strong>
        </div>

        <div>
          <span>Notification</span>

          <strong
            className={
              notification?.status === "FAILED"
                ? "text-danger"
                : "text-success"
            }
          >
            {notification?.status ||
              "Not recorded"}
          </strong>
        </div>
      </div>

      {hasEnhancedAI && (
        <>
          <div className="ai-intelligence-header">
            <div>
              <span className="ai-intelligence-eyebrow">
                AI RISK INTELLIGENCE
              </span>

              <h4>Risk Assessment</h4>
            </div>

            {alert.ai_generated_at && (
              <span className="ai-generated-time">
                Generated{" "}
                {formatDate(
                  alert.ai_generated_at
                )}
              </span>
            )}
          </div>

          <div className="ai-risk-grid">
            <div className="ai-risk-card score">
              <span>Risk Score</span>

              <div className="risk-score-value">
                <strong>
                  {alert.risk_score}
                </strong>

                <small>/ 100</small>
              </div>

              <div className="risk-progress">
                <div
                  className={`risk-progress-fill ${riskClass}`}
                  style={{
                    width: `${Math.min(
                      Math.max(
                        Number(
                          alert.risk_score
                        ) || 0,
                        0
                      ),
                      100
                    )}%`,
                  }}
                />
              </div>
            </div>

            <div className="ai-risk-card">
              <span>Risk Level</span>

              <strong
                className={`risk-level-text ${riskClass}`}
              >
                {riskLevel}
              </strong>

              <small>
                Business impact priority
              </small>
            </div>

            <div className="ai-risk-card">
              <span>Deviation</span>

              <strong>
                {deviationValue !== null
                  ? `${deviationValue.toFixed(
                      2
                    )}%`
                  : "-"}
              </strong>

              <small>
                {alert.deviation_direction ||
                  "Target comparison"}
              </small>
            </div>
          </div>
        </>
      )}

      {hasEnhancedAI &&
        alert.impact_summary && (
          <div className="ai-enhanced-section impact-summary">
            <div className="ai-section-heading">
              <div className="ai-section-icon">
                !
              </div>

              <div>
                <span>BUSINESS IMPACT</span>

                <h4>AI Impact Summary</h4>
              </div>
            </div>

            <p>{alert.impact_summary}</p>
          </div>
        )}

      {hasEnhancedAI &&
        possibleCauses.length > 0 && (
          <div className="ai-enhanced-section">
            <div className="ai-section-heading">
              <div className="ai-section-icon">
                ?
              </div>

              <div>
                <span>
                  ROOT CAUSE ANALYSIS
                </span>

                <h4>Possible Causes</h4>
              </div>
            </div>

            <div className="ai-item-list">
              {possibleCauses.map(
                (cause, index) => (
                  <div
                    className="ai-list-item"
                    key={index}
                  >
                    <div className="ai-list-number">
                      {index + 1}
                    </div>

                    <p>
                      {typeof cause === "string"
                        ? cause
                        : cause.description ||
                          cause.cause ||
                          JSON.stringify(cause)}
                    </p>
                  </div>
                )
              )}
            </div>
          </div>
        )}

      {hasEnhancedAI &&
        recommendedActions.length > 0 && (
          <div className="ai-enhanced-section recommended-actions">
            <div className="ai-section-heading">
              <div className="ai-section-icon">
                ✓
              </div>

              <div>
                <span>RESPONSE PLAN</span>

                <h4>
                  Recommended Actions
                </h4>
              </div>
            </div>

            <div className="ai-action-list">
              {recommendedActions.map(
                (action, index) => (
                  <div
                    className="ai-action-item"
                    key={index}
                  >
                    <div className="action-priority">
                      {index + 1}
                    </div>

                    <div>
                      <span>
                        Priority {index + 1}
                      </span>

                      <p>
                        {typeof action === "string"
                          ? action
                          : action.action ||
                            action.description ||
                            JSON.stringify(
                              action
                            )}
                      </p>
                    </div>
                  </div>
                )
              )}
            </div>
          </div>
        )}

      {hasEnhancedAI &&
        aiTimeline.length > 0 && (
          <div className="ai-enhanced-section">
            <div className="ai-section-heading">
              <div className="ai-section-icon">
                ◷
              </div>

              <div>
                <span>EVENT TRACKING</span>

                <h4>
                  AI Response Timeline
                </h4>
              </div>
            </div>

            <div className="ai-timeline">
              {aiTimeline.map(
                (item, index) => {
                  const isObject =
                    item !== null &&
                    typeof item ===
                      "object";

                  const title = isObject
                    ? item.title ||
                      item.event ||
                      item.stage ||
                      `Stage ${index + 1}`
                    : `Stage ${index + 1}`;

                  const description =
                    isObject
                      ? item.description ||
                        item.details ||
                        item.message ||
                        ""
                      : String(item);

                  const time = isObject
                    ? item.time ||
                      item.timestamp ||
                      item.created_at
                    : null;

                  return (
                    <div
                      className="timeline-item"
                      key={index}
                    >
                      <div className="timeline-marker">
                        <span>
                          {index + 1}
                        </span>
                      </div>

                      <div className="timeline-content">
                        <strong>
                          {title}
                        </strong>

                        {description && (
                          <p>
                            {description}
                          </p>
                        )}

                        {time && (
                          <small>
                            {formatDate(time)}
                          </small>
                        )}
                      </div>
                    </div>
                  );
                }
              )}
            </div>
          </div>
        )}

      {!hasEnhancedAI && (
        <>
          {analysis?.summary && (
            <div className="analysis-section impact">
              <div className="analysis-label">
                AI Impact Summary
              </div>

              <p>{analysis.summary}</p>
            </div>
          )}

          <div className="analysis-section">
            <div className="analysis-label">
              AI Analysis
            </div>

            <p>
              {analysis?.analysis ||
                "No AI analysis available."}
            </p>
          </div>

          <div className="analysis-section recommendation">
            <div className="analysis-label">
              Recommended Action
            </div>

            <p>
              {analysis?.recommendation ||
                "Review this KPI and take appropriate corrective action."}
            </p>
          </div>
        </>
      )}

      {notification?.error_message && (
        <div className="analysis-section delivery-error">
          <div className="analysis-label">
            Notification Delivery Issue
          </div>

          <p>
            The alert was created successfully,
            but the email notification could not
            be delivered.
          </p>

          <small>
            {notification.error_message}
          </small>
        </div>
      )}
    </div>
  );
}

export default App;