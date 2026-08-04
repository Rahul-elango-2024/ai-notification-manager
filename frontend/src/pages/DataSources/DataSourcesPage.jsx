import React, { useState, useEffect } from "react";
import { Plus, Database, Server, RefreshCw, Activity, AlertCircle, Clock, DatabaseBackup } from "lucide-react";
import "./DataSources.css";
import AddDataSourceWizard from "./AddDataSourceWizard";
import SyncHistoryModal from "./SyncHistoryModal";

const DataSourcesPage = () => {
  const [sources, setSources] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isAddWizardOpen, setIsAddWizardOpen] = useState(false);
  const [historySourceId, setHistorySourceId] = useState(null);

  const fetchSources = async () => {
    try {
      const response = await fetch("http://localhost:5000/api/data-sources");
      if (response.ok) {
        const data = await response.json();
        setSources(data);
      }
    } catch (err) {
      console.error("Failed to fetch sources", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSources();
    
    // Subscribe to Socket.io events if needed
    // const socket = io("/");
    // socket.on("newMetrics", fetchSources);
    // return () => socket.disconnect();
  }, []);

  const handleSync = async (id) => {
    try {
      await fetch(`http://localhost:5000/api/data-sources/${id}/sync`, { method: "POST" });
      fetchSources();
    } catch (err) {
      console.error(err);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this data source?")) return;
    try {
      await fetch(`http://localhost:5000/api/data-sources/${id}`, { method: "DELETE" });
      fetchSources();
    } catch (err) {
      console.error(err);
    }
  };

  // Summary Metrics
  const connectedCount = sources.filter(s => s.status === "Connected").length;
  const failedCount = sources.filter(s => s.status === "Failed").length;
  const avgResponseTime = sources.length > 0 
    ? Math.round(sources.reduce((acc, curr) => acc + (curr.response_time || 0), 0) / sources.length) 
    : 0;

  return (
    <div className="data-sources-page">
      <div className="data-sources-header">
        <div className="data-sources-header-left">
          <h1>
            <Database size={24} />
            Data Sources
          </h1>
          <p>Manage enterprise integrations and monitor real-time synchronization.</p>
        </div>
        <button className="btn-primary" onClick={() => setIsAddWizardOpen(true)}>
          <Plus size={18} /> Add Data Source
        </button>
      </div>

      <div className="summary-cards-grid">
        <div className="summary-card">
          <span className="summary-card-title">Total Sources</span>
          <span className="summary-card-value">{loading ? "-" : sources.length}</span>
        </div>
        <div className="summary-card">
          <span className="summary-card-title">Connected</span>
          <span className="summary-card-value text-success">{loading ? "-" : connectedCount}</span>
        </div>
        <div className="summary-card">
          <span className="summary-card-title">Failed</span>
          <span className="summary-card-value text-danger">{loading ? "-" : failedCount}</span>
        </div>
        <div className="summary-card">
          <span className="summary-card-title">Avg Response Time</span>
          <span className="summary-card-value">{loading ? "-" : `${avgResponseTime}ms`}</span>
        </div>
      </div>

      <div className="data-sources-list">
        <div className="data-table-wrapper">
          <table className="data-table">
            <thead>
              <tr>
                <th>Name / Type</th>
                <th>Mode</th>
                <th>Status</th>
                <th>Last Sync</th>
                <th>Response</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                Array(3).fill(0).map((_, i) => (
                  <tr key={i}>
                    <td><div className="skeleton skeleton-title"></div></td>
                    <td><div className="skeleton skeleton-text"></div></td>
                    <td><div className="skeleton skeleton-text"></div></td>
                    <td><div className="skeleton skeleton-text"></div></td>
                    <td><div className="skeleton skeleton-text"></div></td>
                    <td><div className="skeleton skeleton-text"></div></td>
                  </tr>
                ))
              ) : sources.length === 0 ? (
                <tr>
                  <td colSpan="6" className="empty-state">
                    <Server size={48} />
                    <p>No data sources configured yet.</p>
                  </td>
                </tr>
              ) : (
                sources.map((source) => (
                  <tr key={source.id}>
                    <td>
                      <div className="ds-name-col">
                        <div className="ds-icon">
                          {source.type.includes("API") ? <Activity size={18} /> : <Database size={18} />}
                        </div>
                        <div>
                          <div style={{ fontWeight: 600 }}>{source.name}</div>
                          <div className="text-secondary" style={{ fontSize: "0.75rem" }}>{source.type}</div>
                        </div>
                      </div>
                    </td>
                    <td>
                      <span className={`badge ${source.connection_mode === 'MOCK' ? 'badge-disconnected' : 'badge-syncing'}`}>
                        {source.connection_mode}
                      </span>
                    </td>
                    <td>
                      <span className={`badge ${source.status === 'Connected' ? 'badge-connected' : source.status === 'Failed' ? 'badge-failed' : 'badge-disconnected'}`}>
                        {source.status}
                      </span>
                    </td>
                    <td>
                      {source.last_sync ? new Date(source.last_sync).toLocaleString() : "Never"}
                      {source.last_error && (
                        <div className="text-danger" style={{ fontSize: "0.75rem", marginTop: "4px" }}>
                          <AlertCircle size={12} style={{ display: "inline", verticalAlign: "middle", marginRight: "4px" }}/>
                          {source.last_error.substring(0, 30)}...
                        </div>
                      )}
                    </td>
                    <td>{source.response_time ? `${source.response_time}ms` : "-"}</td>
                    <td>
                      <div className="action-buttons">
                        <button className="icon-btn" onClick={() => handleSync(source.id)} title="Sync Now">
                          <RefreshCw size={16} />
                        </button>
                        <button className="icon-btn" onClick={() => setHistorySourceId(source.id)} title="View History">
                          <Clock size={16} />
                        </button>
                        <button className="icon-btn danger" onClick={() => handleDelete(source.id)} title="Delete">
                          <DatabaseBackup size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {isAddWizardOpen && (
        <AddDataSourceWizard 
          onClose={() => setIsAddWizardOpen(false)} 
          onSuccess={() => {
            setIsAddWizardOpen(false);
            fetchSources();
          }} 
        />
      )}

      {historySourceId && (
        <SyncHistoryModal 
          sourceId={historySourceId} 
          onClose={() => setHistorySourceId(null)} 
        />
      )}
    </div>
  );
};

export default DataSourcesPage;
