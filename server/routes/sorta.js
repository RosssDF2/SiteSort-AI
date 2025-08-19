const express = require("express");
const router = express.Router();
const { askGemini } = require("../utils/vertexGemini");
const jwt = require("jsonwebtoken");
const User = require("../models/User");

router.post("/chat", async (req, res) => {
  const { message } = req.body;
  console.log("📩 Sorta received:", message);

  // Detect "change my name to ..." intent
  const match = message.match(/change\s+my\s+name\s+to\s+([a-zA-Z0-9 _\-']+)/i);
  if (match) {
    // Try to get user from JWT
    const authHeader = req.headers.authorization;
    const token = authHeader?.split(" ")[1];
    if (!token) {
      return res.status(401).json({ reply: "❌ You must be logged in to change your name." });
    }
    try {
      const payload = jwt.verify(token, process.env.JWT_SECRET);
      const user = await User.findById(payload.id);
      if (!user) {
        return res.status(404).json({ reply: "❌ User not found." });
      }
      const newName = match[1].trim();
      user.username = newName;
      await user.save();
      return res.json({
        reply: `✅ Your name has been changed to "${newName}".`,
        updatedUser: {
          ...user.toObject(),
          password: undefined, // never send password
        }
      });
    } catch (err) {
      return res.status(401).json({ reply: "❌ Invalid or expired token." });
    }
  }

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
