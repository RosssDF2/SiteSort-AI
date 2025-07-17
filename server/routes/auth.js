const express = require("express");
const router = express.Router();
const passport = require("passport");
const jwt = require("jsonwebtoken");
const User = require("../models/User");
require("../config/passport");

const { loginUser, verify2FA } = require("../controllers/authController");

// ✅ Login & 2FA
router.post("/login", loginUser);
router.post("/verify-2fa", verify2FA);

// ✅ Step 0: Initiate secure bind (JWT → Session)
router.post("/bind/initiate", (req, res) => {
  const authHeader = req.headers.authorization;
  const token = authHeader?.split(" ")[1];

  if (!token) return res.status(401).json({ error: "Unauthorized" });

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    req.session.tempUserId = payload.id;
    res.json({ redirectUrl: "/api/auth/google/bind" }); // ✅ correct path
  } catch (err) {
    return res.status(401).json({ error: "Invalid or expired token" });
  }
});

// ✅ Step 1: Start Google OAuth
router.get("/google/bind", (req, res, next) => {
  if (!req.session.tempUserId) {
    return res.status(401).json({ error: "Session expired or not authorized." });
  }

  passport.authenticate("google-bind", { scope: ["profile", "email"] })(req, res, next);
});

// ✅ Step 2: Google OAuth Callback
router.get("/google/callback",
  passport.authenticate("google-bind", {
    session: false,
    failureRedirect: "/login"
  }),
  (req, res) => {
    const token = jwt.sign({ id: req.user._id }, process.env.JWT_SECRET, {
      expiresIn: "15m"
    });

    res.redirect(`${process.env.CLIENT_URL}/bind/success?token=${token}`);
  }
);

// ✅ Step 3: Finalize binding on frontend
router.post("/google/bind/callback", async (req, res) => {
  const { token } = req.body;

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(payload.id);

    if (!user || !user.isGoogleLinked) {
      return res.status(401).json({ error: "Google account not properly linked." });
    }

    const fullToken = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
      expiresIn: "7d"
    });

    res.json({ jwt: fullToken, user });
  } catch (err) {
    console.error("Google bind finalization error:", err);
    res.status(401).json({ error: "Invalid or expired token." });
  }
});

// ✅ Get current user info
router.get("/me", (req, res) => {
  const authHeader = req.headers.authorization;
  const token = authHeader?.split(" ")[1];
  if (!token) return res.status(401).json({ error: "Unauthorized" });

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    User.findById(payload.id).then(user => {
      if (!user) return res.status(404).json({ error: "User not found" });
      res.json({ user });
    });
  } catch (err) {
    res.status(401).json({ error: "Invalid token" });
  }
});

router.get("/check-google-link", async (req, res) => {
  const authHeader = req.headers.authorization;
  const token = authHeader?.split(" ")[1];
  if (!token) return res.status(401).json({ error: "Unauthorized" });

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(payload.id);
    res.json({ isGoogleLinked: user?.isGoogleLinked || false });
  } catch (err) {
    res.status(401).json({ error: "Invalid token" });
  }
});

router.post("/google/unbind", async (req, res) => {
  const authHeader = req.headers.authorization;
  const token = authHeader?.split(" ")[1];
  if (!token) return res.status(401).json({ error: "Unauthorized" });

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(payload.id);
    if (!user) return res.status(404).json({ error: "User not found" });

    user.googleId = undefined;
    user.isGoogleLinked = false;
    await user.save();

    res.json({ message: "Google account unlinked" });
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
});

module.exports = router;
