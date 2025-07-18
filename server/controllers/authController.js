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

exports.temp2FACodes = temp2FACodes;
