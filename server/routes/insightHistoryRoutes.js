const express = require("express");
const router = express.Router();
const {
  getInsightHistory,
  addInsightHistory
} = require("../controllers/InsightHistoryController");
const authMiddleware = require("../middlewares/authMiddleware");

router.get("/", authMiddleware, getInsightHistory);
router.post("/", authMiddleware, addInsightHistory);

module.exports = router;
