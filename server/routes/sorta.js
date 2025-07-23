const express = require("express");
const router = express.Router();
const { askGemini } = require("../utils/vertexGemini");

router.post("/chat", async (req, res) => {
  const { message } = req.body;
  console.log("📩 Sorta received:", message);

  try {
    const { reply, blocked } = await askGemini(message); // ✅ send actual user message

    if (blocked) {
      return res.status(429).json({
        reply: "⚠️ SortaBot has reached the daily AI usage limit.",
      });
    }

    console.log("🤖 Gemini replied:", reply);
    res.json({ reply });
  } catch (err) {
    console.error("❌ Sorta AI Error:", err.message || err);
    res.status(500).json({ reply: "⚠️ Sorta ran into an error. Try again later." });
  }
});

module.exports = router;
