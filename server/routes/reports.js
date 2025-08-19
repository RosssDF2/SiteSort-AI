const express = require("express");
const router = express.Router();
const auth = require("../middlewares/authMiddleware");
const Report = require("../models/Report");

// Apply auth middleware to all routes
router.use(auth);

// GET all reports for authenticated user (newest first)
router.get("/", async (req, res) => {
  try {
    const reports = await Report.find({ user: req.user.id })
      .sort({ createdAt: -1 })
      .populate('chatId', 'title')
      .select('-__v');
    res.json(reports);
  } catch (err) {
    console.error('Error fetching reports:', err);
    res.status(500).json({ error: "Failed to fetch reports" });
  }
});

// POST new report
router.post("/", async (req, res) => {
  try {
    const report = new Report({
      user: req.user.id,
      content: req.body.content,
      chatId: req.body.chatId,
      createdAt: new Date(),
      updatedAt: new Date()
    });
    await report.save();
    res.status(201).json(report);
  } catch (err) {
    console.error('Error creating report:', err);
    res.status(400).json({ error: "Failed to save report" });
  }
});

// DELETE report by ID
router.delete("/:id", async (req, res) => {
  try {
    const deleted = await Report.findOneAndDelete({
      _id: req.params.id,
      user: req.user.id
    });
    
    if (!deleted) {
      return res.status(404).json({ error: "Report not found or unauthorized" });
    }
    
    res.json({ message: "Report deleted successfully" });
  } catch (err) {
    console.error('Error deleting report:', err);
    res.status(500).json({ error: "Failed to delete report" });
  }
});

module.exports = router;
