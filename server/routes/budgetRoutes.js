const express = require("express");
const router = express.Router();
const { getBudgetSummary } = require("../controllers/budgetController");

router.get("/summary", getBudgetSummary); // /api/budget/summary?folderId=xxx

module.exports = router;
