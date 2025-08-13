// Example Express routes in server/routes/savedItems.js

const express = require('express');
const router = express.Router();

const summaries = []; // replace with DB in prod
const reports = []; // replace with DB in prod

router.post('/summaries', (req, res) => {
  const { content, chatId, timestamp } = req.body;
  if (!content) return res.status(400).json({ error: "No content provided" });

  const newSummary = { id: summaries.length + 1, content, chatId, timestamp };
  summaries.push(newSummary);
  res.json(newSummary);
});

router.post('/reports', (req, res) => {
  const { content, chatId, timestamp } = req.body;
  if (!content) return res.status(400).json({ error: "No content provided" });

  const newReport = { id: reports.length + 1, content, chatId, timestamp };
  reports.push(newReport);
  res.json(newReport);
});

router.get('/reports', (req, res) => {
  res.json(reports);
});

module.exports = router;
