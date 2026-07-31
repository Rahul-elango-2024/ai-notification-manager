const incidentModel = require("../models/incidentModel");
const aiIncidentService = require("./aiIncidentService");

/**
 * Service Layer for Incident Management
 * Encapsulates all business logic for incidents, timeline actions, and AI analysis.
 */

/**
 * Create a new incident
 */
const createIncident = async (data) => {
  const { alert_id, title, description, priority, created_by } = data;

  if (!title || typeof title !== "string" || !title.trim()) {
    const error = new Error("Title is required");
    error.statusCode = 400;
    throw error;
  }

  if (!description || typeof description !== "string" || !description.trim()) {
    const error = new Error("Description is required");
    error.statusCode = 400;
    throw error;
  }

  // Generate unique daily incident number (e.g. INC-YYYYMMDD-0001)
  const incident_number = await incidentModel.generateIncidentNumber();

  // Create incident record in database
  const createdIncident = await incidentModel.createIncident({
    incident_number,
    alert_id: alert_id ? parseInt(alert_id, 10) : null,
    title: title.trim(),
    description: description.trim(),
    priority: priority ? priority.toUpperCase() : "HIGH",
    status: "OPEN",
    created_by: created_by ? parseInt(created_by, 10) : null,
  });

  // Automatically create first timeline entry
  await incidentModel.createTimelineEntry({
    incident_id: createdIncident.id,
    action: "Incident Created",
    performed_by: createdIncident.created_by,
    notes: "Incident Created",
  });

  // Automatically generate AI Analysis and store in database
  try {
    const analysisData = await aiIncidentService.generateIncidentAnalysis(
      createdIncident
    );
    await incidentModel.createAiAnalysis({
      incident_id: createdIncident.id,
      ...analysisData,
    });
  } catch (aiErr) {
    console.error("Non-blocking error generating initial AI analysis:", aiErr.message);
  }

  return createdIncident;
};

/**
 * Get all incidents with optional filters (status, priority, assigned_to)
 */
const getAllIncidents = async (filters = {}) => {
  const sanitizedFilters = {};

  if (filters.status) {
    sanitizedFilters.status = String(filters.status).toUpperCase();
  }
  if (filters.priority) {
    sanitizedFilters.priority = String(filters.priority).toUpperCase();
  }
  if (filters.assigned_to) {
    sanitizedFilters.assigned_to = parseInt(filters.assigned_to, 10);
  }

  return await incidentModel.getAllIncidents(sanitizedFilters);
};

/**
 * Get single incident with timeline and AI Analysis in one response
 */
const getIncidentById = async (id) => {
  const incident = await incidentModel.getIncidentById(id);

  if (!incident) {
    return null;
  }

  const timeline = await incidentModel.getTimelineByIncidentId(incident.id);
  let ai_analysis = await incidentModel.getAiAnalysisByIncidentId(incident.id);

  // If AI analysis is missing, generate and store mock analysis
  if (!ai_analysis) {
    try {
      const generated = await aiIncidentService.generateIncidentAnalysis(incident);
      ai_analysis = await incidentModel.createAiAnalysis({
        incident_id: incident.id,
        ...generated,
      });
    } catch (err) {
      console.error("Error generating fallback AI analysis:", err.message);
    }
  }

  return {
    incident,
    timeline,
    ai_analysis: ai_analysis || null,
  };
};

/**
 * Update incident details (status, priority, assigned_to, description)
 * Automatically creates timeline entries whenever a value changes
 */
const updateIncident = async (id, updateData = {}) => {
  const existingIncident = await incidentModel.getIncidentById(id);

  if (!existingIncident) {
    const error = new Error("Incident not found");
    error.statusCode = 404;
    throw error;
  }

  const fieldsToUpdate = {};
  const performedBy = updateData.performed_by
    ? parseInt(updateData.performed_by, 10)
    : null;

  // 1. Check Status Change
  if (
    updateData.status !== undefined &&
    updateData.status !== null &&
    updateData.status.toUpperCase() !== existingIncident.status
  ) {
    const oldStatus = existingIncident.status;
    const newStatus = updateData.status.toUpperCase();
    fieldsToUpdate.status = newStatus;

    if (newStatus === "RESOLVED" || newStatus === "CLOSED") {
      fieldsToUpdate.resolved_at = new Date();
    }

    await incidentModel.createTimelineEntry({
      incident_id: existingIncident.id,
      action: "Status Changed",
      performed_by: performedBy,
      notes: `Status changed from ${oldStatus} to ${newStatus}`,
    });
  }

  // 2. Check Priority Change
  if (
    updateData.priority !== undefined &&
    updateData.priority !== null &&
    updateData.priority.toUpperCase() !== existingIncident.priority
  ) {
    const oldPriority = existingIncident.priority;
    const newPriority = updateData.priority.toUpperCase();
    fieldsToUpdate.priority = newPriority;

    await incidentModel.createTimelineEntry({
      incident_id: existingIncident.id,
      action: "Priority Changed",
      performed_by: performedBy,
      notes: `Priority changed ${oldPriority} -> ${newPriority}`,
    });
  }

  // 3. Check Assignment Change
  if (
    updateData.assigned_to !== undefined &&
    updateData.assigned_to !== existingIncident.assigned_to
  ) {
    const newAssignedTo = updateData.assigned_to
      ? parseInt(updateData.assigned_to, 10)
      : null;
    fieldsToUpdate.assigned_to = newAssignedTo;

    const assignmentNote = newAssignedTo
      ? `Assigned to user ID ${newAssignedTo}`
      : "Assignment removed";

    await incidentModel.createTimelineEntry({
      incident_id: existingIncident.id,
      action: "Assignment Changed",
      performed_by: performedBy,
      notes: assignmentNote,
    });
  }

  // 4. Check Description Change
  if (
    updateData.description !== undefined &&
    updateData.description.trim() !== existingIncident.description
  ) {
    fieldsToUpdate.description = updateData.description.trim();

    await incidentModel.createTimelineEntry({
      incident_id: existingIncident.id,
      action: "Description Updated",
      performed_by: performedBy,
      notes: "Incident description updated",
    });
  }

  // If no fields were modified, return current incident
  if (Object.keys(fieldsToUpdate).length === 0) {
    return existingIncident;
  }

  // Execute update query
  const updatedIncident = await incidentModel.updateIncident(
    existingIncident.id,
    fieldsToUpdate
  );

  return updatedIncident;
};

/**
 * Resolve incident automatically setting status to RESOLVED and resolved_at timestamp
 */
const resolveIncident = async (id, resolveData = {}) => {
  const existingIncident = await incidentModel.getIncidentById(id);

  if (!existingIncident) {
    const error = new Error("Incident not found");
    error.statusCode = 404;
    throw error;
  }

  const performedBy = resolveData.performed_by
    ? parseInt(resolveData.performed_by, 10)
    : null;

  const notes = resolveData.notes ? String(resolveData.notes).trim() : "Incident Resolved";

  // Update status and resolved_at
  const fieldsToUpdate = {
    status: "RESOLVED",
    resolved_at: new Date(),
  };

  const updatedIncident = await incidentModel.updateIncident(
    existingIncident.id,
    fieldsToUpdate
  );

  // Automatically create timeline entry
  await incidentModel.createTimelineEntry({
    incident_id: existingIncident.id,
    action: "Incident Resolved",
    performed_by: performedBy,
    notes: notes,
  });

  return updatedIncident;
};

/**
 * Delete an incident
 */
const deleteIncident = async (id) => {
  const existingIncident = await incidentModel.getIncidentById(id);
  if (!existingIncident) {
    const error = new Error("Incident not found");
    error.statusCode = 404;
    throw error;
  }
  return await incidentModel.deleteIncident(existingIncident.id);
};

module.exports = {
  createIncident,
  getAllIncidents,
  getIncidentById,
  updateIncident,
  resolveIncident,
  deleteIncident,
};

