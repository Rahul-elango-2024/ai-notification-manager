import React, { memo } from "react";

const PredictiveRecommendations = memo(function PredictiveRecommendations({ recommendations = [], onOpenDetails }) {
  const defaultRecommendations = [
    {
      id: "rec-1",
      title: "Scale PostgreSQL Connection Pool & Reindex Telemetry",
      recommendation: "Increase database pool size limit from 100 to 250 connections and execute background index creation on high-cardinality foreign keys.",
      priority: "HIGH",
      confidence: 96.4,
      estimatedSavings: "$14,200",
      resolutionTime: "15 mins",
      affectedServices: "Database, Ingestion Pipeline",
    },
    {
      id: "rec-2",
      title: "Enable Circuit Breaker on API Gateway Ingestion",
      recommendation: "Configure automatic rate-limiting and fallback queuing on incoming webhook ingestion endpoints to prevent memory starvation during spikes.",
      priority: "HIGH",
      confidence: 94.1,
      estimatedSavings: "$28,500",
      resolutionTime: "10 mins",
      affectedServices: "API Gateway, Webhook Listener",
    },
    {
      id: "rec-3",
      title: "Flush Stale Keys & Scale Redis Node Replica",
      recommendation: "Execute proactive TTL audit on Redis session keys and add a secondary read replica to distribute caching load during peak billing hours.",
      priority: "MEDIUM",
      confidence: 89.2,
      estimatedSavings: "$8,400",
      resolutionTime: "20 mins",
      affectedServices: "Redis Cache, User Auth",
    },
    {
      id: "rec-4",
      title: "Pre-scale Worker Replicas for Payment Webhook API",
      recommendation: "Scale worker pod replicas from 4 to 12 prior to 14:00 EST daily peak traffic surge.",
      priority: "CRITICAL",
      confidence: 98.1,
      estimatedSavings: "$42,000",
      resolutionTime: "5 mins",
      affectedServices: "Payment Gateway, Billing Ingest",
    },
    {
      id: "rec-5",
      title: "Reallocate Tier-2 Customer Support Engineers",
      recommendation: "Reassign 3 support engineers to high-priority enterprise queue to maintain CSAT target above 4.8.",
      priority: "MEDIUM",
      confidence: 86.5,
      estimatedSavings: "$5,200",
      resolutionTime: "30 mins",
      affectedServices: "Support Queue, CSAT Engine",
    },
  ];

  const recs = recommendations.length > 0 ? recommendations : defaultRecommendations;

  return (
    <div className="panel predictive-recs-panel" role="region" aria-label="AI Automated Mitigation Recommendations">
      <div className="panel-header">
        <div>
          <h2>💡 AI Recommendations</h2>
          <p>Priority actions.</p>
        </div>
      </div>

      <div className="recommendations-list">
        {recs.slice(0, 5).map((rec) => (
          <div key={rec.id} className={`recommendation-item priority-${(rec.priority || "HIGH").toLowerCase()}`}>
            <div className="rec-header">
              <div className="rec-title-block">
                <span className={`priority-badge prio-${(rec.priority || "HIGH").toLowerCase()}`}>
                  {rec.priority || "HIGH"}
                </span>
                <h4 className="rec-title">{rec.title}</h4>
              </div>
              <span className="rec-confidence-pill">🎯 {rec.confidence || 94}% Confidence</span>
            </div>

            <div className="rec-card-btn-row">
              <button
                className="secondary-button icon-btn"
                onClick={() => onOpenDetails && onOpenDetails(rec)}
              >
                📄 Details
              </button>
              <button
                className="primary-button icon-btn"
                onClick={() => alert(`Executing Automated Mitigation: ${rec.title}`)}
              >
                ⚡ Execute Action
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
});

export default PredictiveRecommendations;
