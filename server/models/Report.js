const mongoose = require("mongoose");

const ReportSchema = new mongoose.Schema({
  content: { type: String, required: true },
  chatId: { type: mongoose.Schema.Types.ObjectId, ref: "ChatLog", default: null },
  timestamp: { type: Date, default: Date.now }
});

module.exports = mongoose.model("Report", ReportSchema);
