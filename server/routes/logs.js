const express = require("express");
const router = express.Router();
const Log = require("../models/Log");
const authMiddleware = require("../middlewares/authMiddleware");

router.get("/", authMiddleware, async (req, res) => {
  try {
    const logs = await Log.find({ user: req.user.id }).sort({ createdAt: -1 });
    res.json({ logs });
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch logs" });
  }
});

module.exports = router;

