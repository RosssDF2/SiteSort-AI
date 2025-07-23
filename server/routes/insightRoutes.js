// server/routes/insightRoutes.js
const express = require("express");
const router = express.Router();
const {
  getInsights,
  addInsight,
  updateInsight,
  deleteInsight,
} = require("../controllers/InsightController");
const authMiddleware = require("../middlewares/authMiddleware");

// ✅ Use authMiddleware here instead of auth
router.get("/", authMiddleware, getInsights);
router.post("/", authMiddleware, addInsight);
router.put("/:id", authMiddleware, updateInsight);
router.delete("/:id", authMiddleware, deleteInsight);

module.exports = router;
