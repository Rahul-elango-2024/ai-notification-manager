const pool = require("../db");
const { processMonitoring } = require("../services/monitoringService");
const webhookService = require("../services/webhookService");
const { emitEvent } = require("../socket/emitter");

exports.ingestKpiData = async (req, res) => {
  const startTime = Date.now();
  const apiKeyId = req.apiKey ? req.apiKey.id : null;
  const endpoint = req.originalUrl || "/api/v1/kpi-ingest";
  const ipAddress = req.ip || req.headers["x-forwarded-for"] || req.socket.remoteAddress;
  const userAgent = req.headers["user-agent"] || "API-Client";

  let responseStatus = 200;
  let responseBody = {};
  let logStatus = "SUCCESS";

  try {
    const { department, kpi, value, unit, source, timestamp } = req.body;

    // Validation: Required fields
    if (!department || !kpi || value === undefined || value === null || value === "") {
      responseStatus = 400;
      responseBody = {
        error: "Bad Request",
        message: "Missing required fields: department, kpi, and value are mandatory.",
      };
      logStatus = "FAILED";
      await logApiRequest({ apiKeyId, endpoint, payload: req.body, responseStatus, responseBody, latencyMs: Date.now() - startTime, ipAddress, userAgent, status: logStatus });
      return res.status(400).json(responseBody);
    }

    const numericValue = Number(value);
    if (Number.isNaN(numericValue)) {
      responseStatus = 400;
      responseBody = {
        error: "Bad Request",
        message: "Field 'value' must be a valid number.",
      };
      logStatus = "FAILED";
      await logApiRequest({ apiKeyId, endpoint, payload: req.body, responseStatus, responseBody, latencyMs: Date.now() - startTime, ipAddress, userAgent, status: logStatus });
      return res.status(400).json(responseBody);
    }

    // 1. Resolve Department
    let deptResult;
    if (!Number.isNaN(Number(department))) {
      deptResult = await pool.query("SELECT id, name FROM departments WHERE id = $1 LIMIT 1", [Number(department)]);
    } else {
      deptResult = await pool.query("SELECT id, name FROM departments WHERE LOWER(name) = LOWER($1) LIMIT 1", [String(department).trim()]);
    }

    if (deptResult.rows.length === 0) {
      responseStatus = 400;
      responseBody = {
        error: "Bad Request",
        message: `Department '${department}' not found in the system.`,
      };
      logStatus = "FAILED";
      await logApiRequest({ apiKeyId, endpoint, payload: req.body, responseStatus, responseBody, latencyMs: Date.now() - startTime, ipAddress, userAgent, status: logStatus });
      return res.status(400).json(responseBody);
    }

    const deptObj = deptResult.rows[0];

    // 2. Resolve KPI
    let kpiResult;
    if (!Number.isNaN(Number(kpi))) {
      kpiResult = await pool.query("SELECT id, name, unit FROM kpis WHERE id = $1 AND department_id = $2 LIMIT 1", [Number(kpi), deptObj.id]);
    } else {
      kpiResult = await pool.query("SELECT id, name, unit FROM kpis WHERE LOWER(name) = LOWER($1) AND department_id = $2 LIMIT 1", [String(kpi).trim(), deptObj.id]);
    }

    if (kpiResult.rows.length === 0) {
      responseStatus = 400;
      responseBody = {
        error: "Bad Request",
        message: `KPI '${kpi}' not found in department '${deptObj.name}'.`,
      };
      logStatus = "FAILED";
      await logApiRequest({ apiKeyId, endpoint, payload: req.body, responseStatus, responseBody, latencyMs: Date.now() - startTime, ipAddress, userAgent, status: logStatus });
      return res.status(400).json(responseBody);
    }

    const kpiObj = kpiResult.rows[0];
    const recordedAt = timestamp && !Number.isNaN(Date.parse(timestamp)) ? new Date(timestamp) : new Date();
    const ingestSource = source ? String(source).trim() : `API (${req.apiKey.key_name})`;

    const previousReading = await pool.query(
      `SELECT value FROM kpi_readings WHERE kpi_id = $1 ORDER BY recorded_at DESC, id DESC LIMIT 1`,
      [kpiObj.id]
    );

    // 3. Insert Reading into kpi_readings
    const readingResult = await pool.query(
      `INSERT INTO kpi_readings (kpi_id, value, source, recorded_at)
       VALUES ($1, $2, $3, $4)
       RETURNING id, kpi_id, value, source, recorded_at`,
      [kpiObj.id, numericValue, ingestSource, recordedAt]
    );

    const newReading = readingResult.rows[0];

    // 4. Trigger Existing Monitoring Pipeline (Threshold evaluation, AI risk assessment, alert generation, escalation, Socket.IO broadcast)
    let monitoringResults = [];
    try {
      monitoringResults = await processMonitoring();
    } catch (monErr) {
      console.error("Monitoring pipeline execution error:", monErr.message);
    }

    // Determine status of updated KPI
    const updatedKpiStatus = monitoringResults.find((m) => Number(m.id) === Number(kpiObj.id));
    const currentStatus = updatedKpiStatus ? updatedKpiStatus.status : "NORMAL";

    emitEvent("kpiUpdated", {
      kpiId: kpiObj.id,
      kpiName: kpiObj.name,
      currentValue: numericValue,
      previousValue: previousReading.rows[0]?.value ?? null,
      status: currentStatus,
      timestamp: newReading.recorded_at,
      kpi: updatedKpiStatus,
    });

    // 5. Trigger Webhooks for KPI ingest event
    if (currentStatus === "CRITICAL") {
      webhookService.triggerWebhooks("CRITICAL_KPI", {
        department: deptObj.name,
        department_id: deptObj.id,
        kpi: kpiObj.name,
        value: numericValue,
        unit: unit || kpiObj.unit,
        source: ingestSource,
        status: currentStatus,
        timestamp: recordedAt,
      });
    } else if (currentStatus === "WARNING") {
      webhookService.triggerWebhooks("WARNING_KPI", {
        department: deptObj.name,
        department_id: deptObj.id,
        kpi: kpiObj.name,
        value: numericValue,
        unit: unit || kpiObj.unit,
        source: ingestSource,
        status: currentStatus,
        timestamp: recordedAt,
      });
    }

    responseStatus = 201;
    responseBody = {
      success: true,
      message: "KPI data ingested successfully.",
      data: {
        reading_id: newReading.id,
        department: deptObj.name,
        kpi: kpiObj.name,
        value: numericValue,
        unit: unit || kpiObj.unit,
        source: ingestSource,
        status: currentStatus,
        recorded_at: newReading.recorded_at,
      },
    };
    logStatus = "SUCCESS";

    await logApiRequest({ apiKeyId, endpoint, payload: req.body, responseStatus, responseBody, latencyMs: Date.now() - startTime, ipAddress, userAgent, status: logStatus });

    console.log(`✅ Ingest Success via API (${req.apiKey.key_name}): ${kpiObj.name} = ${numericValue}`);
    return res.status(201).json(responseBody);
  } catch (error) {
    console.error("❌ Ingest Controller Error:", error);
    responseStatus = 500;
    responseBody = { error: "Internal Server Error", message: "Failed to process KPI ingestion." };
    logStatus = "FAILED";
    await logApiRequest({ apiKeyId, endpoint, payload: req.body, responseStatus, responseBody, latencyMs: Date.now() - startTime, ipAddress, userAgent, status: logStatus });
    return res.status(500).json(responseBody);
  }
};

async function logApiRequest({ apiKeyId, endpoint, payload, responseStatus, responseBody, latencyMs, ipAddress, userAgent, status }) {
  try {
    await pool.query(
      `INSERT INTO api_request_logs (
        api_key_id, endpoint, payload, response_status, response_body, latency_ms, ip_address, user_agent, status
      ) VALUES ($1, $2, $3::jsonb, $4, $5::jsonb, $6, $7, $8, $9)`,
      [
        apiKeyId,
        endpoint,
        JSON.stringify(payload || {}),
        responseStatus,
        JSON.stringify(responseBody || {}),
        latencyMs,
        ipAddress || "127.0.0.1",
        userAgent || "Client",
        status,
      ]
    );
  } catch (err) {
    console.error("⚠️ Failed to write API request log:", err.message);
  }
}
