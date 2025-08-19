const express = require("express");
const router = express.Router();
const { summary } = require("../controllers/searchFirmanController");

// ✅ Route now points to the mock "summary" handler
router.get("/summary", summary);

module.exports = router;
