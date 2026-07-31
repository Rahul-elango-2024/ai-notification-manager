const pool = require("../db");

/**
 * Incident Model
 * Handles all direct database queries for incidents, incident timeline, and AI incident analysis.
 */

/**
 * Generate a unique daily incident number (Format: INC-YYYYMMDD-0001)
 * @returns {Promise<string>}
 */
const generateIncidentNumber = async () => {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, "0");
  const day = String(today.getDate()).padStart(2, "0");
  const dateStr = `${year}${month}${day}`;
  const prefix = `INC-${dateStr}-%`;

  const query = `
    SELECT incident_number 
    FROM incidents 
    WHERE incident_number LIKE $1 
    ORDER BY id DESC 
    LIMIT 1
  `;
  const result = await pool.query(query, [prefix]);

  let sequence = 1;
  if (result.rows.length > 0) {
    const lastNum = result.rows[0].incident_number;
    const parts = lastNum.split("-");
    if (parts.length === 3) {
      const lastSeq = parseInt(parts[2], 10);
      if (!isNaN(lastSeq)) {
        sequence = lastSeq + 1;
      }
    }
  }

  return `INC-${dateStr}-${String(sequence).padStart(4, "0")}`;
};

/**
 * Insert a new incident into PostgreSQL database
 */
const createIncident = async ({
  incident_number,
  alert_id = null,
  title,
  description,
  priority = "HIGH",
  status = "OPEN",
  assigned_to = null,
  created_by = null,
}) => {
  const query = `
    INSERT INTO incidents (
      incident_number,
      alert_id,
      title,
      description,
      priority,
      status,
      assigned_to,
      created_by,
      created_at,
      updated_at
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW(), NOW())
    RETURNING *
  `;
  const values = [
    incident_number,
    alert_id,
    title,
    description,
    priority,
    status,
    assigned_to,
    created_by,
  ];

  const result = await pool.query(query, values);
  return result.rows[0];
};

/**
 * Add a timeline record for an incident
 */
const createTimelineEntry = async ({
  incident_id,
  action,
  performed_by = null,
  notes = null,
}) => {
  const query = `
    INSERT INTO incident_timeline (
      incident_id,
      action,
      performed_by,
      notes,
      created_at
    ) VALUES ($1, $2, $3, $4, NOW())
    RETURNING *
  `;
  const values = [incident_id, action, performed_by, notes];
  const result = await pool.query(query, values);
  return result.rows[0];
};

/**
 * Fetch all timeline entries for a given incident ID
 */
const getTimelineByIncidentId = async (incidentId) => {
  const query = `
    SELECT 
      t.id,
      t.incident_id,
      t.action,
      t.performed_by,
      u.name AS performed_by_name,
      t.notes,
      t.created_at
    FROM incident_timeline t
    LEFT JOIN users u ON t.performed_by = u.id
    WHERE t.incident_id = $1
    ORDER BY t.created_at ASC
  `;
  const result = await pool.query(query, [incidentId]);
  return result.rows;
};

/**
 * Insert or update AI Incident Analysis record
 */
const createAiAnalysis = async ({
  incident_id,
  incident_summary,
  probable_root_cause,
  business_impact,
  recommended_actions,
  estimated_resolution_time,
  recommended_team,
  confidence_score = 95,
}) => {
  const query = `
    INSERT INTO ai_incident_analysis (
      incident_id,
      incident_summary,
      probable_root_cause,
      business_impact,
      recommended_actions,
      estimated_resolution_time,
      recommended_team,
      confidence_score,
      created_at
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW())
    ON CONFLICT (incident_id) DO UPDATE SET
      incident_summary = EXCLUDED.incident_summary,
      probable_root_cause = EXCLUDED.probable_root_cause,
      business_impact = EXCLUDED.business_impact,
      recommended_actions = EXCLUDED.recommended_actions,
      estimated_resolution_time = EXCLUDED.estimated_resolution_time,
      recommended_team = EXCLUDED.recommended_team,
      confidence_score = EXCLUDED.confidence_score
    RETURNING *
  `;
  const values = [
    incident_id,
    incident_summary,
    probable_root_cause,
    business_impact,
    recommended_actions,
    estimated_resolution_time,
    recommended_team,
    confidence_score,
  ];
  const result = await pool.query(query, values);
  return result.rows[0];
};

/**
 * Fetch AI Incident Analysis by incident ID
 */
const getAiAnalysisByIncidentId = async (incidentId) => {
  const query = `
    SELECT * 
    FROM ai_incident_analysis 
    WHERE incident_id = $1 
    LIMIT 1
  `;
  const result = await pool.query(query, [incidentId]);
  return result.rows[0] || null;
};

/**
 * Fetch all incidents with optional filtering (status, priority, assigned_to)
 * Results ordered newest first
 */
const getAllIncidents = async (filters = {}) => {
  const { status, priority, assigned_to } = filters;
  const conditions = [];
  const values = [];

  if (status) {
    values.push(status);
    conditions.push(`i.status = $${values.length}`);
  }

  if (priority) {
    values.push(priority);
    conditions.push(`i.priority = $${values.length}`);
  }

  if (assigned_to) {
    values.push(assigned_to);
    conditions.push(`i.assigned_to = $${values.length}`);
  }

  const whereClause =
    conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";

  const query = `
    SELECT 
      i.*,
      u1.name AS creator_name,
      u1.email AS creator_email,
      u2.name AS assignee_name,
      u2.email AS assignee_email,
      a.message AS alert_message
    FROM incidents i
    LEFT JOIN users u1 ON i.created_by = u1.id
    LEFT JOIN users u2 ON i.assigned_to = u2.id
    LEFT JOIN alerts a ON i.alert_id = a.id
    ${whereClause}
    ORDER BY i.created_at DESC
  `;

  const result = await pool.query(query, values);
  return result.rows;
};

/**
 * Fetch a single incident by ID or Incident Number
 */
const getIncidentById = async (idOrNumber) => {
  const isNumeric = !isNaN(Number(idOrNumber));
  const whereCondition = isNumeric
    ? `i.id = $1 OR i.incident_number = $2`
    : `i.incident_number = $1`;
  const values = isNumeric ? [idOrNumber, idOrNumber] : [idOrNumber];

  const query = `
    SELECT 
      i.*,
      u1.name AS creator_name,
      u1.email AS creator_email,
      u2.name AS assignee_name,
      u2.email AS assignee_email,
      a.message AS alert_message
    FROM incidents i
    LEFT JOIN users u1 ON i.created_by = u1.id
    LEFT JOIN users u2 ON i.assigned_to = u2.id
    LEFT JOIN alerts a ON i.alert_id = a.id
    WHERE ${whereCondition}
    LIMIT 1
  `;

  const result = await pool.query(query, values);
  return result.rows[0] || null;
};

/**
 * Dynamically update incident fields
 */
const updateIncident = async (id, fieldsToUpdate) => {
  const allowedFields = [
    "status",
    "priority",
    "assigned_to",
    "description",
    "resolved_at",
  ];
  const setClauses = ["updated_at = NOW()"];
  const values = [id];

  Object.keys(fieldsToUpdate).forEach((key) => {
    if (allowedFields.includes(key)) {
      values.push(fieldsToUpdate[key]);
      setClauses.push(`${key} = $${values.length}`);
    }
  });

  const query = `
    UPDATE incidents
    SET ${setClauses.join(", ")}
    WHERE id = $1
    RETURNING *
  `;

  const result = await pool.query(query, values);
  return result.rows[0] || null;
};

/**
 * Delete an incident by ID
 */
const deleteIncident = async (id) => {
  // Delete timeline and AI analysis child records first if cascading constraint isn't automatic
  await pool.query("DELETE FROM incident_timeline WHERE incident_id = $1", [id]);
  await pool.query("DELETE FROM ai_incident_analysis WHERE incident_id = $1", [id]);
  const result = await pool.query("DELETE FROM incidents WHERE id = $1 RETURNING *", [id]);
  return result.rows[0] || null;
};

module.exports = {
  generateIncidentNumber,
  createIncident,
  createTimelineEntry,
  getTimelineByIncidentId,
  createAiAnalysis,
  getAiAnalysisByIncidentId,
  getAllIncidents,
  getIncidentById,
  updateIncident,
  deleteIncident,
};

