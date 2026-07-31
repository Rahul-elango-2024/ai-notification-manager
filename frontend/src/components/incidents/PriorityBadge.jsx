import React from "react";

export default function PriorityBadge({ priority = "MEDIUM" }) {
  const prio = String(priority).toUpperCase();

  const getPriorityConfig = (p) => {
    switch (p) {
      case "CRITICAL":
        return {
          label: "CRITICAL",
          className: "prio-critical",
          icon: "🔥",
        };
      case "HIGH":
        return {
          label: "HIGH",
          className: "prio-high",
          icon: "⚡",
        };
      case "MEDIUM":
        return {
          label: "MEDIUM",
          className: "prio-medium",
          icon: "⚠️",
        };
      case "LOW":
      default:
        return {
          label: "LOW",
          className: "prio-low",
          icon: "🔹",
        };
    }
  };

  const config = getPriorityConfig(prio);

  return (
    <span className={`priority-badge ${config.className}`}>
      <span className="badge-icon">{config.icon}</span>
      <span className="badge-text">{config.label}</span>
    </span>
  );
}
