import axios from "axios";

const API_BASE_URL = "http://localhost:5000/api";

const getAuthHeaders = () => {
  const token = localStorage.getItem("token");
  return token ? { Authorization: `Bearer ${token}` } : {};
};

// 1. Overview KPIs
export async function fetchPredictiveOverview() {
  try {
    const res = await axios.get(`${API_BASE_URL}/predictions/overview`, {
      headers: getAuthHeaders(),
    });
    return res.data;
  } catch (error) {
    console.error("fetchPredictiveOverview Error:", error.message);
    // Fallback data if backend is offline or unauthorized
    return {
      overallRiskScore: 78,
      overallRiskLevel: "HIGH",
      totalKpisMonitored: 24,
      predictedCriticalAlerts: 4,
      predictedWarningAlerts: 7,
      predictedAnomaliesCount: 3,
      systemHealthScore: 91.4,
      aiConfidenceScore: 94.8,
      predictedSlaBreaches: 2,
    };
  }
}

// 2. Forecast Data
export async function fetchPredictiveForecasts() {
  try {
    const res = await axios.get(`${API_BASE_URL}/predictions/forecast`, {
      headers: getAuthHeaders(),
    });
    return res.data;
  } catch (error) {
    console.error("fetchPredictiveForecasts Error:", error.message);
    return [];
  }
}

// 3. Department Risk Matrix
export async function fetchRiskPredictions() {
  try {
    const res = await axios.get(`${API_BASE_URL}/predictions/risk`, {
      headers: getAuthHeaders(),
    });
    return res.data;
  } catch (error) {
    console.error("fetchRiskPredictions Error:", error.message);
    return {
      overallRiskScore: 78,
      overallRiskLevel: "HIGH",
      departmentRisks: [
        { department_name: "Infrastructure", risk_score: 84, risk_level: "CRITICAL", kpi_count: 6 },
        { department_name: "Payments", risk_score: 72, risk_level: "HIGH", kpi_count: 4 },
        { department_name: "Security", risk_score: 45, risk_level: "MEDIUM", kpi_count: 5 },
        { department_name: "Finance", risk_score: 32, risk_level: "LOW", kpi_count: 3 },
        { department_name: "Sales", risk_score: 28, risk_level: "LOW", kpi_count: 3 },
        { department_name: "HR", risk_score: 15, risk_level: "LOW", kpi_count: 3 },
      ],
    };
  }
}

// 4. Anomalies & Insights
export async function fetchAnomalies() {
  try {
    const res = await axios.get(`${API_BASE_URL}/predictions/anomalies`, {
      headers: getAuthHeaders(),
    });
    return res.data;
  } catch (error) {
    console.error("fetchAnomalies Error:", error.message);
    return [];
  }
}

// 5. AI Recommendations
export async function fetchRecommendations() {
  try {
    const res = await axios.get(`${API_BASE_URL}/predictions/recommendations`, {
      headers: getAuthHeaders(),
    });
    return res.data;
  } catch (error) {
    console.error("fetchRecommendations Error:", error.message);
    return [];
  }
}

// 6. Prediction History
export async function fetchPredictionHistory(limit = 50) {
  try {
    const res = await axios.get(`${API_BASE_URL}/predictions/history?limit=${limit}`, {
      headers: getAuthHeaders(),
    });
    return res.data;
  } catch (error) {
    console.error("fetchPredictionHistory Error:", error.message);
    return [];
  }
}
