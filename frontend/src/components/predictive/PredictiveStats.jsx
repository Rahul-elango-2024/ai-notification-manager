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
  const systemHealth = overview.systemHealthScore || 94.4;
  const predictedIncidents = overview.predictedCriticalAlerts || 4;
  const predictedSlaBreaches = overview.predictedSlaBreaches || 2;
  const businessRisk = overview.overallRiskScore || 78;
  const confidenceScore = overview.aiConfidenceScore || 96.8;

  const animHealth = useAnimatedCounter(Math.floor(systemHealth));
  const animIncidents = useAnimatedCounter(predictedIncidents);
  const animBreaches = useAnimatedCounter(predictedSlaBreaches);
  const animRisk = useAnimatedCounter(businessRisk);
  const animConfidence = useAnimatedCounter(Math.floor(confidenceScore));

  return (
    <div className="incident-stats-grid predictive-stats-grid executive-kpi-6-grid" role="region" aria-label="Executive AI KPI Overview Cards">
      {/* 1. AI Health Score */}
      <div className="inc-stat-card card-resolved accent-emerald glow-emerald">
        <div className="stat-header">
          <span className="stat-label">AI Health Score</span>
          <div className="stat-icon icon-emerald-large">❤️</div>
        </div>
        <div className="stat-value-group">
          <span className="stat-number">{animHealth}.4%</span>
          <span className="stat-trend badge-success">Optimal</span>
        </div>
        <span className="stat-subtext">Health</span>
      </div>

      {/* 2. Predicted Incidents (24h) */}
      <div className="inc-stat-card card-open accent-amber glow-amber">
        <div className="stat-header">
          <span className="stat-label">Incidents</span>
          <div className="stat-icon icon-amber-large">🔮</div>
        </div>
        <div className="stat-value-group">
          <span className="stat-number">{animIncidents}</span>
          <span className="stat-trend badge-urgent">Forecasted</span>
        </div>
        <span className="stat-subtext">24h forecast</span>
      </div>

      {/* 3. Predicted SLA Breaches */}
      <div className="inc-stat-card card-progress accent-purple glow-purple">
        <div className="stat-header">
          <span className="stat-label">SLA Breaches</span>
          <div className="stat-icon icon-purple-large">⚠️</div>
        </div>
        <div className="stat-value-group">
          <span className="stat-number">{animBreaches}</span>
          <span className="stat-trend badge-critical">Attention Needed</span>
        </div>
        <span className="stat-subtext">SLA risk</span>
      </div>

      {/* 4. Predicted Business Risk */}
      <div className="inc-stat-card card-critical accent-red glow-red">
        <div className="stat-header">
          <span className="stat-label">Business Risk</span>
          <div className="stat-icon icon-red-large">🧠</div>
        </div>
        <div className="stat-value-group">
          <span className="stat-number">{animRisk}<small className="stat-unit">/100</small></span>
          <span className="stat-trend badge-urgent">High Exposure</span>
        </div>
        <span className="stat-subtext">Enterprise risk</span>
      </div>

      {/* 5. AI Confidence Score */}
      <div className="inc-stat-card card-total accent-blue glow-blue">
        <div className="stat-header">
          <span className="stat-label">AI Confidence</span>
          <div className="stat-icon icon-blue-large">⚡</div>
        </div>
        <div className="stat-value-group">
          <span className="stat-number">{animConfidence}.8%</span>
          <span className="stat-trend badge-active">Gemini v2.4</span>
        </div>
        <span className="stat-subtext">Confidence</span>
      </div>

      {/* 6. Trend Direction */}
      <div className="inc-stat-card accent-cyan glow-cyan">
        <div className="stat-header">
          <span className="stat-label">Trend Direction</span>
          <div className="stat-icon icon-cyan-large">📈</div>
        </div>
        <div className="stat-value-group">
          <span className="stat-number">STABLE</span>
          <span className="stat-trend badge-success">0.4% MoM</span>
        </div>
        <span className="stat-subtext">7-day trend</span>
      </div>
    </div>
  );
});

export default PredictiveStats;
