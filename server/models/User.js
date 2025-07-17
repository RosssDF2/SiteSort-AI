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

const fileSchema = new mongoose.Schema({
  filename: String,
  originalname: String,
  mimetype: String,
  size: Number,
  path: String,
  uploadDate: { type: Date, default: Date.now }
});


module.exports = mongoose.model('User', userSchema);
