const InsightHistory = require("../models/InsightHistory");

exports.getInsightHistory = async (req, res) => {
  try {
    const history = await InsightHistory.find({ userId: req.user.id })
      .sort({ createdAt: -1 });
    res.json(history);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch insight history" });
  }
};

exports.addInsightHistory = async (req, res) => {
  try {
    const { date, summary } = req.body;
    const newInsightHistory = new InsightHistory({ 
      userId: req.user.id, 
      date, 
      summary 
    });
    await newInsightHistory.save();
    res.json(newInsightHistory);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to add insight to history" });
  }
};
