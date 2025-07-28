const passport = require("passport");
const GoogleStrategy = require("passport-google-oauth20").Strategy;
const User = require('../models/User'); // your User model

passport.use("google-bind", new GoogleStrategy({
  clientID: process.env.GOOGLE_CLIENT_ID,
  clientSecret: process.env.GOOGLE_CLIENT_SECRET,
  callbackURL: "http://localhost:3001/api/auth/google/callback",
  passReqToCallback: true
}, async (req, accessToken, refreshToken, profile, done) => {
  try {
    const loggedInUserId = req.session.tempUserId;
    if (!loggedInUserId) return done(null, false);

    const user = await User.findById(loggedInUserId);
    if (!user) return done(null, false);

    user.googleId = profile.id;
    user.isGoogleLinked = true;
    user.googleEmail = profile.emails[0].value;
    user.googleAccessToken = accessToken; // ✅ Save this to DB

    await user.save();

    return done(null, user);
  } catch (err) {
    // 👇 Catch MongoDB duplicate key error (code 11000)
    if (err.code === 11000) {
      req.session.googleBindError = "duplicate";
      return done(null, false);
    }
    return done(err);
  }
}));


passport.use("google-login", new GoogleStrategy({
  clientID: process.env.GOOGLE_CLIENT_ID,
  clientSecret: process.env.GOOGLE_CLIENT_SECRET,
  callbackURL: "/api/auth/google/login/callback"
}, async (accessToken, refreshToken, profile, done) => {
  try {
    const existingUser = await User.findOne({ googleId: profile.id });
    if (!existingUser) return done(null, false); // Not bound

    return done(null, existingUser);
  } catch (err) {
    return done(err, false);
  }
}));