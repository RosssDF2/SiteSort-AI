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
  username: {
    type: String,
    required: true
  },

  // 🔐 Google binding fields
  googleId: {
    type: String,
    default: null
  },
  isGoogleLinked: {
    type: Boolean,
    default: false
  },
  googleEmail: {
    type: String,
    default: null,
  },

  // Password reset fields
  resetToken: {
    type: String,
    default: null
  },
  resetTokenExpiry: {
    type: Date,
    default: null
  },


  // 🔒 2FA fields (for later setup)
  is2FAEnabled: {
    type: Boolean,
    default: false
  },
  twoFASecret: {
    type: String,
    default: null // Store TOTP secret here if using Google Authenticator
  }
}, { timestamps: true });



module.exports = mongoose.model('User', userSchema);
