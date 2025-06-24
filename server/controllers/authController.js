const jwt = require("jsonwebtoken");
const users = require("../models/User");

let temp2FACodes = {}; // key = user.id, value = { code, expires }

exports.loginUser = (req, res) => {
  const { email, password } = req.body;

  const user = users.find((u) => u.email === email);
  console.log("Input email:", email);
  console.log("Found user:", user);
  console.log("Input password:", password);

  if (!user || password !== "password123") {
    return res.status(400).json({ error: "Invalid email or password" });
  }

  // ✅ Generate 2FA code
  const code = Math.floor(100000 + Math.random() * 900000).toString();
  const expires = Date.now() + 5 * 60 * 1000; // 5 mins

  temp2FACodes[user.id] = { code, expires };

  console.log(`Generated 2FA code for ${email}:`, code); // dev only

  // Return only temp user ID (simulate verification step)
  res.json({
    message: "2FA code sent",
    tempUserId: user.id,
    code, // REMOVE this line in prod
  });
};

// Export 2FA storage for verification use
exports.temp2FACodes = temp2FACodes;

exports.verify2FA = (req, res) => {
  const { userId, code } = req.body;
  const user = users.find((u) => u.id === userId);
  const twoFA = temp2FACodes[userId];

  if (!user || !twoFA || code !== twoFA.code || Date.now() > twoFA.expires) {
    return res.status(401).json({ error: "Invalid or expired 2FA code" });
  }

  delete temp2FACodes[userId]; // clear once used

  const token = jwt.sign(
    { id: user.id, email: user.email, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: "1h" }
  );

  res.json({ token, user: { id: user.id, email: user.email, role: user.role } });
};
