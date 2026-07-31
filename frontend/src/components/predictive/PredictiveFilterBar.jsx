import React, { memo } from "react";

const PredictiveFilterBar = memo(function PredictiveFilterBar({ filters, setFilters }) {
  const handleChange = (key, value) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  };

  return (
    <div className="predictive-filter-bar panel">
      <div className="filter-group">
        <label className="filter-label">Department:</label>
        <select
          className="filter-select"
          value={filters.department || "ALL"}
          onChange={(e) => handleChange("department", e.target.value)}
        >
          <option value="ALL">All Departments (8)</option>
          <option value="Finance">Finance</option>
          <option value="Sales">Sales</option>
          <option value="IT">IT Infrastructure</option>
          <option value="Security">Security</option>
          <option value="Operations">Operations</option>
          <option value="Marketing">Marketing</option>
          <option value="Customer Support">Customer Support</option>
          <option value="HR">HR</option>
        </select>
      </div>

      <div className="filter-group">
        <label className="filter-label">Risk Level:</label>
        <select
          className="filter-select"
          value={filters.riskLevel || "ALL"}
          onChange={(e) => handleChange("riskLevel", e.target.value)}
        >
          <option value="ALL">All Risk Levels</option>
          <option value="CRITICAL">Critical Only</option>
          <option value="HIGH">High & Critical</option>
          <option value="MEDIUM">Medium & Above</option>
          <option value="LOW">Low Risk</option>
        </select>
      </div>

      <div className="filter-group">
        <label className="filter-label">Prediction Window:</label>
        <select
          className="filter-select"
          value={filters.window || "7d"}
          onChange={(e) => handleChange("window", e.target.value)}
        >
          <option value="24h">Next 24 Hours</option>
          <option value="7d">Next 7 Days</option>
          <option value="30d">Next 30 Days</option>
          <option value="90d">Next 90 Days</option>
        </select>
      </div>

      <div className="filter-group">
        <label className="filter-label">Min. AI Confidence:</label>
        <select
          className="filter-select"
          value={filters.minConfidence || "80"}
          onChange={(e) => handleChange("minConfidence", e.target.value)}
        >
          <option value="70">&gt; 70% Confidence</option>
          <option value="80">&gt; 80% Confidence</option>
          <option value="90">&gt; 90% Confidence</option>
          <option value="95">&gt; 95% Confidence</option>
        </select>
      </div>
    </div>
  );
});

export default PredictiveFilterBar;
