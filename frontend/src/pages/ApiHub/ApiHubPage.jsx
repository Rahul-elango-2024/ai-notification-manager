import React, { useState, useEffect, useCallback, useRef } from "react";
import { authService } from "../../services/authService";
import OverviewTab from "./tabs/OverviewTab";
import ApiKeysTab from "./tabs/ApiKeysTab";
import UsageAnalyticsTab from "./tabs/UsageAnalyticsTab";
import RequestLogsTab from "./tabs/RequestLogsTab";
import WebhooksTab from "./tabs/WebhooksTab";
import ApiDocumentationTab from "./tabs/ApiDocumentationTab";
import "./ApiHubPage.css";

const API_URL = "http://localhost:5000";

function authHeaders() {
  const token = authService.getToken();
  return {
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`,
  };
}

// Toast System
function ToastContainer({ toasts, onDismiss }) {
  return (
    <div className="toast-container">
      {toasts.map((t) => (
        <div key={t.id} className={`toast ${t.type}`}>
          <span className="toast-icon">
            {t.type === "success" ? "✓" : t.type === "error" ? "✕" : "ℹ"}
          </span>
          <span>{t.message}</span>
          <button className="toast-close" onClick={() => onDismiss(t.id)}>×</button>
        </div>
      ))}
    </div>
  );
}

function useToast() {
  const [toasts, setToasts] = useState([]);
  const counterRef = useRef(0);

  const addToast = useCallback((message, type = "info") => {
    counterRef.current += 1;
    const id = counterRef.current;
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4500);
  }, []);

  const dismissToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  return { toasts, addToast, dismissToast };
}

export default function ApiHubPage() {
  const [activeTab, setActiveTab] = useState("overview"); // overview | keys | analytics | logs | webhooks | docs
  const [apiKeys, setApiKeys] = useState([]);
  const [webhooks, setWebhooks] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);

  const { toasts, addToast, dismissToast } = useToast();

  const fetchHubData = async () => {
    try {
      const [keysRes, webhooksRes, deptsRes, analyticsRes] = await Promise.all([
        fetch(`${API_URL}/api/api-keys`, { headers: authHeaders() }),
        fetch(`${API_URL}/api/webhooks`, { headers: authHeaders() }),
        fetch(`${API_URL}/api/monitoring`),
        fetch(`${API_URL}/api/api-analytics/summary`, { headers: authHeaders() }),
      ]);

      const keysData = keysRes.ok ? await keysRes.json() : [];
      const webhooksData = webhooksRes.ok ? await webhooksRes.json() : [];
      const monitoringData = deptsRes.ok ? await deptsRes.json() : [];
      const analyticsData = analyticsRes.ok ? await analyticsRes.json() : null;

      // Extract unique departments from monitoring data
      const deptMap = new Map();
      monitoringData.forEach((kpi) => {
        if (kpi.department_id && kpi.department) {
          deptMap.set(kpi.department_id, { id: kpi.department_id, name: kpi.department });
        }
      });

      setApiKeys(keysData);
      setWebhooks(webhooksData);
      setDepartments(Array.from(deptMap.values()));
      setAnalytics(analyticsData);
    } catch (err) {
      console.error("Error fetching API Hub data:", err);
      addToast("Failed to load API Hub data.", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHubData();
  }, []);

  // Instant deletion handler
  const handleDeleteKeySuccess = useCallback((deletedId) => {
    setApiKeys((prev) => prev.filter((k) => Number(k.id) !== Number(deletedId)));
  }, []);

  return (
    <div className="api-hub-page">
      <ToastContainer toasts={toasts} onDismiss={dismissToast} />

      {/* Page Heading */}
      <div className="page-heading">
        <div>
          <span className="eyebrow">ENTERPRISE API INTEGRATION HUB</span>
          <h1>API Integration Hub</h1>
          <p>Securely connect SAP ERP, Oracle, Dynamics, Salesforce, IoT, CloudWatch, and custom enterprise applications.</p>
        </div>

        <button className="secondary-button" onClick={fetchHubData} disabled={loading}>
          {loading ? "Refreshing..." : "↻ Refresh Hub Data"}
        </button>
      </div>

      {/* Main Tab Navigation Bar */}
      <div className="hub-tabs-header">
        <button
          className={`hub-tab-button ${activeTab === "overview" ? "active" : ""}`}
          onClick={() => setActiveTab("overview")}
        >
          <span className="tab-icon">🌐</span> Overview
        </button>

        <button
          className={`hub-tab-button ${activeTab === "keys" ? "active" : ""}`}
          onClick={() => setActiveTab("keys")}
        >
          <span className="tab-icon">🔑</span> API Keys ({apiKeys.length})
        </button>

        <button
          className={`hub-tab-button ${activeTab === "analytics" ? "active" : ""}`}
          onClick={() => setActiveTab("analytics")}
        >
          <span className="tab-icon">📈</span> Usage Analytics
        </button>

        <button
          className={`hub-tab-button ${activeTab === "logs" ? "active" : ""}`}
          onClick={() => setActiveTab("logs")}
        >
          <span className="tab-icon">📜</span> Request Logs
        </button>

        <button
          className={`hub-tab-button ${activeTab === "webhooks" ? "active" : ""}`}
          onClick={() => setActiveTab("webhooks")}
        >
          <span className="tab-icon">📡</span> Webhooks ({webhooks.length})
        </button>

        <button
          className={`hub-tab-button ${activeTab === "docs" ? "active" : ""}`}
          onClick={() => setActiveTab("docs")}
        >
          <span className="tab-icon">📚</span> API Documentation
        </button>
      </div>

      {/* Main Tab Content */}
      <div className="hub-tab-body">
        {activeTab === "overview" && (
          <OverviewTab
            analytics={analytics}
            apiKeyCount={apiKeys.length}
            webhookCount={webhooks.length}
            onNavigateTab={setActiveTab}
          />
        )}

        {activeTab === "keys" && (
          <ApiKeysTab
            apiKeys={apiKeys}
            departments={departments}
            onRefresh={fetchHubData}
            onDeleteSuccess={handleDeleteKeySuccess}
            addToast={addToast}
            authHeaders={authHeaders}
            apiUrl={API_URL}
          />
        )}

        {activeTab === "analytics" && (
          <UsageAnalyticsTab analytics={analytics} />
        )}

        {activeTab === "logs" && (
          <RequestLogsTab
            authHeaders={authHeaders}
            apiUrl={API_URL}
            addToast={addToast}
          />
        )}

        {activeTab === "webhooks" && (
          <WebhooksTab
            webhooks={webhooks}
            departments={departments}
            onRefresh={fetchHubData}
            addToast={addToast}
            authHeaders={authHeaders}
            apiUrl={API_URL}
          />
        )}

        {activeTab === "docs" && (
          <ApiDocumentationTab addToast={addToast} />
        )}
      </div>
    </div>
  );
}
