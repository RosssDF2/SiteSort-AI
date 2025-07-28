const express = require("express");
const dotenv = require("dotenv");

const axios = require("axios");
const multer = require("multer");
const upload = multer({ storage: multer.memoryStorage() }); // or diskStorage if preferred
const { summarizeUpload } = require("../controllers/fileController");

dotenv.config();
const router = express.Router();

router.post("/upload-summarize", upload.single("file"), (req, res, next) => {
  console.log("📥 File received:", req.file?.originalname);
  next();
}, summarizeUpload);
router.post("/chat", async (req, res) => {
  const { prompt } = req.body;

  if (!prompt) {
    console.log("❌ No prompt received.");
    return res.status(400).json({ error: "Prompt is required" });
  }

  console.log("✅ Received prompt:", prompt);

  try {
    const response = await axios.post(
      "https://openrouter.ai/api/v1/chat/completions",
      {
        model: "openai/gpt-4o",
        messages: [{ role: "user", content: prompt }],
        temperature: 1,
        max_tokens: 256,
        top_p: 1,
        frequency_penalty: 0,
        presence_penalty: 0,
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
          "Content-Type": "application/json",
          "HTTP-Referer": process.env.CLIENT_URL,
          "X-Title": "SiteSort AI Assistant",
        },
      }
    );

    console.log("✅ AI replied:", response.data.choices[0].message.content);
    res.send(response.data.choices[0].message.content);

  } catch (err) {
    console.error("❌ Error calling OpenRouter:");
    console.error(err.response?.data || err.message);
    res.status(500).json({ error: "Failed to get AI response from OpenRouter" });
  }
});

console.log("📡 chatRoutes loaded");

module.exports = router;
