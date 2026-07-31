import React, { useState, memo } from "react";

const StartWarRoomModal = memo(function StartWarRoomModal({ isOpen, onClose, onStartWarRoom }) {
  const [incidentTitle, setIncidentTitle] = useState("Payment Gateway Webhook Latency Spike");
  const [department, setDepartment] = useState("Finance");
  const [severity, setSeverity] = useState("CRITICAL");

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (onStartWarRoom) {
      onStartWarRoom({
        title: incidentTitle,
        department,
        severity,
      });
    }
    onClose();
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content start-warroom-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>🚨 Activate Emergency Incident War Room</h2>
          <button className="close-btn" onClick={onClose}>✕</button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            <p className="warroom-intro">
              Activating an Incident War Room notifies all active team members, launches live Socket.IO collaboration stream, and initializes Gemini AI automated root cause monitoring.
            </p>

            <div className="form-group">
              <label className="form-label">Incident Topic / Target Title</label>
              <input
                type="text"
                className="form-input"
                value={incidentTitle}
                onChange={(e) => setIncidentTitle(e.target.value)}
                required
              />
            </div>

            <div className="form-row">
              <div className="form-group flex-1">
                <label className="form-label">Primary Department</label>
                <select className="form-select" value={department} onChange={(e) => setDepartment(e.target.value)}>
                  <option value="Finance">Finance</option>
                  <option value="IT Infrastructure">IT Infrastructure</option>
                  <option value="Security">Security</option>
                  <option value="Customer Support">Customer Support</option>
                  <option value="Operations">Operations</option>
                </select>
              </div>

              <div className="form-group flex-1">
                <label className="form-label">Severity Level</label>
                <select className="form-select" value={severity} onChange={(e) => setSeverity(e.target.value)}>
                  <option value="CRITICAL">Critical (P1)</option>
                  <option value="HIGH">High (P2)</option>
                  <option value="MEDIUM">Medium (P3)</option>
                </select>
              </div>
            </div>
          </div>

          <div className="modal-footer">
            <button type="button" className="secondary-button" onClick={onClose}>Cancel</button>
            <button type="submit" className="danger-button">🚨 Launch Live War Room</button>
          </div>
        </form>
      </div>
    </div>
  );
});

export default StartWarRoomModal;
