const express = require("express");
const router = express.Router();
const multer = require("multer");
const upload = multer(); // use memory storage
const validateToken = require("../middlewares/authMiddleware"); // ✅ import
const { getUploadHistory } = require("../controllers/uploadController");

const { analyzeFile, confirmUpload } = require("../controllers/uploadController");

router.post("/analyze", upload.single("file"), validateToken, analyzeFile);  // Optional to protect
router.post("/confirm", upload.single("file"), validateToken, confirmUpload); // ✅ PROTECT THIS
router.get("/history", validateToken, getUploadHistory);

module.exports = router;
