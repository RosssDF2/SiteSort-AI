// models/ChatLog.js
const mongoose = require("mongoose");

const MessageSchema = new mongoose.Schema({
  sender: String,
  text: String,
}, { _id: false });

const ChatLogSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true // Add index for better query performance
  },
  title: String,
  messages: [MessageSchema],
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model("ChatLog", ChatLogSchema);
