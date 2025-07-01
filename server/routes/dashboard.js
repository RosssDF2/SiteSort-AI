// server/routes/dashboard.js
const express = require("express");
const router = express.Router();
const dashboardController = require("../controllers/dashboardController");
const authenticateJWT = require("../middlewares/authenticateJWT");

router.get("/", authenticateJWT, dashboardController.getDashboardData);

module.exports = router;
