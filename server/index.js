require("dotenv").config();
const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
const app = express();

// ✅ Middleware
app.use(cors({
  origin: 'http://localhost:5173',
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(express.static("public")); // For file uploads

// ✅ Routes
const sortaRoute = require("./routes/sorta");
const authRoutes = require("./routes/auth");
app.use("/api/sorta", sortaRoute);
app.use("/api/auth", authRoutes);

// ✅ Test Route
app.get("/", (req, res) => {
  res.send("Sitesort AI backend running.");
});

// ✅ Connect to MongoDB THEN start server
const port = process.env.APP_PORT || 3001;

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

const adminRoutes = require('./routes/admin');
app.use('/api/admin', adminRoutes);

const { google } = require('googleapis');
const path = require('path');

// Step 1: Auth setup
const auth = new google.auth.GoogleAuth({
  keyFile: path.join(__dirname, 'dark-stratum-465506-u8-6a66584f85aa.json'), // replace with your file name
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

listDriveFiles().catch(console.error);
