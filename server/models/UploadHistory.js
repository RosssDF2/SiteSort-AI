const mongoose = require("mongoose");

const uploadHistorySchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  filename: String,
  tags: [String],
}, { timestamps: true }); // includes createdAt

module.exports = mongoose.model("UploadHistory", uploadHistorySchema);
