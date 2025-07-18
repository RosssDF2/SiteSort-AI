const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");
const User = require("../models/User");
const { send2FACode } = require("../utils/mailer");


let temp2FACodes = {}; // key = user._id, value = { code, expires }

exports.loginUser = async (req, res) => {
  const { email, password } = req.body;

  try {
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ error: "Invalid email or password" });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ error: "Invalid email or password" });
    }

    // ✅ 2FA REQUIRED: only for managers with Google linked
    if (user.role === "manager" && user.isGoogleLinked) {
      const code = Math.floor(100000 + Math.random() * 900000).toString();
      const expires = Date.now() + 5 * 60 * 1000;
      temp2FACodes[user._id] = { code, expires };

      const sendTo = user.googleEmail || user.email;
      await send2FACode(sendTo, code);
      console.log("Sending 2FA to:", sendTo)
      return res.json({
        message: "2FA code sent",
        tempUserId: user._id,
        sendTo, // ✅ required
      });
    }


    // ✅ NO 2FA: return full login
    const token = jwt.sign(
      { id: user._id, email: user.email, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: "1h" }
    );

    return res.json({
      token,
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        username: user.username,
        avatar: user.avatar, // ✅ add this line
        is2FAEnabled: user.is2FAEnabled,
        isGoogleLinked: user.isGoogleLinked,
      }
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
};


exports.verify2FA = async (req, res) => {
  const { userId, code } = req.body;
  const user = await User.findById(userId);
  const twoFA = temp2FACodes[userId];

  if (!user || !twoFA || code !== twoFA.code || Date.now() > twoFA.expires) {
    return res.status(401).json({ error: "Invalid or expired 2FA code" });
  }

  delete temp2FACodes[userId];

  const token = jwt.sign(
    { id: user._id, email: user.email, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: "1h" }
  );

  res.json({
    token,
    user: {
      id: user.id,
      email: user.email,
      role: user.role,
      username: user.username // ✅ Add this
    }
  });

};

const generateResetToken = require('../utils/generateToken');
const { sendResetEmail } = require('../utils/mailer'); // 👈 make sure this is imported

exports.requestPasswordReset = async (req, res) => {
  const { email } = req.body;

  try {
    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ error: "User not found" });

    // 1. Generate token and expiry
    const token = generateResetToken();
    const expiry = Date.now() + 1000 * 60 * 30; // 30 minutes

    user.resetToken = token;
    user.resetTokenExpiry = expiry;
    await user.save();

    // 2. Build reset URL
    const resetUrl = `${process.env.CLIENT_URL}/reset-password?token=${token}`;

    // 3. Determine recipients
    const recipients = [user.email];
    if (user.isGoogleLinked && user.googleEmail && user.googleEmail !== user.email) {
      recipients.push(user.googleEmail);
    }

    // 4. Send email to each recipient
    for (const email of recipients) {
      console.log(`📧 Sending reset link to: ${email}`);
      await sendResetEmail(email, resetUrl); // 🔁 uses mailer util
    }

    res.json({ message: "Password reset link sent" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
};


exports.resetPasswordWithToken = async (req, res) => {
  const { token, newPassword } = req.body;

  try {
    const user = await User.findOne({
      resetToken: token,
      resetTokenExpiry: { $gt: Date.now() }
    });

    if (!user) return res.status(400).json({ error: "Invalid or expired token" });

    const hashed = await bcrypt.hash(newPassword, 10);

    user.password = hashed;
    user.resetToken = null;
    user.resetTokenExpiry = null;
    await user.save();

    res.json({ message: "Password reset successful" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
};
exports.personalizeUser = async (req, res) => {
  try {
    const userId = req.user.id;
    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ error: "User not found" });

    if (req.body.username) user.username = req.body.username;
    if (req.body.gender) user.gender = req.body.gender;
    if (req.body.phone) user.phone = req.body.phone;
    if (req.body.gmailEmail) user.gmailEmail = req.body.gmailEmail;
    if (req.body.accountEmail) user.accountEmail = req.body.accountEmail;
    if (req.file) {
      user.avatar = `/avatars/${req.file.filename}`; // served from public folder
    }

    await user.save();

    res.json({
      id: user._id,
      email: user.email,
      username: user.username,
      role: user.role,
      avatar: user.avatar,
      gender: user.gender,
      phone: user.phone,
      gmailEmail: user.gmailEmail,
      accountEmail: user.accountEmail,
      is2FAEnabled: user.is2FAEnabled,
      isGoogleLinked: user.isGoogleLinked
    });

  } catch (err) {
    console.error("❌ Personalize error:", err);
    res.status(500).json({ error: "Server error" });
  }
};

exports.temp2FACodes = temp2FACodes;
