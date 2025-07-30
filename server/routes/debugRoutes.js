const express = require("express");
const axios = require("axios");
const User = require("../models/User");
const router = express.Router();

// 🔍 Debug route to check scopes of stored Google token
router.get("/debug/google-scopes", async (req, res) => {
  const userId = "688a1e034a70d3cc89c7b7c4"; // your ID

  const user = await User.findById(userId);
  if (!user?.googleAccessToken) {
    return res.status(404).json({ error: "User not bound or missing token" });
  }

  try {
    const googleRes = await axios.get(
      `https://www.googleapis.com/oauth2/v1/tokeninfo?access_token=${user.googleAccessToken}`
    );
    res.json({
      scopes: googleRes.data.scope.split(" "),
      expires_in: googleRes.data.expires_in,
      audience: googleRes.data.audience
    });
  } catch (err) {
    res.status(500).json({ error: "Failed to verify token", details: err.message });
  }
});

module.exports = router;
