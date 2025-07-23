// server/controllers/insightController.js
const Insight = require("../models/Insight");

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
