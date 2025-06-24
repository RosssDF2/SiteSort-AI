require("dotenv").config();
const express = require("express");
const cors = require("cors");
const app = express();

app.use(cors({ origin: process.env.CLIENT_URL }));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(express.static("public")); // For file uploads later

app.get("/", (req, res) => {
  res.send("Sitesort AI backend running.");
});

const port = process.env.APP_PORT || 3001;
app.listen(port, () => {
  console.log(`Server started on http://localhost:${port}`);
});

const authRoutes = require("./routes/auth");
app.use("/api/auth", authRoutes);

