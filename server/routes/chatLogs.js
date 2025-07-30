// routes/chatLogs.js
const express = require("express");
const router = express.Router();
const ChatLog = require("../models/ChatLog");

// GET all chat logs
router.get("/chatlog", async (req, res) => {
  try {
    const logs = await ChatLog.find().sort({ createdAt: -1 });
    res.json(logs);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch chat logs" });
  }
});

// POST new chat log
router.post("/chatlog", async (req, res) => {
  try {
    const { title, messages } = req.body;
    const newLog = new ChatLog({ title, messages });
    await newLog.save();
    res.json(newLog);
  } catch (err) {
    res.status(400).json({ error: "Failed to save chat log" });
  }
});

// PUT update chat log title
router.put("/chatlog/:id", async (req, res) => {
  try {
    const updated = await ChatLog.findByIdAndUpdate(
      req.params.id,
      { title: req.body.title },
      { new: true }
    );
    res.json(updated);
  } catch (err) {
    res.status(400).json({ error: "Failed to update chat title" });
  }
});

// DELETE chat log
router.delete("/chatlog/:id", async (req, res) => {
  try {
    await ChatLog.findByIdAndDelete(req.params.id);
    res.json({ message: "Deleted" });
  } catch (err) {
    res.status(400).json({ error: "Failed to delete chat log" });
  }
});

module.exports = router;
