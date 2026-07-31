/**
 * AI Incident Analysis Service
 * Service layer responsible for AI-driven incident analysis.
 * Currently uses mock analysis generator, structured so that it can be seamlessly
 * replaced by Google Gemini AI without modifying controllers or other services.
 */

/**
 * Generate AI Analysis for an Incident
 * @param {Object} incidentData - Object containing incident title, description, priority, etc.
 * @returns {Promise<Object>} Object matching the AI incident analysis schema
 */
const generateIncidentAnalysis = async (incidentData = {}) => {
  const title = incidentData.title || "System Anomaly";
  const description = incidentData.description || "Unusual system behavior observed.";
  const priority = incidentData.priority || "HIGH";

  return {
    incident_summary: `Automated AI analysis detected potential operational anomaly for "${title}". Description: ${description}`,
    probable_root_cause: `High resource utilization, database query bottleneck, or connection pool exhaustion under ${priority} priority load.`,
    business_impact: `Moderate to high degradation in application latency, API responsiveness, and active user workflows.`,
    recommended_actions: `1. Inspect database query execution logs and active connection counts.\n2. Scale backend worker instances or restart database pool connection.\n3. Verify notification delivery pipelines.`,
    estimated_resolution_time: priority === "CRITICAL" ? "30 minutes" : priority === "HIGH" ? "45 minutes" : "60 minutes",
    recommended_team: priority === "CRITICAL" ? "Site Reliability Engineering (SRE) & Incident Commander" : "DevOps & Database Engineering",
    confidence_score: 95,
  };
};

module.exports = {
  generateIncidentAnalysis,
};
