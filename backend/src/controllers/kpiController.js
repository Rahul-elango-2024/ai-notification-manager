const pool = require("../db");
const { emitEvent } = require("../socket/emitter");

exports.getAllKpis = async (req, res) => {
  try {
    const result = await pool.query(`
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
      JOIN departments d
        ON k.department_id = d.id
      ORDER BY k.id
    `);

    res.json(result.rows);
  } catch (error) {
    console.error("Error fetching KPIs:", error);

    res.status(500).json({
      error: "Failed to fetch KPI data",
    });
  }
};

exports.addKpiReading = async (req, res) => {
  try {
    const kpiId = req.params.id;
    const { value, source } = req.body;

    if (value === undefined || value === null || value === "") {
      return res.status(400).json({ error: "value is required" });
    }

    const numericValue = Number(value);

    if (Number.isNaN(numericValue)) {
      return res.status(400).json({ error: "value must be a valid number" });
    }

    // Check that the KPI exists.
    const kpiResult = await pool.query(
      `SELECT id, name, unit FROM kpis WHERE id = $1 LIMIT 1`,
      [kpiId]
    );

    if (kpiResult.rows.length === 0) {
      return res.status(404).json({ error: "KPI not found" });
    }

    const previousReading = await pool.query(
      `SELECT value FROM kpi_readings WHERE kpi_id = $1 ORDER BY recorded_at DESC, id DESC LIMIT 1`,
      [kpiId]
    );

    const result = await pool.query(
      `
      INSERT INTO kpi_readings (kpi_id, value, source)
      VALUES ($1, $2, $3)
      RETURNING *
      `,
      [kpiId, numericValue, source || "Manual API Entry"]
    );

    console.log(`New KPI reading added: ${kpiResult.rows[0].name} = ${numericValue}`);

    // Immediately execute threshold evaluation, alert generation/resolution, and Socket.IO broadcast
    const monitoringService = require("../services/monitoringService");
    const updatedMonitoring = await monitoringService.processMonitoring();
    const updatedKpi = updatedMonitoring ? updatedMonitoring.find((k) => String(k.id) === String(kpiId)) : null;

    emitEvent("kpiUpdated", {
      kpiId: Number(kpiId),
      kpiName: kpiResult.rows[0].name,
      currentValue: numericValue,
      previousValue: previousReading.rows[0]?.value ?? null,
      status: updatedKpi?.status || "NORMAL",
      timestamp: result.rows[0].recorded_at,
      kpi: updatedKpi,
    });

    res.status(201).json({
      success: true,
      message: "KPI value updated successfully",
      reading: result.rows[0],
      kpi: updatedKpi,
    });
  } catch (error) {
    console.error("Error adding KPI reading:", error);
    res.status(500).json({ error: "Failed to add KPI reading" });
  }
};
