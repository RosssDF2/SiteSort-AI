const express = require("express");
const router = express.Router();
const auth = require("../middlewares/authMiddleware");
const Summary = require("../models/Summary");

// Apply auth middleware to all routes
router.use(auth);

// GET all summaries for authenticated user (newest first)
router.get("/", async (req, res) => {
  try {
    const summaries = await Summary.find({ user: req.user.id })
      .sort({ createdAt: -1 })
      .populate('chatId', 'title')
      .select('-__v');
    res.json(summaries);
  } catch (err) {
    console.error('Error fetching summaries:', err);
    res.status(500).json({ error: "Failed to fetch summaries" });
  }
});

// POST new summary
router.post("/", async (req, res) => {
  try {
    const summary = new Summary({
      user: req.user.id,
      content: req.body.content,
      chatId: req.body.chatId,
      createdAt: new Date(),
      updatedAt: new Date()
    });
    await summary.save();
    res.status(201).json(summary);
  } catch (err) {
    console.error('Error creating summary:', err);
    res.status(400).json({ error: "Failed to save summary" });
  }
});

// DELETE summary by ID
router.delete("/:id", async (req, res) => {
  try {
    const deleted = await Summary.findOneAndDelete({
      _id: req.params.id,
      user: req.user.id
    });
    
    if (!deleted) {
      return res.status(404).json({ error: "Summary not found or unauthorized" });
    }
    
    res.json({ message: "Summary deleted successfully" });
  } catch (err) {
    console.error('Error deleting summary:', err);
    res.status(500).json({ error: "Failed to delete summary" });
  }
});

module.exports = router;
