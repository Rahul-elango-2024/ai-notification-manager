import React, { useCallback, useEffect, useState } from "react";
import {
  createIncident,
  deleteIncident,
  fetchIncidentById,
  fetchIncidents,
  fetchUsers,
  resolveIncident,
  updateIncident,
} from "../services/incidentApi";

import IncidentCharts from "../components/incidents/IncidentCharts";
import IncidentDetailsDrawer from "../components/incidents/IncidentDetailsDrawer";
import IncidentFormModal from "../components/incidents/IncidentFormModal";
import IncidentStats from "../components/incidents/IncidentStats";
import IncidentTable from "../components/incidents/IncidentTable";
import ResolveIncidentModal from "../components/incidents/ResolveIncidentModal";
import "./IncidentManagement.css";

export default function IncidentManagement() {
  // State
  const [incidents, setIncidents] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);

  // Search & Filters State
  const [headerSearch, setHeaderSearch] = useState("");
  const [filters, setFilters] = useState({
    search: "",
    severity: "",
    status: "",
    category: "",
    assigned_to: "",
    startDate: "",
    endDate: "",
  });

  // Modals & Drawer State
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedIncidentForEdit, setSelectedIncidentForEdit] = useState(null);

  const [isResolveModalOpen, setIsResolveModalOpen] = useState(false);
  const [selectedIncidentForResolve, setSelectedIncidentForResolve] = useState(null);

  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [drawerData, setDrawerData] = useState(null);
  const [drawerLoading, setDrawerLoading] = useState(false);

  // Toast State
  const [toast, setToast] = useState(null);

  const showToast = (type, message, duration = 4000) => {
    setToast({ type, message });
    if (duration > 0) {
      setTimeout(() => {
        setToast(null);
      }, duration);
    }
  };

  // 1. Fetch Users List
  const loadUsers = async () => {
    const userList = await fetchUsers();
    setUsers(userList);
  };

  // 2. Fetch Incidents
  const loadIncidents = useCallback(
    async (isBackgroundRefresh = false) => {
      if (!isBackgroundRefresh) {
        setLoading(true);
      } else {
        setRefreshing(true);
      }
      setError(null);

      try {
        const data = await fetchIncidents({
          status: filters.status,
          priority: filters.severity,
          assigned_to: filters.assigned_to,
        });

        let filteredData = data;
        const activeSearch = (headerSearch || filters.search).trim().toLowerCase();

        if (activeSearch) {
          filteredData = filteredData.filter(
            (i) =>
              (i.title && i.title.toLowerCase().includes(activeSearch)) ||
              (i.incident_number && i.incident_number.toLowerCase().includes(activeSearch)) ||
              (i.description && i.description.toLowerCase().includes(activeSearch))
          );
        }

        if (filters.category) {
          filteredData = filteredData.filter(
            (i) => (i.category || "Infrastructure").toLowerCase() === filters.category.toLowerCase()
          );
        }

        if (filters.startDate) {
          const startMs = new Date(filters.startDate).getTime();
          filteredData = filteredData.filter(
            (i) => new Date(i.created_at).getTime() >= startMs
          );
        }

        if (filters.endDate) {
          const endMs = new Date(filters.endDate).getTime() + 86400000;
          filteredData = filteredData.filter(
            (i) => new Date(i.created_at).getTime() <= endMs
          );
        }

        setIncidents(filteredData);
      } catch (err) {
        console.error("Error loading incidents:", err);
        setError(err.message || "Failed to load incidents from server.");
        if (!isBackgroundRefresh) {
          showToast("error", err.message || "API Error: Failed to fetch incidents");
        }
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [
      filters.status,
      filters.severity,
      filters.assigned_to,
      filters.search,
      filters.category,
      filters.startDate,
      filters.endDate,
      headerSearch,
    ]
  );

  // Initial Load
  useEffect(() => {
    loadUsers();
  }, []);

  useEffect(() => {
    loadIncidents();
  }, [loadIncidents]);

  // Auto-Refresh
  useEffect(() => {
    const interval = setInterval(() => {
      loadIncidents(true);
    }, 15000);

    return () => clearInterval(interval);
  }, [loadIncidents]);

  // Filter Handlers
  const handleFilterChange = (key, value) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  };

  const handleResetFilters = () => {
    setHeaderSearch("");
    setFilters({
      search: "",
      severity: "",
      status: "",
      category: "",
      assigned_to: "",
      startDate: "",
      endDate: "",
    });
  };

  // Drawer Handler
  const handleViewIncident = async (incident) => {
    setIsDrawerOpen(true);
    setDrawerLoading(true);
    setDrawerData(null);

    try {
      const fullDetails = await fetchIncidentById(incident.id);
      setDrawerData(fullDetails);
    } catch (err) {
      console.error("Error fetching single incident drawer details:", err);
      showToast("error", "API Error: Failed to fetch incident details");
      setIsDrawerOpen(false);
    } finally {
      setDrawerLoading(false);
    }
  };

  // Create Handler
  const handleCreateSubmit = async (formData) => {
    showToast("loading", "Creating incident...", 0);
    try {
      await createIncident(formData);
      showToast("success", "Incident created successfully!");
      loadIncidents(true);
    } catch (err) {
      showToast("error", err.message || "API Error: Failed to create incident");
      throw err;
    }
  };

  // Edit Handler
  const handleEditOpen = (incident) => {
    setSelectedIncidentForEdit(incident);
    setIsEditModalOpen(true);
  };

  const handleEditSubmit = async (formData) => {
    if (!selectedIncidentForEdit) return;
    showToast("loading", "Updating incident...", 0);
    try {
      await updateIncident(selectedIncidentForEdit.id, formData);
      showToast("success", "Incident updated successfully!");
      loadIncidents(true);
      if (isDrawerOpen && drawerData?.incident?.id === selectedIncidentForEdit.id) {
        handleViewIncident(selectedIncidentForEdit);
      }
    } catch (err) {
      showToast("error", err.message || "API Error: Failed to update incident");
      throw err;
    }
  };

  // Resolve Handler
  const handleResolveOpen = (incident) => {
    setSelectedIncidentForResolve(incident);
    setIsResolveModalOpen(true);
  };

  const handleResolveSubmit = async (resolveData) => {
    if (!selectedIncidentForResolve) return;
    showToast("loading", "Resolving incident...", 0);

    try {
      await resolveIncident(selectedIncidentForResolve.id, resolveData);
      showToast("success", `Incident #${selectedIncidentForResolve.incident_number || selectedIncidentForResolve.id} resolved!`);
      loadIncidents(true);
      if (isDrawerOpen && drawerData?.incident?.id === selectedIncidentForResolve.id) {
        handleViewIncident(selectedIncidentForResolve);
      }
    } catch (err) {
      showToast("error", err.message || "API Error: Failed to resolve incident");
      throw err;
    }
  };

  // Delete Handler
  const handleDeleteIncident = async (incident) => {
    const confirmDelete = window.confirm(
      `Are you sure you want to delete Incident "${incident.title}" (${incident.incident_number || `#${incident.id}`})?`
    );
    if (!confirmDelete) return;

    showToast("loading", "Deleting incident...", 0);
    try {
      await deleteIncident(incident.id);
      showToast("success", "Incident deleted successfully!");
      loadIncidents(true);
      if (isDrawerOpen && drawerData?.incident?.id === incident.id) {
        setIsDrawerOpen(false);
      }
    } catch (err) {
      showToast("error", err.message || "API Error: Failed to delete incident");
    }
  };

  return (
    <div className="incident-management-page full-width-page">
      {/* Toast Notification Container */}
      {toast && (
        <div className="toast-container">
          <div className={`toast ${toast.type}`}>
            <span className="toast-icon">
              {toast.type === "success" && "✅"}
              {toast.type === "error" && "❌"}
              {toast.type === "loading" && "⏳"}
            </span>
            <span className="toast-message">{toast.message}</span>
          </div>
        </div>
      )}

      {/* ENTERPRISE TOP HEADER BAR */}
      <header className="page-heading incidents-header enterprise-header-bar">
        <div className="header-title-block">
          <span className="eyebrow">ENTERPRISE INCIDENT RESPONSE</span>
          <h1 className="main-title">Incident Management</h1>
          <p className="main-subtitle">
            Monitor critical system anomalies, manage triage timelines, and analyze automated AI root-cause diagnostic telemetry.
          </p>
        </div>

        <div className="header-action-group">
          {/* Header Search Box */}
          <div className="header-search-bar">
            <span className="search-icon">🔍</span>
            <input
              type="text"
              className="header-search-input"
              placeholder="Search incidents..."
              value={headerSearch}
              onChange={(e) => setHeaderSearch(e.target.value)}
            />
          </div>

          <button
            className="secondary-button header-ctrl-btn"
            onClick={() => loadIncidents(true)}
            disabled={refreshing}
          >
            {refreshing ? "↻ Refreshing..." : "↻ Refresh"}
          </button>
          <button
            className="primary-button header-ctrl-btn"
            onClick={() => setIsCreateModalOpen(true)}
          >
            + Create Incident
          </button>
        </div>
      </header>

      {/* ERROR STATE WITH RETRY */}
      {error ? (
        <div className="panel error-panel-box">
          <div className="error-icon">⚠️</div>
          <h3 className="error-title">Unable to Load Incidents</h3>
          <p className="error-msg">{error}</p>
          <button className="primary-button" onClick={() => loadIncidents(false)}>
            ↻ Retry Connection
          </button>
        </div>
      ) : (
        <div className="dashboard-content-flow">
          {/* 1. Top KPI Summary Cards */}
          <IncidentStats incidents={incidents} />

          {/* 2. Diagnostics Dashboard Analytics */}
          <IncidentCharts incidents={incidents} />

          {/* 3. Main Filter Toolbar & Incident Table */}
          <IncidentTable
            incidents={incidents}
            users={users}
            filters={filters}
            onFilterChange={handleFilterChange}
            onResetFilters={handleResetFilters}
            onView={handleViewIncident}
            onEdit={handleEditOpen}
            onResolve={handleResolveOpen}
            onDelete={handleDeleteIncident}
            loading={loading}
          />
        </div>
      )}

      {/* INCIDENT DETAILS DRAWER */}
      <IncidentDetailsDrawer
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        incidentData={drawerData}
        loading={drawerLoading}
      />

      {/* CREATE INCIDENT MODAL */}
      <IncidentFormModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSubmit={handleCreateSubmit}
        users={users}
        isEdit={false}
      />

      {/* EDIT INCIDENT MODAL */}
      <IncidentFormModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        onSubmit={handleEditSubmit}
        initialData={selectedIncidentForEdit}
        users={users}
        isEdit={true}
      />

      {/* RESOLVE INCIDENT MODAL */}
      <ResolveIncidentModal
        isOpen={isResolveModalOpen}
        onClose={() => setIsResolveModalOpen(false)}
        onSubmit={handleResolveSubmit}
        incident={selectedIncidentForResolve}
      />
    </div>
  );
}
