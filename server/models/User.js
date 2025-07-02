const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    unique: true
  },
  password: {
    type: String,
    required: true
  },
  role: {
    type: String,
    enum: ['manager', 'admin', 'user'],
    default: 'user'
  },
  username: { type: String, required: true } // ✅ Add this line
}, { timestamps: true });

module.exports = mongoose.model('User', userSchema);
