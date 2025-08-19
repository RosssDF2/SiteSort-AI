const passport = require("passport");
const GoogleStrategy = require("passport-google-oauth20").Strategy;
const User = require('../models/User');

// ✅ Google OAuth Scopes (Drive + Profile + Email)
const GOOGLE_SCOPES = [
  "https://www.googleapis.com/auth/drive",
  "https://www.googleapis.com/auth/drive.file",
  "https://www.googleapis.com/auth/drive.metadata",
  "https://www.googleapis.com/auth/drive.appdata",
  "https://www.googleapis.com/auth/drive.metadata.readonly",
  "https://www.googleapis.com/auth/userinfo.email",
  "https://www.googleapis.com/auth/userinfo.profile",
  "openid"
];

console.log("📌 Using Google OAuth scopes:", GOOGLE_SCOPES);

// 🔗 Google BIND Strategy
passport.use("google-bind", new GoogleStrategy(
  {
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: "http://localhost:3001/api/auth/google/callback",
    passReqToCallback: true,
    scope: GOOGLE_SCOPES,
    accessType: "offline",
    prompt: "consent"
  },
  async (req, accessToken, refreshToken, profile, done) => {
    console.log("\n🚀 Google BIND triggered");
    try {
      const loggedInUserId = req.session.tempUserId;
      console.log("🧾 tempUserId:", loggedInUserId);

      if (!loggedInUserId) {
        console.log("❌ No session found.");
        return done(null, false);
      }

      const user = await User.findById(loggedInUserId);
      if (!user) {
        console.log("❌ User not found:", loggedInUserId);
        return done(null, false);
      }

      // Check if Google account is already bound to another user
      const existingGoogleUser = await User.findOne({ googleId: profile.id });
      if (existingGoogleUser && existingGoogleUser._id.toString() !== user._id.toString()) {
        console.log("❌ Google account already bound to another user");
        return done(null, false, { message: "This Google account is already bound to another SiteSort account" });
      }

      console.log("🔗 Binding account:", profile.displayName);
      console.log("📧 Google Email:", profile.emails?.[0]?.value);
      console.log("🔑 Access Token (short):", accessToken?.slice(0, 20), "...");
      if (refreshToken) console.log("🔄 Refresh Token (short):", refreshToken?.slice(0, 20), "...");

      user.googleId = profile.id;
      user.isGoogleLinked = true;
      user.googleEmail = profile.emails?.[0]?.value || "";
      user.googleAccessToken = accessToken;

      if (refreshToken) {
        user.googleRefreshToken = refreshToken;
      }

      await user.save();
      console.log("✅ Google bind complete for", user.email);
      return done(null, user);
    } catch (err) {
      console.error("❌ Google bind error:", err);
      return done(err);
    }
  }
));

// 🔐 Google LOGIN Strategy
passport.use("google-login", new GoogleStrategy(
  {
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: "/api/auth/google/login/callback",
    scope: GOOGLE_SCOPES,
    accessType: "offline",
    prompt: "consent"
  },
  async (accessToken, refreshToken, profile, done) => {
    console.log("\n🚪 Google LOGIN triggered");
    try {
      const existingUser = await User.findOne({ googleId: profile.id });
      if (!existingUser) {
        console.log("❌ No user found for Google ID:", profile.id);
        return done(null, false);
      }

      console.log("🔐 Refreshing access for:", existingUser.email);
      console.log("🆕 Access Token (short):", accessToken?.slice(0, 20), "...");
      if (refreshToken) console.log("🔁 Refresh Token (short):", refreshToken?.slice(0, 20), "...");

      existingUser.googleAccessToken = accessToken;

      if (refreshToken) {
        existingUser.googleRefreshToken = refreshToken;
      }

      await existingUser.save();
      console.log("✅ Google login refreshed for", existingUser.email);
      return done(null, existingUser);
    } catch (err) {
      console.error("❌ Google login error:", err);
      return done(err, false);
    }
  }
));

module.exports = passport;
