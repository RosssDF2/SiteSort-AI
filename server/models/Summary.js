const mongoose = require("mongoose");

const SummarySchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  content: { type: String, required: true },
  chatId: { type: mongoose.Schema.Types.ObjectId, ref: "ChatLog", default: null },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model("Summary", SummarySchema);
