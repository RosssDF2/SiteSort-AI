const express = require("express");
const dotenv = require("dotenv");

const axios = require("axios");
const multer = require("multer");
const upload = multer({ storage: multer.memoryStorage() }); // or diskStorage if preferred
const { summarizeUpload } = require("../controllers/fileController");
const { askSiteSortAI } = require("../utils/vertexGemini");

dotenv.config();
const router = express.Router();

router.post("/upload-summarize", upload.single("file"), (req, res, next) => {
  console.log("📥 File received:", req.file?.originalname);
  next();
}, summarizeUpload);
router.post("/chat", async (req, res) => {
  const { prompt } = req.body;
  if (!prompt) return res.status(400).json({ error: "Prompt is required" });

  console.log("✅ Received prompt:", prompt);
  try {
    const { reply, blocked } = await askSiteSortAI(prompt);
    if (blocked) return res.status(429).json({ error: "Gemini daily limit reached" });

    console.log("✅ Gemini replied:", reply);
    res.send(reply);
  } catch (err) {
    console.error("❌ Error calling Gemini:", err.message);
    res.status(500).json({ error: "Failed to get AI response from Gemini" });
  }
});


console.log("📡 chatRoutes loaded");

module.exports = router;
