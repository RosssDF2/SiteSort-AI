require("dotenv").config();
const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
const session = require("express-session");
const passport = require("passport");
const path = require("path");

const app = express();
const port = process.env.APP_PORT || 3001;

// ✅ Route imports
const logRoutes = require("./routes/logs");
const insightRoutes = require("./routes/insightRoutes");
const dashboard = require("./routes/dashboard");
const projectRoutes = require('./routes/projectRoutes');
const fileRoutes = require('./routes/fileRoutes');
const budgetRoutes = require("./routes/budgetRoutes");
const chatRoutes = require("./routes/chatRoutes");
const enquiryRoutes = require("./routes/EnquiryRoutes");
const chatLogRoutes = require('./routes/chatLogs');
const uploadRoutes = require("./routes/uploadRoutes");
const sortaRoute = require("./routes/sorta");
const authRoutes = require("./routes/auth");
const adminRoutes = require("./routes/admin");
const driveRoutes = require("./routes/driveRoutes");
const debugRoutes = require("./routes/debugRoutes");
const summaryRoutes = require("./routes/summaries");
const reportRoutes = require("./routes/reports");
const pdfRoutes = require("./routes/pdfRoutes");


// 🆕 You will re-add /api/drive once your OAuth drive route is implemented

// ✅ Middleware
app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:5173',
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(express.static("public"));

// ✅ Session & Passport (for Google OAuth)
app.use(session({
  secret: process.env.SESSION_SECRET || "super-secret",
  resave: false,
  saveUninitialized: false,
}));
app.use(passport.initialize());
app.use(passport.session());
require("./config/passport"); // Google bind strategy

// ✅ Static route for avatars
app.use("/avatars", express.static("public/avatars"));

// ✅ API Routes
app.use("/api/sorta", sortaRoute);
app.use("/api/auth", authRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/logs", logRoutes);
app.use("/api/insights", insightRoutes);
app.use("/api/dashboard", dashboard);
app.use("/api/projects", projectRoutes);
app.use("/api/files", fileRoutes);
app.use("/api/budget", budgetRoutes);
app.use("/api/enquiry", enquiryRoutes);
app.use("/api/chat", chatRoutes);
app.use("/api/upload", uploadRoutes);
app.use("/api", chatLogRoutes); // fallback route for other chat logs
// ❌ Removed: app.use("/api/drive", driveRoutes);
app.use("/api/drive", driveRoutes);
app.use("/api", debugRoutes);
app.use("/api/summaries", summaryRoutes);
app.use("/api/reports", reportRoutes);
app.use("/api/pdf", pdfRoutes);


// ✅ Default route
app.get("/", (req, res) => {
  res.send("Sitesort AI backend running.");
});

// ✅ MongoDB Connect THEN start server
mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
  .then(() => {
    console.log("✅ MongoDB connected");
    app.listen(port, () => {
      console.log(`🚀 Server started on http://localhost:${port}`);
    });
  })
  .catch(err => {
    console.error("❌ MongoDB connection error:", err);
  });
