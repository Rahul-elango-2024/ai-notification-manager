import React, { useCallback, useEffect, useState } from "react";
import { executiveApi } from "../../services/executiveApi";

import ExecutiveHeader from "../../components/executive/ExecutiveHeader";
import ExecutiveKpis from "../../components/executive/ExecutiveKpis";
import PredictiveOverviewSection from "../../components/predictive/PredictiveOverviewSection";
import TaskKanbanBoard from "../../components/executive/TaskKanbanBoard";
import ApprovalTable from "../../components/executive/ApprovalTable";
import ExecutiveAIAssistant from "../../components/executive/ExecutiveAIAssistant";
import ActivityFeed from "../../components/executive/ActivityFeed";
import ExecutiveDetailDrawer from "../../components/executive/ExecutiveDetailDrawer";
import CreateTaskModal from "../../components/executive/CreateTaskModal";


import "./ExecutiveCollaborationPage.css";

export default function ExecutiveCollaborationPage() {
  const [overview, setOverview] = useState({});
  const [tasks, setTasks] = useState([]);
  const [approvals, setApprovals] = useState([]);
  const [activityFeed, setActivityFeed] = useState([]);
  const [loading, setLoading] = useState(true);

  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);


  const [drawerData, setDrawerData] = useState(null);
  const [drawerType, setDrawerType] = useState(null);

  const loadExecutiveData = useCallback(async () => {
    try {
      const [ovData, taskData, appData, feedData] = await Promise.all([
        executiveApi.getOverview(),
        executiveApi.getTasks(),
        executiveApi.getApprovals(),
        executiveApi.getActivityFeed(),
      ]);

      setOverview(ovData || {});
      setTasks(taskData || []);
      setApprovals(appData || []);
      setActivityFeed(feedData || []);
    } catch (err) {
      console.error("Error fetching Executive Collaboration telemetry:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadExecutiveData();
    const interval = setInterval(loadExecutiveData, 30000);
    return () => clearInterval(interval);
  }, [loadExecutiveData]);

  // Handlers
  const handleCreateTask = async (newTask) => {
    try {
      const created = await executiveApi.createTask(newTask);
      setTasks((prev) => [created, ...prev]);
    } catch (err) {
      console.error("Error creating task:", err);
    }
  };

  const handleTaskStateTransition = async (id, newStatus) => {
    try {
      setTasks((prev) => prev.map((t) => (t.id === id ? { ...t, status: newStatus } : t)));
      await executiveApi.updateTask(id, { status: newStatus });
    } catch (err) {
      console.error("Error transitioning task status:", err);
    }
  };

  const handleActOnApproval = async (id, actionStatus) => {
    try {
      const currentUserName = authService.getCurrentUser().fullName;
      setApprovals((prev) =>
        prev.map((a) => (a.id === id ? { ...a, status: actionStatus, approver_name: currentUserName } : a))
      );
      await executiveApi.actOnApproval(id, { status: actionStatus, approver_name: currentUserName });
    } catch (err) {
      console.error("Error acting on approval:", err);
    }
  };

  const handleOpenDrawer = (data, type) => {
    setDrawerData(data);
    setDrawerType(type);
  };

  return (
    <div className="executive-collaboration-page full-width-page">
      {/* 1. Header Bar */}
      <ExecutiveHeader
        onRefresh={loadExecutiveData}
        onCreateTask={() => setIsTaskModalOpen(true)}
      />

      {loading ? (
        <div className="skeleton-container">
          <div className="skeleton-row-4" />
          <div className="skeleton-box" />
        </div>
      ) : (
        <div className="dashboard-layout-flow">
          {/* 2. Top Summary Sparkline KPI Cards (4 Cards ONLY) */}
          <ExecutiveKpis overview={overview} />

          {/* 3. Main Operations Split Grid (70% / 30%) */}
          <div className="main-content-split-70-30">
            {/* Left Column (70%) */}
            <div className="left-70-col-flow">
              {/* Operations Overview: Incident Trend (7 Days) + AI Risk Heatmap */}
              <PredictiveOverviewSection />

              {/* Response Tasks: Jira/Linear Kanban Board */}
              <TaskKanbanBoard
                tasks={tasks}
                onTaskMove={handleTaskStateTransition}
                onOpenTaskDetail={(t) => handleOpenDrawer(t, "TASK")}
              />

              {/* Pending Approval Table */}
              <ApprovalTable
                approvals={approvals}
                onActOnApproval={handleActOnApproval}
                onOpenApprovalDetail={(appr) => handleOpenDrawer(appr, "APPROVAL")}
              />
            </div>

            {/* Right Column (30%) */}
            <div className="right-30-col-flow">
              {/* Gemini Executive AI Assistant */}
              <ExecutiveAIAssistant />

              {/* Live Activity Feed */}
              <ActivityFeed feed={activityFeed} />
            </div>
          </div>
        </div>
      )}

      {/* Slide-Out Detail Drawer */}
      <ExecutiveDetailDrawer
        isOpen={Boolean(drawerData)}
        onClose={() => setDrawerData(null)}
        data={drawerData}
        type={drawerType}
        onTaskStateTransition={handleTaskStateTransition}
        onActOnApproval={handleActOnApproval}
      />

      {/* Modals */}
      <CreateTaskModal
        isOpen={isTaskModalOpen}
        onClose={() => setIsTaskModalOpen(false)}
        onCreateTask={handleCreateTask}
      />

    </div>
  );
}
