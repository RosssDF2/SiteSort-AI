const mongoose = require("mongoose");

const fileSchema = new mongoose.Schema({
  originalName: String,
  folder: String,
  uploadedAt: {
    type: Date,
    default: Date.now,
  },
  uploadedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
  },
});

module.exports = mongoose.model("File", fileSchema);
