require("dotenv").config();
const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
const session = require("express-session");
const passport = require("passport");
const path = require("path");
const { google } = require("googleapis");
const logRoutes = require("./routes/logs");
const insightRoutes = require("./routes/insightRoutes");
const dashboard = require("./routes/dashboard");
const app = express();
const port = process.env.APP_PORT || 3001;

// ✅ Middleware
app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:5173',
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(express.static("public"));
app.use("/api/insights", insightRoutes);
app.use("/api/dashboard", dashboard);

// ✅ Session & Passport
app.use(session({
  secret: process.env.SESSION_SECRET || "super-secret",
  resave: false,
  saveUninitialized: false,
}));
app.use(passport.initialize());
app.use(passport.session());
require("./config/passport"); // Google bind strategy

// ✅ Routes
const sortaRoute = require("./routes/sorta");
const authRoutes = require("./routes/auth");
const adminRoutes = require("./routes/admin");

app.use("/api/sorta", sortaRoute);
app.use("/api/auth", authRoutes);
app.use("/api/admin", adminRoutes);

// ✅ Test Route
app.get("/", (req, res) => {
  res.send("Sitesort AI backend running.");
});

// ✅ Connect to MongoDB THEN start server
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

// ✅ Google Drive integration (optional feature, kept at bottom)
const auth = new google.auth.GoogleAuth({
  keyFile: path.join(__dirname, 'dark-stratum-465506-u8-6a66584f85aa.json'),
  scopes: ['https://www.googleapis.com/auth/drive'],
});

async function listDriveFiles() {
  const authClient = await auth.getClient();
  const drive = google.drive({ version: 'v3', auth: authClient });

  const folderId = '1C4linCEdD24PPVWPmtFhrRXC4C9GhuPR'; // Replace with your folder ID

  const res = await drive.files.list({
    q: `'${folderId}' in parents`,
    fields: 'files(id, name)',
  });

  console.log('Files:', res.data.files);
}

app.use("/avatars", express.static("public/avatars"));
app.use("/api/logs", logRoutes);


listDriveFiles().catch(console.error);
