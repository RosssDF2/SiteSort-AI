// server/models/Insight.js
const mongoose = require('mongoose');

const insightSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  date: {
    type: String, // Keep it as "dd/mm/yyyy" as you’re using `toLocaleDateString("en-GB")`
    required: true,
  },
  summary: {
    type: String,
    required: true,
  },
});

module.exports = mongoose.model('Insight', insightSchema);
