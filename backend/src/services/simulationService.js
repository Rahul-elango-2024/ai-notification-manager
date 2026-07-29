const pool = require("../db");
const monitoringService = require("./monitoringService");
const { getIo } = require("../socket/index");

// Pre-configured Scenario Specifications
const SCENARIO_DEFS = {
  NORMAL: {
    id: "NORMAL",
    name: "Normal Operations",
    description: "Healthy KPI baselines with small natural noise (±1.5%) and minimal alert activity.",
    targetRisk: "LOW",
  },
  REVENUE_DROP: {
    id: "REVENUE_DROP",
    name: "Revenue Drop",
    description: "Sales Revenue gradually decreases, Customer Response Time increases, and Campaign Conversion drops.",
    targetRisk: "HIGH",
  },
  SYSTEM_FAILURE: {
    id: "SYSTEM_FAILURE",
    name: "System Failure",
    description: "System Downtime spikes rapidly, Response Time degrades, and Operational Efficiency plummets.",
    targetRisk: "CRITICAL",
  },
  HIGH_TRAFFIC: {
    id: "HIGH_TRAFFIC",
    name: "High Traffic Spike",
    description: "Sales Revenue and traffic surge, straining infrastructure and response times.",
    targetRisk: "MEDIUM",
  },
  MARKETING_CAMPAIGN: {
    id: "MARKETING_CAMPAIGN",
    name: "Marketing Campaign Surge",
    description: "Conversion rates and sales revenue jump while expenses experience a minor increase.",
    targetRisk: "LOW",
  },
  RECOVERY: {
    id: "RECOVERY",
    name: "Recovery Mode",
    description: "KPIs gradually converge back to healthy baseline target levels; active alerts auto-resolve.",
    targetRisk: "LOW",
  },
};

// Random Operational Events
const RANDOM_EVENTS = [
  { name: "Server Capacity Degraded", impactKpi: "System Downtime", delta: 12 },
  { name: "Network Congestion", impactKpi: "Customer Response Time", delta: 8 },
  { name: "Flash Promotion Spike", impactKpi: "Sales Revenue", delta: 50000 },
  { name: "Cloud Infrastructure Auto-Scale", impactKpi: "Operational Efficiency", delta: 4 },
];

class SimulationService {
  constructor() {
    this.status = "STOPPED"; // "RUNNING" | "PAUSED" | "STOPPED"
    this.currentScenario = "NORMAL";
    this.speedSeconds = 10; // Default 10s
    this.timer = null;
    this.startTime = null;
    this.elapsedSeconds = 0;
    this.readingsGeneratedCount = 0;
    this.alertsGeneratedCount = 0;
    this.maxRiskScore = 0;
    this.randomEventsEnabled = true;

    // In-memory simulation state for smooth gradual trends
    this.kpiSimState = new Map();
  }

  getStatus() {
    return {
      status: this.status,
      currentScenario: this.currentScenario,
      scenarioName: SCENARIO_DEFS[this.currentScenario]?.name || "Normal Operations",
      speedSeconds: this.speedSeconds,
      elapsedSeconds: this.elapsedSeconds,
      readingsGeneratedCount: this.readingsGeneratedCount,
      alertsGeneratedCount: this.alertsGeneratedCount,
      maxRiskScore: this.maxRiskScore,
      randomEventsEnabled: this.randomEventsEnabled,
      startTime: this.startTime ? this.startTime.toISOString() : null,
      nextTickCountdownSeconds: this.timer ? this.speedSeconds : 0,
    };
  }

  getScenarios() {
    return Object.values(SCENARIO_DEFS);
  }

  async start(scenarioId = "NORMAL", speedSeconds = 10) {
    if (!SCENARIO_DEFS[scenarioId]) {
      throw new Error(`Invalid scenario: ${scenarioId}`);
    }

    this.stopInternal();

    this.currentScenario = scenarioId;
    this.speedSeconds = Number(speedSeconds) || 10;
    this.status = "RUNNING";
    this.startTime = new Date();
    this.elapsedSeconds = 0;
    this.readingsGeneratedCount = 0;
    this.alertsGeneratedCount = 0;
    this.maxRiskScore = 0;

    await this.initializeSimState();
    this.scheduleNextTick();

    return this.getStatus();
  }

  pause() {
    if (this.status !== "RUNNING") return this.getStatus();
    this.status = "PAUSED";
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
    return this.getStatus();
  }

  resume() {
    if (this.status !== "PAUSED") return this.getStatus();
    this.status = "RUNNING";
    this.scheduleNextTick();
    return this.getStatus();
  }

  async stop() {
    this.stopInternal();
    this.status = "STOPPED";

    // Record simulation run in history table
    await this.recordHistoryRecord();

    return this.getStatus();
  }

  stopInternal() {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
  }

  async reset() {
    this.stopInternal();
    this.status = "STOPPED";
    this.elapsedSeconds = 0;
    this.readingsGeneratedCount = 0;
    this.alertsGeneratedCount = 0;
    this.maxRiskScore = 0;
    await this.initializeSimState();

    // Re-run monitoring service to evaluate baselines
    await monitoringService.processMonitoring();

    return this.getStatus();
  }

  scheduleNextTick() {
    this.stopInternal();
    this.timer = setInterval(async () => {
      if (this.status === "RUNNING") {
        this.elapsedSeconds += this.speedSeconds;
        await this.executeSimulationCycle();
      }
    }, this.speedSeconds * 1000);
  }

  async initializeSimState() {
    const kpisRes = await pool.query(`SELECT id, name, target_value FROM kpis`);
    for (const k of kpisRes.rows) {
      this.kpiSimState.set(k.id, Number(k.target_value));
    }
  }

  async executeSimulationCycle() {
    try {
      const kpisRes = await pool.query(`
        SELECT k.id, k.name, k.target_value, k.warning_threshold, k.critical_threshold
        FROM kpis k
      `);

      for (const kpi of kpisRes.rows) {
        const kpiId = kpi.id;
        const currentVal = this.kpiSimState.get(kpiId) ?? Number(kpi.target_value);

        // Compute next bounded stochastic step based on scenario
        const newVal = this.calculateNextValue(kpi, currentVal);
        this.kpiSimState.set(kpiId, newVal);

        // Feed generated value directly into kpi_readings table
        await pool.query(
          `INSERT INTO kpi_readings (kpi_id, value, source) VALUES ($1, $2, $3)`,
          [kpiId, newVal, `Simulator (${SCENARIO_DEFS[this.currentScenario].name})`]
        );

        this.readingsGeneratedCount++;
      }

      // Execute EXISTING monitoring pipeline (threshold checks, alerts, AI, emails, predictive cache)
      const monitoringData = await monitoringService.processMonitoring();

      // Track risk score & alert counts
      let activeAlerts = 0;
      let highestRisk = 0;

      for (const k of monitoringData) {
        if (k.status === "CRITICAL") {
          activeAlerts++;
          highestRisk = Math.max(highestRisk, 85);
        } else if (k.status === "WARNING") {
          activeAlerts++;
          highestRisk = Math.max(highestRisk, 55);
        }
      }

      this.alertsGeneratedCount += activeAlerts;
      this.maxRiskScore = Math.max(this.maxRiskScore, highestRisk);

      // Socket.IO Broadcast to connected clients
      try {
        const io = getIo();
        if (io) {
          io.emit("simulationTick", {
            status: this.getStatus(),
            monitoringData,
            timestamp: new Date().toISOString(),
          });
        }
      } catch (err) {
        // Socket offline
      }
    } catch (err) {
      console.error("Simulation Cycle Error:", err.message);
    }
  }

  calculateNextValue(kpi, currentVal) {
    const kpiName = kpi.name.toLowerCase();
    const target = Number(kpi.target_value);
    const scenario = this.currentScenario;

    let noisePercent = (Math.random() - 0.5) * 0.02; // ±1% natural noise
    let drift = 0;

    // Apply Scenario Models
    if (scenario === "NORMAL") {
      // Small mean-reverting drift toward target
      drift = (target - currentVal) * 0.05;
    } else if (scenario === "REVENUE_DROP") {
      if (kpiName.includes("revenue")) drift = -target * 0.025;
      else if (kpiName.includes("response")) drift = 1.5;
      else if (kpiName.includes("conversion")) drift = -0.3;
    } else if (scenario === "SYSTEM_FAILURE") {
      if (kpiName.includes("downtime")) drift = 12.0;
      else if (kpiName.includes("response")) drift = 4.0;
      else if (kpiName.includes("efficiency")) drift = -3.5;
    } else if (scenario === "HIGH_TRAFFIC") {
      if (kpiName.includes("revenue")) drift = target * 0.03;
      else if (kpiName.includes("response")) drift = 2.5;
      else if (kpiName.includes("downtime")) drift = 4.0;
    } else if (scenario === "MARKETING_CAMPAIGN") {
      if (kpiName.includes("revenue")) drift = target * 0.04;
      else if (kpiName.includes("conversion")) drift = 0.8;
      else if (kpiName.includes("expenses")) drift = target * 0.015;
    } else if (scenario === "RECOVERY") {
      drift = (target - currentVal) * 0.15;
    }

    // Occasional Random Operational Event (10% chance per cycle)
    if (this.randomEventsEnabled && Math.random() < 0.1) {
      const randomEv = RANDOM_EVENTS[Math.floor(Math.random() * RANDOM_EVENTS.length)];
      if (kpiName.includes(randomEv.impactKpi.toLowerCase())) {
        drift += randomEv.delta;
      }
    }

    let calculated = currentVal + drift + currentVal * noisePercent;

    // Enforce realistic bounds
    if (kpiName.includes("efficiency")) calculated = Math.max(30, Math.min(100, calculated));
    if (kpiName.includes("conversion")) calculated = Math.max(0.5, Math.min(40, calculated));
    if (kpiName.includes("downtime")) calculated = Math.max(0, calculated);
    if (kpiName.includes("response")) calculated = Math.max(1, calculated);
    if (kpiName.includes("revenue") || kpiName.includes("expenses")) calculated = Math.max(0, calculated);

    return Number(calculated.toFixed(2));
  }

  async recordHistoryRecord() {
    try {
      const duration = this.startTime ? Math.round((Date.now() - this.startTime.getTime()) / 1000) : 0;
      await pool.query(
        `INSERT INTO simulation_history (
          scenario_name, status, start_time, end_time, duration_seconds, readings_generated_count, alerts_generated_count, max_risk_score, settings_snapshot
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
        [
          SCENARIO_DEFS[this.currentScenario]?.name || this.currentScenario,
          this.status,
          this.startTime || new Date(),
          new Date(),
          duration,
          this.readingsGeneratedCount,
          this.alertsGeneratedCount,
          this.maxRiskScore,
          JSON.stringify({ speedSeconds: this.speedSeconds, randomEventsEnabled: this.randomEventsEnabled }),
        ]
      );
    } catch (err) {
      console.error("Failed to record simulation history:", err.message);
    }
  }

  async getHistory(limit = 50) {
    const res = await pool.query(
      `SELECT * FROM simulation_history ORDER BY created_at DESC LIMIT $1`,
      [limit]
    );
    return res.rows;
  }
}

module.exports = new SimulationService();
