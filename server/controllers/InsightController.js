// server/controllers/insightController.js
const Insight = require("../models/Insight");
const { generateText } = require("../utils/vertexGemini"); // adjust to your helper


exports.getInsights = async (req, res) => {
  try {
    const insights = await Insight.find({ userId: req.user.id }).sort({ date: -1 });
    res.json(insights);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch insights" });
  }
};

exports.addInsight = async (req, res) => {
  try {
    const { date, summary } = req.body;
    const newInsight = new Insight({ userId: req.user.id, date, summary });
    await newInsight.save();
    res.json(newInsight);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to add insight" });
  }
};

exports.updateInsight = async (req, res) => {
  try {
    const { summary } = req.body;
    const updated = await Insight.findOneAndUpdate(
      { _id: req.params.id, userId: req.user.id },
      { summary },
      { new: true }
    );
    res.json(updated);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to update insight" });
  }
};

exports.deleteInsight = async (req, res) => {
  try {
    await Insight.findOneAndDelete({ _id: req.params.id, userId: req.user.id });
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to delete insight" });
  }
};

exports.analyzeInsights = async (req, res) => {
  try {
    // 1️⃣ Fetch all insights
    const insights = await Insight.find().sort({ createdAt: 1 });

    if (!insights.length) {
      return res.status(400).json({ error: "No insights available to analyze" });
    }

    // 2️⃣ Combine into one context block
    const combined = insights.map(i => `- [${i.date}] ${i.summary}`).join("\n");

    // 3️⃣ Build AI prompt
    const prompt = `
You are an AI Manager Assistant. You are given a chronological log of project insights.

Insights:
${combined}

Analyze these insights and return JSON ONLY in this exact schema:
{
  "summary": "Concise update on project progress (2–3 sentences)",
  "risks": ["Risk 1", "Risk 2", "Risk 3"],
  "nextSteps": [
    "Step 1: Do this...",
    "Step 2: Do that...",
    "Step 3: Ensure this..."
  ]
}

Guidelines:
- Always number next steps as "Step 1", "Step 2", "Step 3".
- Keep each step short, actionable, and written like real project manager instructions.
- Risks must be 1–2 lines each, specific and actionable.
- Do not include markdown or extra commentary — only raw JSON.
`.trim();

    // 4️⃣ Call Gemini via generateText
    const text = await generateText(prompt);

    // 5️⃣ Parse JSON safely
    let parsed;
    try {
      const cleaned = text.replace(/```json|```/gi, "").trim();
      const match = cleaned.match(/\{[\s\S]*\}/);
      parsed = match ? JSON.parse(match[0]) : { summary: text, risks: [], nextSteps: [] };
    } catch (err) {
      console.error("❌ JSON parse failed:", err.message);
      parsed = { summary: text, risks: [], nextSteps: [] };
    }

    res.json(parsed);
  } catch (err) {
    console.error("❌ Insight analysis failed:", err.message);
    res.status(500).json({ error: "AI analysis failed" });
  }
};

exports.analyzeInsights = async (req, res) => {
  try {
    const insights = await Insight.find().sort({ createdAt: 1 });
    if (!insights.length) {
      return res.status(400).json({ error: "No insights available to analyze" });
    }

    const combined = insights.map(i => `- [${i.date}] ${i.summary}`).join("\n");

    const prompt = `
You are an AI Manager Assistant. You are given project insights:

${combined}

Return JSON ONLY in this schema:
{
  "summary": "2–3 sentences",
  "risks": ["Risk 1", "Risk 2"],
  "nextSteps": ["Step 1: ...", "Step 2: ...", "Step 3: ..."]
}
    `.trim();

    const text = await generateText(prompt);

    let parsed;
    try {
      parsed = JSON.parse(text.replace(/```json|```/gi, "").trim());
    } catch {
      parsed = { summary: text, risks: [], nextSteps: [] };
    }

    res.json(parsed);
  } catch (err) {
    console.error("❌ Insight analysis failed:", err.message);
    res.status(500).json({ error: "AI analysis failed" });
  }
};

// ✅ Delete ALL insights
exports.deleteAllInsights = async (req, res) => {
  try {
    await Insight.deleteMany({});
    res.json({ message: "All insights deleted" });
  } catch (err) {
    console.error("Failed to delete all insights:", err.message);
    res.status(500).json({ error: "Failed to delete all insights" });
  }
};
