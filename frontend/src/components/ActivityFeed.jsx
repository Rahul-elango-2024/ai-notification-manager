import React, { useMemo, useState } from "react";
import {
  Activity,
  AlertTriangle,
  BarChart3,
  Bell,
  BrainCircuit,
  Database,
  Shield,
} from "lucide-react";

const FILTERS = [
  { key: "all", label: "All" },
  { key: "alerts", label: "Alerts" },
  { key: "incidents", label: "Incidents" },
  { key: "notifications", label: "Notifications" },
  { key: "kpis", label: "KPIs" },
  { key: "ai", label: "AI" },
];

function formatRelativeTime(timestamp) {
  const time = new Date(timestamp).getTime();
  if (Number.isNaN(time)) {
    return "Just now";
  }

  const delta = Math.max(0, Date.now() - time);
  const seconds = Math.floor(delta / 1000);
  if (seconds < 10) return "Just now";
  if (seconds < 60) return `${seconds} seconds ago`;

  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes} minute${minutes === 1 ? "" : "s"} ago`;

  const hours = Math.floor(minutes / 60);
  return `${hours} hour${hours === 1 ? "" : "s"} ago`;
}

function getToneClass(tone = "info") {
  const normalized = String(tone).toLowerCase();
  if (normalized === "success") return "success";
  if (normalized === "warning") return "warning";
  if (normalized === "danger") return "danger";
  if (normalized === "ai") return "ai";
  return "info";
}

function getIcon(category, tone) {
  const normalized = String(category || "").toLowerCase();
  const normalizedTone = getToneClass(tone);

  if (normalized === "kpis") return BarChart3;
  if (normalized === "incidents") return Shield;
  if (normalized === "notifications") return Bell;
  if (normalized === "ai") return BrainCircuit;
  if (normalized === "alerts" && normalizedTone === "danger") return AlertTriangle;
  if (normalized === "alerts") return Activity;
  return Database;
}

export default function ActivityFeed({ events = [], onClear }) {
  const [activeFilter, setActiveFilter] = useState("all");
  const [query, setQuery] = useState("");

  const filteredEvents = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    return events.filter((event) => {
      const filterMatch = activeFilter === "all" || event.category === activeFilter;
      const queryMatch =
        !normalizedQuery ||
        [event.title, event.description, event.status, event.category]
          .filter(Boolean)
          .some((value) => String(value).toLowerCase().includes(normalizedQuery));

      return filterMatch && queryMatch;
    });
  }, [events, activeFilter, query]);

  const counts = useMemo(() => {
    return FILTERS.reduce((acc, filter) => {
      acc[filter.key] = filter.key === "all" ? events.length : events.filter((event) => event.category === filter.key).length;
      return acc;
    }, {});
  }, [events]);

  const clearFeed = () => {
    setActiveFilter("all");
    setQuery("");
    if (onClear) {
      onClear();
    }
  };

  return (
    <section className="panel activity-feed">
      <div className="panel-header activity-feed-header">
        <div>
          <span className="eyebrow">AI LIVE ACTIVITY FEED</span>
          <h2>AI Live Activity Feed</h2>
          <p>Real-time system events and AI processing</p>
        </div>

        <div className="activity-live-pill" aria-label="Live activity feed">
          <span className="live-dot activity-live-dot" />
          LIVE
        </div>
      </div>

      <div className="activity-toolbar">
        <label className="activity-search">
          <span className="sr-only">Search activities</span>
          <input
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search activities..."
          />
        </label>

        <button type="button" className="secondary-button activity-clear-button" onClick={clearFeed}>
          Clear Feed
        </button>
      </div>

      <div className="activity-filter-row" role="tablist" aria-label="Activity filters">
        {FILTERS.map((filter) => (
          <button
            key={filter.key}
            type="button"
            className={`activity-filter-button ${activeFilter === filter.key ? "active" : ""}`}
            onClick={() => setActiveFilter(filter.key)}
          >
            <span>{filter.label}</span>
            <span className="activity-filter-count">{counts[filter.key] || 0}</span>
          </button>
        ))}
      </div>

      {filteredEvents.length === 0 ? (
        <div className="activity-empty-state">
          Activity will appear here once the monitoring engine starts collecting data.
        </div>
      ) : (
        <div className="activity-list">
          {filteredEvents.slice(0, 25).map((event) => {
            const Icon = getIcon(event.category, event.tone);
            const toneClass = getToneClass(event.tone);

            return (
              <article key={event.id} className="activity-item">
                <div className={`activity-icon ${toneClass}`}>
                  <Icon size={16} strokeWidth={2.2} />
                </div>

                <div className="activity-body">
                  <div className="activity-item-top">
                    <strong>{event.title}</strong>
                    <span className={`activity-status ${toneClass}`}>{event.status}</span>
                  </div>
                  <p>{event.description}</p>
                </div>

                <time className="activity-time" dateTime={event.timestamp}>
                  {formatRelativeTime(event.timestamp)}
                </time>
              </article>
            );
          })}
        </div>
      )}
    </section>
  );
}
