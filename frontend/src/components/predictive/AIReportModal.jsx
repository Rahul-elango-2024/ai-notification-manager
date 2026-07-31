import React, { memo } from "react";

const AIReportModal = memo(function AIReportModal({ isOpen, onClose }) {
  if (!isOpen) return null;

  const handleExport = (type) => {
    alert(`Exporting Enterprise AI Predictive Analytics Report in ${type} format...`);
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content ai-report-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>📊 Generate Executive AI Intelligence Report</h2>
          <button className="close-btn" onClick={onClose}>✕</button>
        </div>

        <div className="modal-body">
          <p className="report-intro">
            This automated report synthesizes multi-dimensional telemetry, 90-day predictive forecasts, business risk scores, and Gemini recommendations into an executive summary document.
          </p>

          <div className="report-preview-box">
            <h3>📑 Executive Report Contents</h3>
            <ul>
              <li><strong>Section 1:</strong> Executive AI Health & 24h SLA Breach Forecast</li>
              <li><strong>Section 2:</strong> 8-Department Business Risk Heatmap Analysis</li>
              <li><strong>Section 3:</strong> Financial Exposure & Downtime Cost Predictions</li>
              <li><strong>Section 4:</strong> Telemetry Correlation Matrix & Anomaly Diagnostics</li>
              <li><strong>Section 5:</strong> Prescriptive Gemini Mitigation Actions & Timeline</li>
            </ul>
          </div>

          <div className="export-format-options">
            <span className="export-label">Select Export Format:</span>
            <div className="export-btn-group">
              <button className="secondary-button" onClick={() => handleExport("PDF")}>📄 PDF Executive Report</button>
              <button className="secondary-button" onClick={() => handleExport("Excel")}>📊 Excel Telemetry Sheet</button>
              <button className="secondary-button" onClick={() => handleExport("CSV")}>📁 Raw CSV Dataset</button>
            </div>
          </div>
        </div>

        <div className="modal-footer">
          <button className="secondary-button" onClick={onClose}>Cancel</button>
          <button className="primary-button" onClick={() => handleExport("PDF")}>Print / Download Full Report</button>
        </div>
      </div>
    </div>
  );
});

export default AIReportModal;
