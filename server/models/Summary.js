const mongoose = require("mongoose");

const SummarySchema = new mongoose.Schema({
  content: { type: String, required: true },
  chatId: { type: mongoose.Schema.Types.ObjectId, ref: "ChatLog", default: null },
  timestamp: { type: Date, default: Date.now }
});

module.exports = mongoose.model("Summary", SummarySchema);
