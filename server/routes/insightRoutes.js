// server/routes/insightRoutes.js
const express = require("express");
const router = express.Router();
const {
  getInsights,
  addInsight,
  updateInsight,
  deleteInsight,
  analyzeInsights,   // ✅ must be exported in InsightController
  deleteAllInsights, // ✅ for clearing logs
} = require("../controllers/InsightController");
const authMiddleware = require("../middlewares/authMiddleware");
router.delete("/all", authMiddleware, deleteAllInsights);
router.get("/", authMiddleware, getInsights);
router.post("/", authMiddleware, addInsight);
router.put("/:id", authMiddleware, updateInsight);
router.delete("/:id", authMiddleware, deleteInsight);

// ✅ New routes
router.post("/analyze", authMiddleware, analyzeInsights);


module.exports = router;
