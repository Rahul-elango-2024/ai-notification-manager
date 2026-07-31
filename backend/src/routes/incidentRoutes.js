const express = require("express");
const router = express.Router();

const {
  createIncident,
  getAllIncidents,
  getIncidentById,
  updateIncident,
  resolveIncident,
  deleteIncident,
} = require("../controllers/incidentController");

// POST /api/incidents - Create a new incident
router.post("/", createIncident);

// GET /api/incidents - Get all incidents with optional filters
router.get("/", getAllIncidents);

// GET /api/incidents/:id - Get single incident with timeline & AI analysis
router.get("/:id", getIncidentById);

// PUT /api/incidents/:id - Update incident status, priority, assignment, or description
router.put("/:id", updateIncident);

// POST or PUT /api/incidents/:id/resolve - Resolve incident
router.post("/:id/resolve", resolveIncident);
router.put("/:id/resolve", resolveIncident);

// DELETE /api/incidents/:id - Delete an incident
router.delete("/:id", deleteIncident);

module.exports = router;

