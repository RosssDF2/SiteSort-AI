const express = require("express");
const router = express.Router();
const validateToken = require("../middlewares/authMiddleware");
const listFoldersFromUserDrive = require("../controllers/driveOauth");

router.get("/folders-oauth", validateToken, listFoldersFromUserDrive);

module.exports = router;
