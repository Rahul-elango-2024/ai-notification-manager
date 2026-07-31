import React, { memo } from "react";

const PredictiveHeader = memo(function PredictiveHeader({ onRefresh, onOpenReportModal, searchTerm, setSearchTerm }) {
  return (
    <header className="enterprise-header-bar">
      <div className="header-left-block">
        <span className="eyebrow-tag">AIOPS PREDICTIVE ENGINE</span>
        <h1 className="page-title-text">Predictive Analytics</h1>
        <p className="page-subtitle-text">
          Forecasting operational anomalies, KPI degradation trajectory, and AI prescriptive actions.
        </p>
      </div>

      <div className="header-right-block">
        <div className="search-input-wrapper">
          <input
            type="text"
            className="form-input search-field"
            placeholder="Search predictions..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <button className="secondary-button" onClick={onRefresh}>
          Refresh
        </button>

        <button className="primary-button" onClick={onOpenReportModal}>
          Export Report
        </button>
      </div>
    </header>
  );
});

export default PredictiveHeader;
