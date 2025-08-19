// routes/chatLogs.js
const express = require("express");
const router = express.Router();
const auth = require("../middlewares/authMiddleware");
const ChatLog = require("../models/ChatLog");

// Apply auth middleware to all routes
router.use(auth);

// GET all chat logs for authenticated user
router.get("/chatlog", async (req, res) => {
  try {
    const logs = await ChatLog.find({ user: req.user.id })
      .sort({ createdAt: -1 })
      .select('-__v');
    res.json(logs);
  } catch (err) {
    console.error('Error fetching chat logs:', err);
    res.status(500).json({ error: "Failed to fetch chat logs" });
  }
});

// POST new chat log
router.post("/chatlog", async (req, res) => {
  try {
    const { title, messages } = req.body;
    const newLog = new ChatLog({
      user: req.user.id,
      title,
      messages,
      createdAt: new Date(),
      updatedAt: new Date()
    });
    await newLog.save();
    res.status(201).json(newLog);
  } catch (err) {
    console.error('Error saving chat log:', err);
    res.status(400).json({ error: "Failed to save chat log" });
  }
});

// PUT update chat log title
router.put("/chatlog/:id", async (req, res) => {
  try {
    const updated = await ChatLog.findOneAndUpdate(
      { _id: req.params.id, user: req.user.id },
      { 
        title: req.body.title,
        updatedAt: new Date()
      },
      { new: true }
    );

    if (!updated) {
      return res.status(404).json({ error: "Chat log not found or unauthorized" });
    }

    res.json(updated);
  } catch (err) {
    console.error('Error updating chat title:', err);
    res.status(400).json({ error: "Failed to update chat title" });
  }
});

// PUT update entire chat log (messages and title)
router.put("/chatlog/:id/messages", async (req, res) => {
  try {
    const { title, messages } = req.body;
    const updated = await ChatLog.findOneAndUpdate(
      { _id: req.params.id, user: req.user.id },
      { 
        title, 
        messages, 
        updatedAt: new Date()
      },
      { new: true }
    );
    res.json(updated);
  } catch (err) {
    res.status(400).json({ error: "Failed to update chat log" });
  }
});

// DELETE chat log
router.delete("/chatlog/:id", async (req, res) => {
  try {
    const result = await ChatLog.deleteOne({
      _id: req.params.id,
      user: req.user.id
    });

    if (result.deletedCount === 0) {
      return res.status(404).json({ error: "Chat log not found or unauthorized" });
    }

    res.json({ message: "Chat log deleted successfully" });
  } catch (err) {
    console.error('Error deleting chat log:', err);
    res.status(400).json({ error: "Failed to delete chat log" });
  }
});

module.exports = router;
