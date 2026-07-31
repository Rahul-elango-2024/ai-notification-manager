import React, { useEffect, useState, memo } from "react";

function useAnimatedCounter(targetValue, duration = 800) {
  const [count, setCount] = useState(0);

  useEffect(() => {
    let startTimestamp = null;
    const target = Number(targetValue) || 0;
    const startValue = 0;

    const step = (timestamp) => {
      if (!startTimestamp) startTimestamp = timestamp;
      const progress = Math.min((timestamp - startTimestamp) / duration, 1);
      setCount(Math.floor(progress * (target - startValue) + startValue));
      if (progress < 1) {
        window.requestAnimationFrame(step);
      }
    };

    window.requestAnimationFrame(step);
  }, [targetValue, duration]);

  return count;
}

const PredictiveStats = memo(function PredictiveStats({ overview = {} }) {
  const riskScore = overview.overallRiskScore || 78;
  const predictedIncidents = overview.predictedCriticalAlerts || 4;
  const predictedSlaBreaches = overview.predictedSlaBreaches || 2;
  const systemHealth = overview.systemHealthScore || 91.4;
  const confidenceScore = overview.aiConfidenceScore || 94.8;

  const animRisk = useAnimatedCounter(riskScore);
  const animIncidents = useAnimatedCounter(predictedIncidents);
  const animBreaches = useAnimatedCounter(predictedSlaBreaches);
  const animHealth = useAnimatedCounter(Math.floor(systemHealth));
  const animConfidence = useAnimatedCounter(Math.floor(confidenceScore));

  return (
    <div className="incident-stats-grid predictive-stats-grid" role="region" aria-label="AI Predictive KPI Overview Cards">
      {/* 1. Risk Score Card */}
      <div className="inc-stat-card card-critical accent-red glow-red">
        <div className="stat-header">
          <span className="stat-label">AI Risk Score</span>
          <div className="stat-icon icon-red-large">🧠</div>
        </div>
        <div className="stat-value-group">
          <span className="stat-number">{animRisk}<small className="stat-unit">/100</small></span>
          <span className="stat-trend badge-urgent">High Risk</span>
        </div>
        <span className="stat-subtext">Composite enterprise anomaly score</span>
      </div>

      {/* 2. Predicted Incidents (24h) */}
      <div className="inc-stat-card card-open accent-amber glow-amber">
        <div className="stat-header">
          <span className="stat-label">Predicted Incidents (24h)</span>
          <div className="stat-icon icon-amber-large">🔮</div>
        </div>
        <div className="stat-value-group">
          <span className="stat-number">{animIncidents}</span>
          <span className="stat-trend badge-urgent">Forecasted</span>
        </div>
        <span className="stat-subtext">Expected in next 24 hours</span>
      </div>

      {/* 3. Predicted SLA Breaches */}
      <div className="inc-stat-card card-progress accent-purple glow-purple">
        <div className="stat-header">
          <span className="stat-label">Predicted SLA Breaches</span>
          <div className="stat-icon icon-purple-large">⚠️</div>
        </div>
        <div className="stat-value-group">
          <span className="stat-number">{animBreaches}</span>
          <span className="stat-trend badge-critical">Attention Needed</span>
        </div>
        <span className="stat-subtext">Potential SLA target violations</span>
      </div>

      {/* 4. System Health Score */}
      <div className="inc-stat-card card-resolved accent-emerald glow-emerald">
        <div className="stat-header">
          <span className="stat-label">System Health Score</span>
          <div className="stat-icon icon-emerald-large">❤️</div>
        </div>
        <div className="stat-value-group">
          <span className="stat-number">{animHealth}.4%</span>
          <span className="stat-trend badge-success">Optimal</span>
        </div>
        <span className="stat-subtext">Aggregated telemetry health</span>
      </div>

      {/* 5. AI Model Confidence Score */}
      <div className="inc-stat-card card-total accent-blue glow-blue">
        <div className="stat-header">
          <span className="stat-label">AI Model Confidence</span>
          <div className="stat-icon icon-blue-large">⚡</div>
        </div>
        <div className="stat-value-group">
          <span className="stat-number">{animConfidence}.8%</span>
          <span className="stat-trend badge-active">Ensemble v1.2</span>
        </div>
        <span className="stat-subtext">Statistical forecast accuracy</span>
      </div>
    </div>
  );
});

export default PredictiveStats;
