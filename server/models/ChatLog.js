// models/ChatLog.js
const mongoose = require("mongoose");

const MessageSchema = new mongoose.Schema({
  sender: String,
  text: String,
}, { _id: false });

const ChatLogSchema = new mongoose.Schema({
  title: String,
  messages: [MessageSchema],
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model("ChatLog", ChatLogSchema);
