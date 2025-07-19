const express = require("express");
const router = express.Router();
const passport = require("passport");
const jwt = require("jsonwebtoken");
const User = require("../models/User");
require("../config/passport");
const authMiddleware = require("../middlewares/authMiddleware");
const { logoutUser } = require("../controllers/authController");

const { loginUser, verify2FA } = require("../controllers/authController");
const upload = require("../middlewares/uploadMiddleware");
const { personalizeUser } = require("../controllers/authController");

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
    failureRedirect: `${process.env.CLIENT_URL}/profile?error=google_already_bound`
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

router.post(
  "/personalize",
  authMiddleware,
  upload.single("avatar"),
  personalizeUser
);

// 🌐 GOOGLE LOGIN FLOW
// Step 1: Initiate Google Login
router.get("/google/login", passport.authenticate("google-login", { scope: ["profile", "email"] }));

// Step 2: Google Login Callback
router.get("/google/login/callback",
  passport.authenticate("google-login", {
    failureRedirect: `${process.env.CLIENT_URL}/login?error=notbound`,  // 🔁 frontend URL
    session: false,
  }),
  (req, res) => {
    if (!req.user) {
      return res.redirect(`${process.env.CLIENT_URL}/login?error=notbound`);
    }

    const token = jwt.sign({ id: req.user._id }, process.env.JWT_SECRET, {
      expiresIn: "7d"
    });

    // Redirect with token back to frontend
    res.redirect(`${process.env.CLIENT_URL}/google-login-success?token=${token}`);
  }
);

const { requestPasswordReset, resetPasswordWithToken } = require("../controllers/authController");

router.post("/request-reset", requestPasswordReset);
router.post("/reset-password", resetPasswordWithToken);

const logAction = require("../utils/logAction");

router.post("/logout", authMiddleware, logoutUser);

// 🔐 Admin creates a new user (e.g., manager)
router.post("/admin/users", authMiddleware, async (req, res) => {
  const { email, password, role, username } = req.body;
  if (!email || !password || !role || !username) {
    return res.status(400).json({ error: "Missing required fields" });
  }

  try {
    const existing = await User.findOne({ email });
    if (existing) return res.status(409).json({ error: "Email already exists" });

    const hashed = await bcrypt.hash(password, 10);

    const newUser = await User.create({
      email,
      password: hashed,
      role,
      username
    });

    await logAction({
      userId: req.user.id,
      action: `Created user (${role})`,
      req,
      metadata: { createdUserId: newUser._id }
    });

    res.status(201).json({ message: "User created", userId: newUser._id });
  } catch (err) {
    console.error("❌ Error creating user:", err);
    res.status(500).json({ error: "Failed to create user" });
  }
});

// 🔍 Admin fetches all users (except self)
router.get("/admin/users", authMiddleware, async (req, res) => {
  try {
    const users = await User.find({ _id: { $ne: req.user.id } });
    res.json(users);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch users" });
  }
});

// ✏️ Admin updates a user (username/password only)
router.put("/admin/users/:id", authMiddleware, async (req, res) => {
  const { username, password } = req.body;

  try {
    const updates = {};
    if (username) updates.username = username;
    if (password) updates.password = await bcrypt.hash(password, 10);

    const updated = await User.findByIdAndUpdate(req.params.id, updates, { new: true });
    if (!updated) return res.status(404).json({ error: "User not found" });

    await logAction({
      userId: req.user.id,
      action: `Updated user (${updated.email})`,
      req
    });

    res.json({ message: "User updated" });
  } catch (err) {
    res.status(500).json({ error: "Failed to update user" });
  }
});

// 🗑 Admin deletes a user
router.delete("/admin/users/:id", authMiddleware, async (req, res) => {
  try {
    const deleted = await User.findByIdAndDelete(req.params.id);
    if (!deleted) return res.status(404).json({ error: "User not found" });

    await logAction({
      userId: req.user.id,
      action: `Deleted user (${deleted.email})`,
      req
    });

    res.json({ message: "User deleted" });
  } catch (err) {
    res.status(500).json({ error: "Failed to delete user" });
  }
});


module.exports = router;
