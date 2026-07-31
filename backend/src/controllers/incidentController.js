const incidentService = require("../services/incidentService");

/**
 * Incident Controller
 * Handles HTTP requests and delegates business logic to Incident Service.
 */

/**
 * Create a new incident
 * POST /api/incidents
 */
const createIncident = async (req, res) => {
  try {
    const { alert_id, title, description, priority, created_by } = req.body;

    // Validation
    if (!title || typeof title !== "string" || !title.trim()) {
      return res.status(400).json({
        error: "Validation Error",
        message: "Field 'title' is required.",
      });
    }

    if (!description || typeof description !== "string" || !description.trim()) {
      return res.status(400).json({
        error: "Validation Error",
        message: "Field 'description' is required.",
      });
    }

    const incident = await incidentService.createIncident({
      alert_id,
      title,
      description,
      priority,
      created_by: created_by || (req.user ? req.user.id : null),
    });

    return res.status(201).json({
      message: "Incident created successfully",
      incident,
    });
  } catch (error) {
    console.error("Error in createIncident controller:", error);
    if (error.statusCode) {
      return res.status(error.statusCode).json({ error: error.message });
    }
    return res.status(500).json({
      error: "Internal Server Error",
      message: "Failed to create incident.",
    });
  }
};

/**
 * Get all incidents with optional filters (status, priority, assigned_to)
 * GET /api/incidents
 */
const getAllIncidents = async (req, res) => {
  try {
    const { status, priority, assigned_to } = req.query;

    const incidents = await incidentService.getAllIncidents({
      status,
      priority,
      assigned_to,
    });

    return res.status(200).json(incidents);
  } catch (error) {
    console.error("Error in getAllIncidents controller:", error);
    return res.status(500).json({
      error: "Internal Server Error",
      message: "Failed to fetch incidents.",
    });
  }
};

/**
 * Get single incident details, timeline, and AI analysis in one response
 * GET /api/incidents/:id
 */
const getIncidentById = async (req, res) => {
  try {
    const { id } = req.params;

    if (!id) {
      return res.status(400).json({
        error: "Validation Error",
        message: "Incident ID or Incident Number is required.",
      });
    }

    const result = await incidentService.getIncidentById(id);

    if (!result) {
      return res.status(404).json({
        error: "Not Found",
        message: `Incident '${id}' not found.`,
      });
    }

    return res.status(200).json(result);
  } catch (error) {
    console.error("Error in getIncidentById controller:", error);
    return res.status(500).json({
      error: "Internal Server Error",
      message: "Failed to fetch incident details.",
    });
  }
};

/**
 * Update incident details (status, priority, assigned_to, description)
 * PUT /api/incidents/:id
 */
const updateIncident = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, priority, assigned_to, description, performed_by } = req.body;

    const updatedIncident = await incidentService.updateIncident(id, {
      status,
      priority,
      assigned_to,
      description,
      performed_by: performed_by || (req.user ? req.user.id : null),
    });

    return res.status(200).json({
      message: "Incident updated successfully",
      incident: updatedIncident,
    });
  } catch (error) {
    console.error("Error in updateIncident controller:", error);
    if (error.statusCode) {
      return res.status(error.statusCode).json({
        error: error.statusCode === 404 ? "Not Found" : "Validation Error",
        message: error.message,
      });
    }
    return res.status(500).json({
      error: "Internal Server Error",
      message: "Failed to update incident.",
    });
  }
};

/**
 * Resolve an incident
 * PUT /api/incidents/:id/resolve
 */
const resolveIncident = async (req, res) => {
  try {
    const { id } = req.params;
    const { notes, performed_by } = req.body || {};

    const resolvedIncident = await incidentService.resolveIncident(id, {
      notes,
      performed_by: performed_by || (req.user ? req.user.id : null),
    });

    return res.status(200).json({
      message: "Incident resolved successfully",
      incident: resolvedIncident,
    });
  } catch (error) {
    console.error("Error in resolveIncident controller:", error);
    if (error.statusCode) {
      return res.status(error.statusCode).json({
        error: error.statusCode === 404 ? "Not Found" : "Validation Error",
        message: error.message,
      });
    }
    return res.status(500).json({
      error: "Internal Server Error",
      message: "Failed to resolve incident.",
    });
  }
};

/**
 * Delete an incident
 * DELETE /api/incidents/:id
 */
const deleteIncident = async (req, res) => {
  try {
    const { id } = req.params;

    const deletedIncident = await incidentService.deleteIncident(id);

    return res.status(200).json({
      message: "Incident deleted successfully",
      incident: deletedIncident,
    });
  } catch (error) {
    console.error("Error in deleteIncident controller:", error);
    if (error.statusCode) {
      return res.status(error.statusCode).json({
        error: error.statusCode === 404 ? "Not Found" : "Error",
        message: error.message,
      });
    }
    return res.status(500).json({
      error: "Internal Server Error",
      message: "Failed to delete incident.",
    });
  }
};

module.exports = {
  createIncident,
  getAllIncidents,
  getIncidentById,
  updateIncident,
  resolveIncident,
  deleteIncident,
};

