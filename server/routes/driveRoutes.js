const express = require("express");
const router = express.Router();
const { getUserFolders } = require("../controllers/getUserFolders");
const auth = require("../middleware/auth");

router.get("/folders", auth, getUserFolders);

module.exports = router;
