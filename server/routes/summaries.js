const express = require("express");
const router = express.Router();
const Summary = require("../models/Summary");

// GET all summaries (newest first)
router.get("/", async (req, res) => {
  try {
    const summaries = await Summary.find().sort({ timestamp: -1 });
    res.json(summaries);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch summaries" });
  }
});

// POST new summary
router.post("/", async (req, res) => {
  try {
    const summary = new Summary({
      content: req.body.content,
      timestamp: req.body.timestamp || new Date(),
    });
    await summary.save();
    res.json(summary);
  } catch (err) {
    res.status(400).json({ error: "Failed to save summary" });
  }
});

// DELETE summary by ID
router.delete("/:id", async (req, res) => {
  try {
    const deleted = await Summary.findByIdAndDelete(req.params.id);
    if (!deleted) return res.status(404).json({ error: "Summary not found" });
    res.json({ message: "Deleted successfully", id: deleted._id });
  } catch (err) {
    res.status(500).json({ error: "Failed to delete summary" });
  }
});

module.exports = router;
