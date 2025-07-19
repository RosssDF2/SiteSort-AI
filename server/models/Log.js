const mongoose = require("mongoose");

const logSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true
  },
  action: {
    type: String,
    required: true
  },
  ipAddress: {
    type: String,
    default: null
  },
  device: {
    type: String,
    default: null
  },
  metadata: {
    type: Object,
    default: {}
  }
}, { timestamps: true }); // createdAt = timestamp

module.exports = mongoose.model("Log", logSchema);
