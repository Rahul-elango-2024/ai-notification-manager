import React, { memo } from "react";

const ExecutiveHeader = memo(function ExecutiveHeader({ onRefresh, onCreateTask }) {
  return (
    <header className="enterprise-header-bar">
      <div className="header-left-block">
        <span className="eyebrow-tag">REAL-TIME AIOPS OPERATIONS</span>
        <h1 className="page-title-text">Executive Collaboration</h1>
        <p className="page-subtitle-text">
          Monitor executive operations, manage incident tasks, and process governance approvals.
        </p>
      </div>

      <div className="header-right-block">
        <button className="secondary-button" onClick={onRefresh}>
          Refresh
        </button>
        <button className="secondary-button" onClick={onCreateTask}>
          Create Task
        </button>
      </div>
    </header>
  );
});

export default ExecutiveHeader;
