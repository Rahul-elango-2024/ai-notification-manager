// ==========================================
// AI NOTIFICATION MANAGER
// AI ANALYSIS SERVICE
// ==========================================

function generateAIAnalysis(kpiData, severity) {
  const {
    kpi_name,
    department,
    current_value,
    target_value,
    warning_threshold,
    critical_threshold,
    unit,
  } = kpiData;

  // Convert database decimal/string values into numbers
  const currentValue = Number(current_value);
  const targetValue = Number(target_value);
  const warningThreshold = Number(warning_threshold);
  const criticalThreshold = Number(critical_threshold);

  // ==========================================
  // CALCULATE DEVIATION
  // ==========================================

  let deviationPercentage = 0;

  if (targetValue !== 0) {
    deviationPercentage =
      ((currentValue - targetValue) / Math.abs(targetValue)) * 100;
  }

  deviationPercentage = Number(
    deviationPercentage.toFixed(2)
  );

  const absoluteDeviation = Math.abs(deviationPercentage);

  let deviationDirection = "at target";

  if (deviationPercentage < 0) {
    deviationDirection = "below target";
  } else if (deviationPercentage > 0) {
    deviationDirection = "above target";
  }

  const deviationText =
    deviationPercentage === 0
      ? "At target"
      : `${absoluteDeviation}% ${deviationDirection}`;

  // ==========================================
  // CALCULATE RISK SCORE
  // ==========================================

  let riskScore = 0;

  if (severity === "CRITICAL") {
    riskScore = Math.min(
      100,
      Math.round(75 + absoluteDeviation * 0.5)
    );
  } else if (severity === "WARNING") {
    riskScore = Math.min(
      74,
      Math.round(45 + absoluteDeviation * 0.4)
    );
  } else {
    riskScore = Math.min(
      44,
      Math.round(10 + absoluteDeviation * 0.2)
    );
  }

  // Ensure sensible minimum scores
  if (severity === "CRITICAL") {
    riskScore = Math.max(riskScore, 75);
  }

  if (severity === "WARNING") {
    riskScore = Math.max(riskScore, 45);
  }

  // ==========================================
  // DETERMINE RISK LEVEL
  // ==========================================

  let riskLevel = "LOW";

  if (riskScore >= 75) {
    riskLevel = "HIGH";
  } else if (riskScore >= 45) {
    riskLevel = "MEDIUM";
  }

  // ==========================================
  // GENERATE AI CONTENT
  // ==========================================

  let analysis = "";
  let impactSummary = "";
  let recommendation = "";
  let possibleCauses = [];
  let recommendedActions = [];

  // ==========================================
  // CRITICAL ANALYSIS
  // ==========================================

  if (severity === "CRITICAL") {
    analysis =
      `${kpi_name} in the ${department} department has reached a critical level. ` +
      `The current value is ${currentValue} ${unit}, compared with the target of ${targetValue} ${unit}. ` +
      `The KPI is currently ${deviationText}. Immediate attention is required.`;

    impactSummary =
      `${kpi_name} has moved significantly outside its expected operating range. ` +
      `The current deviation is ${deviationText}, creating a high-risk condition for the ${department} department. ` +
      `If this condition continues, it may negatively affect departmental performance and related business objectives.`;

    recommendation =
      `Review the latest operational data and identify the cause of the deviation. ` +
      `The ${department} team should take immediate corrective action and continue monitoring this KPI.`;

    possibleCauses = [
      `Unexpected changes in ${department} performance`,
      "Operational delays or process inefficiencies",
      "Recent changes in business activity or demand",
      "Data source or reporting inconsistencies",
      "External factors affecting KPI performance",
    ];

    recommendedActions = [
      `Immediately investigate the latest ${department} data`,
      `Identify the primary cause of the ${absoluteDeviation}% deviation`,
      "Assign responsibility to the appropriate team or manager",
      "Implement immediate corrective measures",
      "Monitor the KPI closely until performance returns to the expected range",
    ];
  }

  // ==========================================
  // WARNING ANALYSIS
  // ==========================================

  else if (severity === "WARNING") {
    analysis =
      `${kpi_name} in the ${department} department has entered the warning range. ` +
      `The current value is ${currentValue} ${unit}, while the target is ${targetValue} ${unit}. ` +
      `The KPI is currently ${deviationText}.`;

    impactSummary =
      `${kpi_name} is showing a noticeable deviation from its expected target. ` +
      `Although the situation is not yet critical, continued movement in the current direction could create operational or business risk.`;

    recommendation =
      `Monitor this KPI closely and investigate recent changes that may have caused the deviation. ` +
      `Preventive action is recommended before the KPI reaches a critical level.`;

    possibleCauses = [
      `Recent changes in ${department} operations`,
      "Temporary performance fluctuations",
      "Increasing workload or resource constraints",
      "Changes in demand or business activity",
      "Possible data reporting delays",
    ];

    recommendedActions = [
      `Review recent ${department} performance trends`,
      "Identify any unusual operational changes",
      "Take preventive action where necessary",
      "Increase the monitoring frequency for this KPI",
      "Prepare corrective action if the KPI moves into the critical range",
    ];
  }

  // ==========================================
  // NORMAL ANALYSIS
  // ==========================================

  else {
    analysis =
      `${kpi_name} is currently operating within the expected range. ` +
      `The current value is ${currentValue} ${unit}, compared with the target of ${targetValue} ${unit}.`;

    impactSummary =
      `${kpi_name} is currently stable and does not indicate an immediate operational risk.`;

    recommendation =
      `Continue monitoring the KPI and maintain the current operational strategy.`;

    possibleCauses = [];

    recommendedActions = [
      "Continue regular KPI monitoring",
      "Maintain the current operational strategy",
    ];
  }

  // ==========================================
  // CREATE ALERT TIMELINE
  // ==========================================

  const generatedAt = new Date().toISOString();

  const timeline = [
    {
      step: 1,
      event: "KPI Reading Received",
      status: "COMPLETED",
      timestamp: generatedAt,
    },
    {
      step: 2,
      event: `${severity} Condition Detected`,
      status: "COMPLETED",
      timestamp: generatedAt,
    },
    {
      step: 3,
      event: "AI Impact Analysis Completed",
      status: "COMPLETED",
      timestamp: generatedAt,
    },
    {
      step: 4,
      event: "Notification Routing Initiated",
      status: "IN_PROGRESS",
      timestamp: generatedAt,
    },
    {
      step: 5,
      event: "Pending Resolution",
      status: "PENDING",
      timestamp: null,
    },
  ];

  // ==========================================
  // RETURN COMPLETE AI ANALYSIS
  // ==========================================

  return {
    summary: `${severity} condition detected for ${kpi_name}`,

    analysis,

    impactSummary,

    recommendation,

    possibleCauses,

    recommendedActions,

    riskScore,

    riskLevel,

    deviationPercentage,

    deviationDirection,

    deviationText,

    severity,

    metrics: {
      currentValue,
      targetValue,
      warningThreshold,
      criticalThreshold,
      unit,
    },

    timeline,

    generatedAt,
  };
}

module.exports = {
  generateAIAnalysis,
};