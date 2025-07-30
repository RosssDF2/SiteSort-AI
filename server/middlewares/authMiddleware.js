const jwt = require("jsonwebtoken");
const User = require("../models/User");

async function validateToken(req, res, next) {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];

  if (!token) {
    return res.status(401).json({ error: "Missing token" });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    // ✅ Only enforce Google check if required
    if (req.requireGoogle && (!user.isGoogleLinked || !user.googleAccessToken)) {
      return res.status(403).json({ error: "Google not linked" });
    }

    req.user = user;
    next();
  } catch (err) {
    return res.status(403).json({ error: "Invalid token" });
  }
}

module.exports = validateToken;
