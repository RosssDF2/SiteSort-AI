const express = require("express");
const router = express.Router();
const multer = require("multer");
const upload = multer(); // use memory storage

const { analyzeFile, confirmUpload } = require("../controllers/uploadController");

router.post("/analyze", upload.single("file"), analyzeFile);
router.post("/confirm", upload.single("file"), confirmUpload);

module.exports = router;
