import React, { useState, memo } from "react";

const CreateTaskModal = memo(function CreateTaskModal({ isOpen, onClose, onCreateTask }) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState("HIGH");
  const [ownerName, setOwnerName] = useState("");
  const [department, setDepartment] = useState("IT Infrastructure");
  const [dueDate, setDueDate] = useState("Today, 18:00");

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!title.trim()) return;
    if (onCreateTask) {
      onCreateTask({
        title,
        description,
        priority,
        owner_name: ownerName || "Alex Rivera",
        department,
        due_date: dueDate,
        status: "Pending",
        is_ai_generated: false,
      });
    }
    onClose();
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content create-task-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>➕ Create Executive / Incident Task</h2>
          <button className="close-btn" onClick={onClose}>✕</button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            <div className="form-group">
              <label className="form-label">Task Title *</label>
              <input
                type="text"
                className="form-input"
                placeholder="e.g. Scale Payment Webhook Pod Replicas"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Description</label>
              <textarea
                className="form-textarea"
                rows="3"
                placeholder="Detailed task description..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>

            <div className="form-row">
              <div className="form-group flex-1">
                <label className="form-label">Priority</label>
                <select className="form-select" value={priority} onChange={(e) => setPriority(e.target.value)}>
                  <option value="CRITICAL">Critical</option>
                  <option value="HIGH">High</option>
                  <option value="MEDIUM">Medium</option>
                  <option value="LOW">Low</option>
                </select>
              </div>

              <div className="form-group flex-1">
                <label className="form-label">Department</label>
                <select className="form-select" value={department} onChange={(e) => setDepartment(e.target.value)}>
                  <option value="IT Infrastructure">IT Infrastructure</option>
                  <option value="Finance">Finance</option>
                  <option value="Security">Security</option>
                  <option value="Customer Support">Customer Support</option>
                  <option value="Operations">Operations</option>
                </select>
              </div>
            </div>

            <div className="form-row">
              <div className="form-group flex-1">
                <label className="form-label">Assigned Owner</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="e.g. Alex Rivera"
                  value={ownerName}
                  onChange={(e) => setOwnerName(e.target.value)}
                />
              </div>

              <div className="form-group flex-1">
                <label className="form-label">Due Date</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="e.g. Today, 18:00"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                />
              </div>
            </div>
          </div>

          <div className="modal-footer">
            <button type="button" className="secondary-button" onClick={onClose}>Cancel</button>
            <button type="submit" className="primary-button">Create Task</button>
          </div>
        </form>
      </div>
    </div>
  );
});

export default CreateTaskModal;
