import React, { useState, useMemo, memo } from "react";
import PriorityBadge from "./PriorityBadge";
import StatusBadge from "./StatusBadge";

const IncidentTable = memo(function IncidentTable({
  incidents = [],
  users = [],
  filters = {
    search: "",
    severity: "",
    status: "",
    category: "",
    assigned_to: "",
    startDate: "",
    endDate: "",
  },
  onFilterChange,
  onResetFilters,
  onView,
  onEdit,
  onResolve,
  onDelete,
  loading = false,
}) {
  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [copiedId, setCopiedId] = useState(null);

  const formatDate = (dateStr) => {
    if (!dateStr) return "-";
    return new Date(dateStr).toLocaleString(undefined, {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // Pagination calculations
  const totalIncidents = incidents.length;
  const totalPages = Math.ceil(totalIncidents / pageSize) || 1;
  const safePage = Math.min(currentPage, totalPages);

  const paginatedIncidents = useMemo(() => {
    const startIndex = (safePage - 1) * pageSize;
    return incidents.slice(startIndex, startIndex + pageSize);
  }, [incidents, safePage, pageSize]);

  const startIndexDisplay = totalIncidents > 0 ? (safePage - 1) * pageSize + 1 : 0;
  const endIndexDisplay = Math.min(safePage * pageSize, totalIncidents);

  // Copy ID helper
  const handleCopyId = (idText, incId) => {
    navigator.clipboard.writeText(idText);
    setCopiedId(incId);
    setTimeout(() => {
      setCopiedId(null);
    }, 2000);
  };

  // Export to CSV helper
  const handleExportCSV = () => {
    if (incidents.length === 0) {
      alert("No incidents to export.");
      return;
    }

    const headers = ["Incident Number", "Title", "Severity", "Status", "Category", "Assignee", "Created At"];
    const rows = incidents.map((inc) => [
      `"${inc.incident_number || inc.id}"`,
      `"${(inc.title || "").replace(/"/g, '""')}"`,
      `"${inc.severity || inc.priority || ""}"`,
      `"${inc.status || ""}"`,
      `"${inc.category || "Infrastructure"}"`,
      `"${inc.assignee_name || (inc.assigned_to ? `User #${inc.assigned_to}` : "Unassigned")}"`,
      `"${inc.created_at ? new Date(inc.created_at).toISOString() : ""}"`,
    ]);

    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map((e) => e.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `enterprise_incidents_export_${new Date().toISOString().split("T")[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="panel table-panel" role="region" aria-label="Incident Management Data Table & Filters">
      {/* ENTERPRISE FILTER & EXPORT TOOLBAR */}
      <div className="enterprise-filter-toolbar" role="toolbar" aria-label="Incident Search & Filtering Toolbar">
        {/* Search */}
        <div className="toolbar-input-group search-toolbar-group">
          <span className="toolbar-icon">🔍</span>
          <input
            type="text"
            className="toolbar-input"
            placeholder="Search title, ID or details..."
            value={filters.search || ""}
            onChange={(e) => {
              onFilterChange("search", e.target.value);
              setCurrentPage(1);
            }}
            aria-label="Search Incidents"
          />
        </div>

        {/* Severity */}
        <div className="toolbar-input-group">
          <select
            className="toolbar-select"
            value={filters.severity || ""}
            onChange={(e) => {
              onFilterChange("severity", e.target.value);
              setCurrentPage(1);
            }}
            aria-label="Filter Severity"
          >
            <option value="">All Severities</option>
            <option value="CRITICAL">Critical</option>
            <option value="HIGH">High</option>
            <option value="MEDIUM">Medium</option>
            <option value="LOW">Low</option>
          </select>
        </div>

        {/* Status */}
        <div className="toolbar-input-group">
          <select
            className="toolbar-select"
            value={filters.status || ""}
            onChange={(e) => {
              onFilterChange("status", e.target.value);
              setCurrentPage(1);
            }}
            aria-label="Filter Status"
          >
            <option value="">All Statuses</option>
            <option value="OPEN">Open</option>
            <option value="IN_PROGRESS">In Progress</option>
            <option value="RESOLVED">Resolved</option>
            <option value="CLOSED">Closed</option>
          </select>
        </div>

        {/* Category */}
        <div className="toolbar-input-group">
          <select
            className="toolbar-select"
            value={filters.category || ""}
            onChange={(e) => {
              onFilterChange("category", e.target.value);
              setCurrentPage(1);
            }}
            aria-label="Filter Category"
          >
            <option value="">All Categories</option>
            <option value="Infrastructure">Infrastructure</option>
            <option value="Database">Database</option>
            <option value="Network">Network</option>
            <option value="Application">Application</option>
            <option value="Security">Security</option>
            <option value="API">API Integration</option>
          </select>
        </div>

        {/* Assignee */}
        <div className="toolbar-input-group">
          <select
            className="toolbar-select"
            value={filters.assigned_to || ""}
            onChange={(e) => {
              onFilterChange("assigned_to", e.target.value);
              setCurrentPage(1);
            }}
            aria-label="Filter Assignee"
          >
            <option value="">All Assignees</option>
            {users.map((u) => (
              <option key={u.id} value={u.id}>
                {u.name}
              </option>
            ))}
          </select>
        </div>

        {/* From Date */}
        <div className="toolbar-input-group date-toolbar-group">
          <span className="toolbar-date-label">From:</span>
          <input
            type="date"
            className="toolbar-date-input"
            value={filters.startDate || ""}
            onChange={(e) => {
              onFilterChange("startDate", e.target.value);
              setCurrentPage(1);
            }}
            aria-label="Filter From Date"
          />
        </div>

        {/* To Date */}
        <div className="toolbar-input-group date-toolbar-group">
          <span className="toolbar-date-label">To:</span>
          <input
            type="date"
            className="toolbar-date-input"
            value={filters.endDate || ""}
            onChange={(e) => {
              onFilterChange("endDate", e.target.value);
              setCurrentPage(1);
            }}
            aria-label="Filter To Date"
          />
        </div>

        {/* Reset / Clear All Button */}
        <button
          className="toolbar-reset-button"
          onClick={() => {
            onResetFilters();
            setCurrentPage(1);
          }}
          title="Reset all active filters"
        >
          ↻ Clear All
        </button>

        {/* Export CSV Button */}
        <button
          className="toolbar-export-button"
          onClick={handleExportCSV}
          title="Export current incidents to CSV file"
        >
          📥 Export CSV
        </button>
      </div>

      {/* TABLE DATA */}
      {loading ? (
        <div className="table-loading-skeleton">
          {[1, 2, 3, 4, 5].map((idx) => (
            <div key={idx} className="skeleton-row">
              <div className="skeleton-cell short" />
              <div className="skeleton-cell long" />
              <div className="skeleton-cell medium" />
              <div className="skeleton-cell medium" />
              <div className="skeleton-cell short" />
            </div>
          ))}
        </div>
      ) : incidents.length === 0 ? (
        <div className="empty-state-card">
          <div className="empty-icon">🛡️</div>
          <h3>No Incidents Found</h3>
          <p>No incidents match the active search or filter criteria.</p>
          <button className="secondary-button" onClick={onResetFilters}>
            Reset Filters
          </button>
        </div>
      ) : (
        <>
          <div className="data-table-wrapper sticky-table-wrapper">
            <table className="data-table enterprise-incident-table">
              <thead>
                <tr>
                  <th>Incident ID</th>
                  <th>Title</th>
                  <th>Severity</th>
                  <th>Status</th>
                  <th>Category</th>
                  <th>Assigned Engineer</th>
                  <th>Created Time</th>
                  <th>Last Updated</th>
                  <th style={{ textAlign: "right" }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {paginatedIncidents.map((inc) => {
                  const isResolved = inc.status === "RESOLVED" || inc.status === "CLOSED";
                  const idText = inc.incident_number || `#${inc.id}`;

                  return (
                    <tr key={inc.id} className="incident-row clickable-row" onClick={(e) => {
                      if (e.target.closest('.copy-id-btn') || e.target.closest('.action-btn')) return;
                      onView(inc);
                    }}>
                      <td>
                        <div className="id-badge-cell">
                          <span className="incident-number-tag">{idText}</span>
                          <button
                            className="copy-id-btn"
                            onClick={() => handleCopyId(idText, inc.id)}
                            title="Copy Incident ID"
                          >
                            {copiedId === inc.id ? "✓ Copied" : "📋 Copy"}
                          </button>
                        </div>
                      </td>
                      <td>
                        <div className="title-cell-wrapper">
                          <strong className="incident-title-text">{inc.title}</strong>
                          {inc.description && (
                            <span className="incident-desc-snippet">{inc.description}</span>
                          )}
                        </div>
                      </td>
                      <td>
                        <PriorityBadge priority={inc.severity || inc.priority} />
                      </td>
                      <td>
                        <StatusBadge status={inc.status} />
                      </td>
                      <td>
                        <span className="category-tag">{inc.category || "Infrastructure"}</span>
                      </td>
                      <td>
                        <span className="assignee-text">
                          👤 {inc.assignee_name || (inc.assigned_to ? `User #${inc.assigned_to}` : "Unassigned")}
                        </span>
                      </td>
                      <td>
                        <span className="timestamp-text">{formatDate(inc.created_at)}</span>
                      </td>
                      <td>
                        <span className="timestamp-text">{formatDate(inc.updated_at)}</span>
                      </td>
                      <td style={{ textAlign: "right", paddingRight: "16px" }}>
                        <div className="action-button-group">
                          <button
                            className="action-btn btn-edit"
                            onClick={() => onEdit(inc)}
                            title="Edit Incident"
                          >
                            ✏️ Edit
                          </button>
                          {!isResolved && (
                            <button
                              className="action-btn btn-resolve"
                              onClick={() => onResolve(inc)}
                              title="Resolve Incident"
                            >
                              ✅ Resolve
                            </button>
                          )}
                          <button
                            className="action-btn btn-delete"
                            onClick={() => onDelete(inc)}
                            title="Delete Incident"
                          >
                            🗑️ Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* TABLE PAGINATION FOOTER */}
          <div className="enterprise-pagination-footer">
            <div className="pagination-info">
              Showing <strong>{startIndexDisplay}</strong>–<strong>{endIndexDisplay}</strong> of <strong>{totalIncidents}</strong> incidents
            </div>

            <div className="pagination-controls">
              <div className="rows-per-page-select">
                <span>Rows per page:</span>
                <select
                  value={pageSize}
                  onChange={(e) => {
                    setPageSize(Number(e.target.value));
                    setCurrentPage(1);
                  }}
                  className="toolbar-select small-select"
                  aria-label="Select rows per page"
                >
                  <option value={5}>5</option>
                  <option value={10}>10</option>
                  <option value={20}>20</option>
                  <option value={50}>50</option>
                </select>
              </div>

              <div className="page-nav-group">
                <button
                  className="page-nav-btn"
                  onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
                  disabled={safePage <= 1}
                  title="Previous Page"
                >
                  ◀ Prev
                </button>
                <span className="page-indicator-text">
                  Page <strong>{safePage}</strong> of <strong>{totalPages}</strong>
                </span>
                <button
                  className="page-nav-btn"
                  onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
                  disabled={safePage >= totalPages}
                  title="Next Page"
                >
                  Next ▶
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
});

export default IncidentTable;
