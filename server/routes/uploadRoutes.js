const express = require("express");
const router = express.Router();
const upload = require("../middlewares/multerMemory"); // memory-based multer
const { analyzeFile, confirmUpload } = require("../controllers/uploadController");
const authMiddleware = require("../middlewares/authMiddleware");

router.post("/analyze", authMiddleware, upload.single("file"), analyzeFile);
router.post("/confirm", authMiddleware, upload.single("file"), confirmUpload);

module.exports = router;
