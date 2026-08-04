import React, { useState, useEffect } from "react";
import { X, Clock, CheckCircle2, XCircle } from "lucide-react";

const SyncHistoryModal = ({ sourceId, onClose }) => {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`http://localhost:5000/api/data-sources/${sourceId}/history`)
      .then(res => res.json())
      .then(data => setHistory(data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [sourceId]);

  return (
    <div className="ds-modal-overlay">
      <div className="ds-modal">
        <div className="ds-modal-header">
          <h2>
            <Clock size={20} style={{ display: "inline", verticalAlign: "middle", marginRight: "8px" }} />
            Sync History
          </h2>
          <button className="ds-modal-close" onClick={onClose}><X size={24} /></button>
        </div>
        
        <div className="ds-modal-body" style={{ padding: "0" }}>
          {loading ? (
            <div style={{ padding: "24px" }}>
               {Array(5).fill(0).map((_, i) => (
                  <div key={i} className="skeleton skeleton-text" style={{ marginBottom: "16px" }}></div>
               ))}
            </div>
          ) : history.length === 0 ? (
            <div className="empty-state" style={{ padding: "48px 24px" }}>
              No sync history available for this source.
            </div>
          ) : (
            <table className="data-table">
              <thead>
                <tr>
                  <th>Status</th>
                  <th>Sync Time</th>
                  <th>Records</th>
                  <th>Duration</th>
                </tr>
              </thead>
              <tbody>
                {history.map(record => (
                  <tr key={record.id}>
                    <td>
                      {record.status === "Connected" || record.status === "Success" ? (
                        <div className="text-success" style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                          <CheckCircle2 size={16} /> Success
                        </div>
                      ) : (
                        <div className="text-danger" style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                          <XCircle size={16} /> {record.status}
                        </div>
                      )}
                      {record.error_message && (
                        <div className="text-danger" style={{ fontSize: "0.75rem", marginTop: "4px" }}>
                          {record.error_message}
                        </div>
                      )}
                    </td>
                    <td>{new Date(record.sync_time).toLocaleString()}</td>
                    <td>{record.records_imported}</td>
                    <td>{record.duration_ms}ms</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
};

export default SyncHistoryModal;
