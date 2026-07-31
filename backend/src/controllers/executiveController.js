const executiveService = require("../services/executiveService");

exports.getDashboardOverview = async (req, res) => {
  try {
    const overview = await executiveService.getDashboardOverview();
    res.json(overview);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getActivityFeed = async (req, res) => {
  try {
    const feed = await executiveService.getActivityFeed();
    res.json(feed);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getUsers = async (req, res) => {
  try {
    const users = await executiveService.getTeamPresence();
    res.json(users);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getDepartments = async (req, res) => {
  try {
    const departments = await executiveService.getDepartmentHealth();
    res.json(departments);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getTasks = async (req, res) => {
  try {
    const tasks = await executiveService.getExecutiveTasks();
    res.json(tasks);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.createTask = async (req, res) => {
  try {
    const task = await executiveService.createTask(req.body);
    res.status(201).json(task);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.updateTask = async (req, res) => {
  try {
    const task = await executiveService.updateTask(req.params.id, req.body);
    res.json(task);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.deleteTask = async (req, res) => {
  try {
    const result = await executiveService.deleteTask(req.params.id);
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getMessages = async (req, res) => {
  try {
    const messages = await executiveService.getWarRoomMessages();
    res.json(messages);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.sendMessage = async (req, res) => {
  try {
    const message = await executiveService.sendMessage(req.body);
    res.status(201).json(message);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getApprovals = async (req, res) => {
  try {
    const approvals = await executiveService.getApprovals();
    res.json(approvals);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.actOnApproval = async (req, res) => {
  try {
    const approval = await executiveService.actOnApproval(req.params.id, req.body);
    res.json(approval);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
