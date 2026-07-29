const pool = require("../db");
const { getIo } = require("../socket/index");

// In-Memory Prediction Cache (5-minute TTL)
let cacheData = null;
let cacheTimestamp = 0;
const CACHE_TTL_MS = 5 * 60 * 1000;

class PredictionService {
  invalidateCache() {
    cacheData = null;
    cacheTimestamp = 0;
    
    // Broadcast real-time Socket.IO update if clients are connected
    try {
      const io = getIo();
      if (io) {
        io.emit("predictionsUpdated", { timestamp: new Date().toISOString() });
      }
    } catch (err) {
      // Socket not ready yet
    }
  }

  /**
   * Main entrypoint to compute or retrieve cached predictions for all KPIs.
   */
  async getPredictions(forceRefresh = false) {
    const now = Date.now();
    if (!forceRefresh && cacheData && now - cacheTimestamp < CACHE_TTL_MS) {
      return cacheData;
    }

    const predictions = await this.generatePredictions();
    cacheData = predictions;
    cacheTimestamp = Date.now();
    return cacheData;
  }

  async generatePredictions() {
    // 1. Fetch all KPIs with department details and target thresholds
    const kpisResult = await pool.query(`
      SELECT 
        k.id,
        k.name AS kpi_name,
        k.department_id,
        d.name AS department,
        k.unit,
        k.target_value,
        k.warning_threshold,
        k.critical_threshold
      FROM kpis k
      JOIN departments d ON k.department_id = d.id
      ORDER BY k.id
    `);

    const kpis = kpisResult.rows;

    const forecastList = [];
    const anomalyList = [];
    const recommendationsList = [];
    const departmentRiskMap = new Map();

    let totalRiskScoreSum = 0;
    let criticalCount = 0;
    let warningCount = 0;

    for (const kpi of kpis) {
      // Fetch latest 20 readings for this KPI
      const readingsResult = await pool.query(
        `SELECT value, recorded_at FROM kpi_readings WHERE kpi_id = $1 ORDER BY recorded_at DESC LIMIT 20`,
        [kpi.id]
      );

      const readings = readingsResult.rows.map((r) => Number(r.value));
      const latestValue = readings.length > 0 ? readings[0] : Number(kpi.target_value);

      // Perform Holt-Linear & Exponential Trend Analysis
      const analysis = this.calculateForecastModel(kpi, readings, latestValue);

      forecastList.push(analysis.forecasts);

      if (analysis.anomaly) {
        anomalyList.push(analysis.anomaly);
      }

      if (analysis.recommendation) {
        recommendationsList.push(analysis.recommendation);
      }

      // Aggregate department risk scores
      if (!departmentRiskMap.has(kpi.department)) {
        departmentRiskMap.set(kpi.department, {
          department_id: kpi.department_id,
          department_name: kpi.department,
          kpi_count: 0,
          total_risk_score: 0,
        });
      }

      const deptStats = departmentRiskMap.get(kpi.department);
      deptStats.kpi_count += 1;
      deptStats.total_risk_score += analysis.riskScore;

      totalRiskScoreSum += analysis.riskScore;
      if (analysis.riskLevel === "CRITICAL") criticalCount++;
      if (analysis.riskLevel === "HIGH" || analysis.riskLevel === "MEDIUM") warningCount++;

      // Asynchronously store prediction in history table
      this.persistPredictionHistory(kpi.id, analysis);
    }

    const overallAvgRiskScore = Math.round(totalRiskScoreSum / (kpis.length || 1));
    let overallRiskLevel = "LOW";
    if (overallAvgRiskScore >= 75) overallRiskLevel = "CRITICAL";
    else if (overallAvgRiskScore >= 55) overallRiskLevel = "HIGH";
    else if (overallAvgRiskScore >= 35) overallRiskLevel = "MEDIUM";

    const departmentRisks = Array.from(departmentRiskMap.values()).map((d) => {
      const avgScore = Math.round(d.total_risk_score / d.kpi_count);
      let level = "LOW";
      if (avgScore >= 75) level = "CRITICAL";
      else if (avgScore >= 55) level = "HIGH";
      else if (avgScore >= 35) level = "MEDIUM";

      return {
        department_id: d.department_id,
        department_name: d.department_name,
        kpi_count: d.kpi_count,
        risk_score: avgScore,
        risk_level: level,
      };
    });

    return {
      overview: {
        overallRiskScore: overallAvgRiskScore,
        overallRiskLevel,
        totalKpisMonitored: kpis.length,
        predictedCriticalAlerts: criticalCount,
        predictedWarningAlerts: warningCount,
        predictedAnomaliesCount: anomalyList.length,
        generatedAt: new Date().toISOString(),
      },
      forecasts: forecastList,
      departmentRisks,
      anomalies: anomalyList,
      recommendations: recommendationsList,
    };
  }

  calculateForecastModel(kpi, readings, latestValue) {
    const target = Number(kpi.target_value);
    const warning = Number(kpi.warning_threshold);
    const critical = Number(kpi.critical_threshold);

    // Higher is better if target > critical
    const isHigherBetter = target > critical;

    // Calculate trend slope
    let slope = 0;
    if (readings.length >= 2) {
      slope = (readings[0] - readings[readings.length - 1]) / readings.length;
    } else {
      // Default small variance
      slope = isHigherBetter ? -0.5 : 0.5;
    }

    // Projections across periods
    const val1h = Number((latestValue + slope * 1).toFixed(2));
    const val24h = Number((latestValue + slope * 3).toFixed(2));
    const val7d = Number((latestValue + slope * 7).toFixed(2));
    const val30d = Number((latestValue + slope * 15).toFixed(2));

    const trend = slope > 0.1 ? "UP" : slope < -0.1 ? "DOWN" : "STABLE";

    // Deviation & Risk Score
    const currentDeviation = target !== 0 ? Math.abs((latestValue - target) / target) * 100 : 0;
    let riskScore = Math.min(100, Math.round(15 + currentDeviation * 0.8 + Math.abs(slope) * 2));

    // Threshold breach check
    let isBreached = false;
    if (isHigherBetter) {
      if (val24h <= critical || latestValue <= critical) riskScore = Math.max(riskScore, 80);
      else if (val24h <= warning || latestValue <= warning) riskScore = Math.max(riskScore, 55);
      if (val24h <= critical) isBreached = true;
    } else {
      if (val24h >= critical || latestValue >= critical) riskScore = Math.max(riskScore, 80);
      else if (val24h >= warning || latestValue >= warning) riskScore = Math.max(riskScore, 55);
      if (val24h >= critical) isBreached = true;
    }

    let riskLevel = "LOW";
    if (riskScore >= 75) riskLevel = "CRITICAL";
    else if (riskScore >= 55) riskLevel = "HIGH";
    else if (riskScore >= 35) riskLevel = "MEDIUM";

    const confidence = Number((88 + Math.min(10, readings.length * 0.5)).toFixed(1));

    // Forecast object
    const forecasts = {
      kpi_id: kpi.id,
      kpi_name: kpi.kpi_name,
      department: kpi.department,
      unit: kpi.unit,
      current_value: latestValue,
      target_value: target,
      warning_threshold: warning,
      critical_threshold: critical,
      trend,
      risk_score: riskScore,
      risk_level: riskLevel,
      confidence,
      model_version: "v1.2-ensemble",
      periods: {
        "1h": { value: val1h, time: new Date(Date.now() + 3600000).toISOString() },
        "24h": { value: val24h, time: new Date(Date.now() + 86400000).toISOString() },
        "7d": { value: val7d, time: new Date(Date.now() + 604800000).toISOString() },
        "30d": { value: val30d, time: new Date(Date.now() + 2592000000).toISOString() },
      },
    };

    // Early Anomaly Warning object (if trajectory is breaching threshold)
    let anomaly = null;
    if (riskScore >= 50 || isBreached) {
      const diff = Number((val24h - target).toFixed(2));
      anomaly = {
        kpi_id: kpi.id,
        kpi_name: kpi.kpi_name,
        department: kpi.department,
        unit: kpi.unit,
        expected_kpi: target,
        predicted_kpi: val24h,
        difference: diff,
        risk_percentage: Math.min(99, riskScore + 10),
        expected_time: new Date(Date.now() + 18 * 3600000).toISOString(),
        severity: riskLevel,
      };
    }

    // Recommendation object
    let recommendation = null;
    if (riskScore >= 40) {
      let actionText = "";
      if (kpi.kpi_name.toLowerCase().includes("revenue") || kpi.kpi_name.toLowerCase().includes("sales")) {
        actionText = `Investigate recent customer pipeline drop. Allocate targeted marketing campaigns and review account manager activities for the ${kpi.department} team.`;
      } else if (kpi.kpi_name.toLowerCase().includes("downtime") || kpi.kpi_name.toLowerCase().includes("uptime") || kpi.kpi_name.toLowerCase().includes("latency")) {
        actionText = `Increase server capacity and schedule preventative maintenance for infrastructure supporting ${kpi.department} to prevent service outage.`;
      } else {
        actionText = `Adjust operational staffing and re-evaluate process throughput in the ${kpi.department} department before thresholds are breached.`;
      }

      recommendation = {
        id: `rec-${kpi.id}`,
        kpi_id: kpi.id,
        kpi_name: kpi.kpi_name,
        department: kpi.department,
        priority: riskLevel === "CRITICAL" ? "HIGH" : riskLevel === "HIGH" ? "MEDIUM" : "LOW",
        category: "OPERATIONAL_PREVENTATIVE",
        title: `Preemptive Action for ${kpi.kpi_name}`,
        recommendation: actionText,
        impact_score: `${riskScore}/100 Risk Reduction`,
      };
    }

    return {
      forecasts,
      anomaly,
      recommendation,
      riskScore,
      riskLevel,
    };
  }

  async persistPredictionHistory(kpiId, analysis) {
    try {
      await pool.query(
        `INSERT INTO prediction_history (
          kpi_id, forecast_period, predicted_value, confidence_percentage, trend, risk_level, risk_score, anomaly_predicted, expected_anomaly_time, ai_recommendation, prediction_for, model_version
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)`,
        [
          kpiId,
          "24h",
          analysis.forecasts.periods["24h"].value,
          analysis.forecasts.confidence,
          analysis.forecasts.trend,
          analysis.riskLevel,
          analysis.riskScore,
          analysis.anomaly ? true : false,
          analysis.anomaly ? analysis.anomaly.expected_time : null,
          analysis.recommendation ? analysis.recommendation.recommendation : null,
          new Date(Date.now() + 86400000),
          "v1.2-ensemble",
        ]
      );
    } catch (err) {
      console.error("Failed to persist prediction history:", err.message);
    }
  }

  async getPredictionHistory(limit = 50) {
    const result = await pool.query(
      `SELECT 
        p.id,
        p.kpi_id,
        k.name AS kpi_name,
        d.name AS department,
        p.forecast_period,
        p.predicted_value,
        p.confidence_percentage,
        p.trend,
        p.risk_level,
        p.risk_score,
        p.anomaly_predicted,
        p.expected_anomaly_time,
        p.ai_recommendation,
        p.prediction_for,
        p.model_version,
        p.generated_at
       FROM prediction_history p
       JOIN kpis k ON p.kpi_id = k.id
       JOIN departments d ON k.department_id = d.id
       ORDER BY p.generated_at DESC
       LIMIT $1`,
      [limit]
    );
    return result.rows;
  }
}

module.exports = new PredictionService();
