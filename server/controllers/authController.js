const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");
const User = require("../models/User");
const { send2FACode, sendResetEmail } = require("../utils/mailer");
const generateResetToken = require("../utils/generateToken");
const logAction = require("../utils/logAction"); // ✅ Logging utility

let temp2FACodes = {}; // key = user._id, value = { code, expires }

exports.temp2FACodes = temp2FACodes;

exports.loginUser = async (req, res) => {
  const { email, password } = req.body;

  try {
    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ error: "Invalid email or password" });

    // Brute-force: check if locked
    if (user.isLocked && (!user.lockUntil || user.lockUntil > Date.now())) {
      return res.status(403).json({ error: "Account is locked. Please contact admin." });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      user.failedLoginAttempts = (user.failedLoginAttempts || 0) + 1;
      if (user.failedLoginAttempts >= 4) {
        user.isLocked = true;
        user.lockUntil = new Date(Date.now() + 24 * 60 * 60 * 1000); // lock for 24h (or until admin unlocks)
      }
      await user.save();
      if (user.isLocked) {
        return res.status(403).json({ error: "Account is locked. Please contact admin." });
      } else {
        return res.status(400).json({ error: "Invalid email or password", remainingAttempts: 4 - user.failedLoginAttempts });
      }
    }

    // Reset failed attempts on successful login
    user.failedLoginAttempts = 0;
    user.isLocked = false;
    user.lockUntil = null;
    await user.save();

    // 2FA (only for managers with Google linked)
    if (user.role === "manager" && user.isGoogleLinked) {
      const code = Math.floor(100000 + Math.random() * 900000).toString();
      const expires = Date.now() + 5 * 60 * 1000;
      temp2FACodes[user._id] = { code, expires };

      const sendTo = user.googleEmail || user.email;
      await send2FACode(sendTo, code);
      return res.json({
        message: "2FA code sent",
        tempUserId: user._id,
        sendTo,
      });
    }

    // Normal login (no 2FA)
    const token = jwt.sign(
      { id: user._id, email: user.email, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: "1h" }
    );

    await logAction({
      userId: user._id,
      action: "User logged in",
      req,
    });

    return res.json({
      token,
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        username: user.username,
        avatar: user.avatar,
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

  await logAction({
    userId: user._id,
    action: "User logged in via 2FA",
    req,
  });

  res.json({
    token,
    user: {
      id: user.id,
      email: user.email,
      role: user.role,
      username: user.username,
      avatar: user.avatar, // ✅ add this
      is2FAEnabled: user.is2FAEnabled,
      isGoogleLinked: user.isGoogleLinked
    }
  });

};

exports.requestPasswordReset = async (req, res) => {
  const { email } = req.body;

  try {
    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ error: "User not found" });

    // Unlock account and reset failed attempts
    user.failedLoginAttempts = 0;
    user.isLocked = false;
    user.lockUntil = null;

    const token = generateResetToken();
    const expiry = Date.now() + 1000 * 60 * 30;

    user.resetToken = token;
    user.resetTokenExpiry = expiry;
    await user.save();

    const resetUrl = `${process.env.CLIENT_URL}/reset-password?token=${token}`;

    const recipients = [user.email];
    if (user.isGoogleLinked && user.googleEmail && user.googleEmail !== user.email) {
      recipients.push(user.googleEmail);
    }

    for (const email of recipients) {
      await sendResetEmail(email, resetUrl);
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

    await logAction({
      userId: user._id,
      action: "Reset password via token",
      req,
    });

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

    const updatedFields = [];
    if (req.body.username && req.body.username !== user.username) {
      user.username = req.body.username;
      updatedFields.push("username");
    }
    if (req.body.gender && req.body.gender !== user.gender) {
      user.gender = req.body.gender;
      updatedFields.push("gender");
    }
    if (req.body.phone && req.body.phone !== user.phone) {
      user.phone = req.body.phone;
      updatedFields.push("phone");
    }
    if (req.body.gmailEmail && req.body.gmailEmail !== user.gmailEmail) {
      user.gmailEmail = req.body.gmailEmail;
      updatedFields.push("gmailEmail");
    }
    if (req.body.accountEmail && req.body.accountEmail !== user.accountEmail) {
      user.accountEmail = req.body.accountEmail;
      updatedFields.push("accountEmail");
    }
    if (req.file) {
      user.avatar = `/avatars/${req.file.filename}`;
      updatedFields.push("avatar");
    }

    await user.save();

    if (updatedFields.length > 0) {
      await logAction({
        userId: user._id,
        action: "Updated profile",
        req,
        metadata: { fieldsChanged: updatedFields },
      });
    }

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
      isGoogleLinked: user.isGoogleLinked,
    });

  } catch (err) {
    console.error("❌ Personalize error:", err);
    res.status(500).json({ error: "Server error" });
  }
};

exports.logoutUser = async (req, res) => {
  try {
    await logAction({
      userId: req.user.id,
      action: "User logged out",
      req
    });

    res.json({ message: "Logged out" });
  } catch (err) {
    console.error("Logout log error:", err);
    res.status(500).json({ error: "Logout failed" });
  }
};

exports.resend2FA = async (req, res) => {
  try {
    const userId = req.body.userId;
    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ error: "User not found" });

    // Only allow for managers with Google linked (same as loginUser)
    if (user.role !== "manager" || !user.isGoogleLinked) {
      return res.status(400).json({ error: "2FA not enabled for this user" });
    }

    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const expires = Date.now() + 5 * 60 * 1000;
    temp2FACodes[user._id] = { code, expires };

    const sendTo = user.googleEmail || user.email;
    await send2FACode(sendTo, code);
    res.json({ message: "2FA code resent", tempUserId: user._id, sendTo });
  } catch (err) {
    console.error("resend2FA error:", err);
    res.status(500).json({ error: "Server error" });
  }
};