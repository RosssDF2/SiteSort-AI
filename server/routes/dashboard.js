// server/routes/dashboard.js
const express = require("express");
const router = express.Router();
const dashboardController = require("../controllers/dashboardController");
const authMiddleware = require("../middlewares/authMiddleware");
const { getDashboardData } = require("../controllers/dashboardController");

router.get("/", authMiddleware, getDashboardData);

module.exports = router;
