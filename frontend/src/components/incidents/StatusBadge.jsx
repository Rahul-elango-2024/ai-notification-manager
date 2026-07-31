import React from "react";

export default function StatusBadge({ status = "OPEN" }) {
  const stat = String(status).toUpperCase();

  const getStatusConfig = (s) => {
    switch (s) {
      case "OPEN":
        return {
          label: "OPEN",
          className: "stat-open",
          dotClass: "dot-open",
        };
      case "IN_PROGRESS":
        return {
          label: "IN PROGRESS",
          className: "stat-in-progress",
          dotClass: "dot-in-progress",
        };
      case "RESOLVED":
        return {
          label: "RESOLVED",
          className: "stat-resolved",
          dotClass: "dot-resolved",
        };
      case "CLOSED":
        return {
          label: "CLOSED",
          className: "stat-closed",
          dotClass: "dot-closed",
        };
      default:
        return {
          label: stat,
          className: "stat-default",
          dotClass: "dot-default",
        };
    }
  };

  const config = getStatusConfig(stat);

  return (
    <span className={`status-pill ${config.className}`}>
      <span className={`status-pulse-dot ${config.dotClass}`} />
      <span className="pill-text">{config.label}</span>
    </span>
  );
}
