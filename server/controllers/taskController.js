const Task = require("../models/Task");

exports.getTasks = async (req, res) => {
  try {
    const tasks = await Task.find({ userId: req.user.id }).sort({ createdAt: -1 });
    res.json(tasks);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch tasks" });
  }
};

exports.addTasks = async (req, res) => {
  try {
    const { steps } = req.body; // array of step strings
    const newTasks = await Task.insertMany(
      steps.map(desc => ({ userId: req.user.id, description: desc }))
    );
    res.json(newTasks);
  } catch (err) {
    res.status(500).json({ error: "Failed to add tasks" });
  }
};

exports.updateTask = async (req, res) => {
  try {
    const task = await Task.findOneAndUpdate(
      { _id: req.params.id, userId: req.user.id },
      { completed: req.body.completed },
      { new: true }
    );
    res.json(task);
  } catch (err) {
    res.status(500).json({ error: "Failed to update task" });
  }
};
