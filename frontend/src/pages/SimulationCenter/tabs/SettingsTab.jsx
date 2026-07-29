import React, { useState } from "react";

export default function SettingsTab({ status, authHeaders, apiUrl, addToast, onRefresh }) {
  const [speed, setSpeed] = useState(status?.speedSeconds || 10);
  const [randomEvents, setRandomEvents] = useState(status?.randomEventsEnabled ?? true);
  const [saving, setSaving] = useState(false);

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);

    try {
      const res = await fetch(`${apiUrl}/api/simulation/settings`, {
        method: "POST",
        headers: authHeaders(),
        body: JSON.stringify({
          speedSeconds: Number(speed),
          randomEventsEnabled: Boolean(randomEvents),
        }),
      });

      if (!res.ok) throw new Error("Failed to update simulation settings.");

      addToast("Simulation settings updated successfully!", "success");
      onRefresh();
    } catch (err) {
      addToast(err.message, "error");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="tab-content settings-tab">
      <div className="panel">
        <div className="panel-header">
          <div>
            <h2>Simulation Engine Global Settings</h2>
            <p>Configure background timer frequency and stochastic event triggers.</p>
          </div>
        </div>

        <form onSubmit={handleSave} className="settings-form">
          <div className="form-group">
            <label>Default Simulation Speed (Cycle Frequency)</label>
            <select
              className="filter-select"
              value={speed}
              onChange={(e) => setSpeed(Number(e.target.value))}
            >
              <option value={5}>5 Seconds (Fast Testing)</option>
              <option value={10}>10 Seconds (Standard)</option>
              <option value={30}>30 Seconds (Moderate)</option>
              <option value={60}>1 Minute (Enterprise Pace)</option>
              <option value={300}>5 Minutes (Real-time Pace)</option>
            </select>
          </div>

          <div className="form-group checkbox-group">
            <label className="checkbox-label">
              <input
                type="checkbox"
                checked={randomEvents}
                onChange={(e) => setRandomEvents(e.target.checked)}
              />
              <span>Enable Bounded Random Operational Events (Server Outage, Network Lag, Hardware Failure)</span>
            </label>
          </div>

          <div className="form-actions">
            <button type="submit" className="primary-button blue" disabled={saving}>
              {saving ? "Saving..." : "Save Settings"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
