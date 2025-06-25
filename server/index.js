require("dotenv").config();
const express = require("express");
const cors = require("cors");
const app = express();

const sortaRoute = require("./routes/sorta");
const authRoutes = require("./routes/auth");

// 🧠 THESE MUST COME FIRST
app.use(cors({
  origin: 'http://localhost:5173',
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// 🛣️ ROUTES AFTER MIDDLEWARE
app.use("/api/sorta", sortaRoute);
app.use("/api/auth", authRoutes);

app.use(express.static("public")); // For file uploads later

app.get("/", (req, res) => {
  res.send("Sitesort AI backend running.");
});

const port = process.env.APP_PORT || 3001;
app.listen(port, () => {
  console.log(`Server started on http://localhost:${port}`);
});
