const express = require("express");
const router = express.Router();
const axios = require("axios");
const fs = require("fs");
require("dotenv").config();

const knowledge = fs.readFileSync("sorta_knowledge.txt", "utf-8");

router.post("/chat", async (req, res) => {
  const userMessage = req.body.message;

  const systemPrompt = `You are Sorta, an AI assistant helping users with the SiteSort AI platform. Only use the knowledge below to answer:\n\n${knowledge}`;

  try {
    const response = await axios.post("https://openrouter.ai/api/v1/chat/completions", {
      model: "mistralai/mistral-small-3.2-24b-instruct",
 // ✅ Correct model ID
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userMessage }
      ]
    }, {
      headers: {
        "Authorization": `Bearer ${process.env.OPENROUTER_API_KEY}`,
        "Content-Type": "application/json",
        "HTTP-Referer": "http://localhost:5173",  // ✅ required by OpenRouter
        "X-Title": "SiteSort AI"
      }
    });

    const reply = response.data.choices[0].message.content;
    res.json({ reply });
  } catch (err) {
    console.error("Sorta AI Error:", err.response?.data || err.message);
    res.status(500).json({ reply: "⚠️ Sorta ran into an error. Try again later." });
  }
});

module.exports = router;
