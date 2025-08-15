const express = require("express");
const router = express.Router();
const Report = require("../models/Report");

// GET all reports (newest first)
router.get("/", async (req, res) => {
  try {
    const reports = await Report.find().sort({ timestamp: -1 });
    res.json(reports);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch reports" });
  }
});

// POST new report
router.post("/", async (req, res) => {
  try {
    const report = new Report({
      content: req.body.content,
      timestamp: req.body.timestamp || new Date(),
    });
    await report.save();
    res.json(report);
  } catch (err) {
    res.status(400).json({ error: "Failed to save report" });
  }
});

// DELETE report by ID
router.delete("/:id", async (req, res) => {
  try {
    const deleted = await Report.findByIdAndDelete(req.params.id);
    if (!deleted) return res.status(404).json({ error: "Report not found" });
    res.json({ message: "Deleted successfully", id: deleted._id });
  } catch (err) {
    res.status(500).json({ error: "Failed to delete report" });
  }
});

module.exports = router;
