// /server/routes/genassistant.js

const express = require('express');
const fs = require('fs');
const path = require('path');
const router = express.Router();

const filePath = path.join(__dirname, '..', 'data', 'messages.json');

// Utility to read JSON file
const readMessages = () => {
  try {
    const data = fs.readFileSync(filePath);
    return JSON.parse(data);
  } catch {
    return [];
  }
};

// Utility to write JSON file
const saveMessages = (messages) => {
  fs.writeFileSync(filePath, JSON.stringify(messages, null, 2));
};

// GET all messages
router.get('/', (req, res) => {
  const messages = readMessages();
  res.json(messages);
});

// POST new message
router.post('/', (req, res) => {
  const messages = readMessages();
  const newMsg = {
    id: Date.now().toString(), // Simple unique ID
    text: req.body.text,
    sender: req.body.sender,
  };
  messages.push(newMsg);
  saveMessages(messages);
  res.status(201).json(newMsg);
});

// PUT update message
router.put('/:id', (req, res) => {
  const messages = readMessages();
  const idx = messages.findIndex((msg) => msg.id === req.params.id);

  if (idx === -1) return res.status(404).json({ error: 'Message not found' });

  messages[idx].text = req.body.text;
  saveMessages(messages);
  res.json(messages[idx]);
});

// DELETE message
router.delete('/:id', (req, res) => {
  let messages = readMessages();
  const idx = messages.findIndex((msg) => msg.id === req.params.id);

  if (idx === -1) return res.status(404).json({ error: 'Message not found' });

  messages.splice(idx, 1);
  saveMessages(messages);
  res.status(204).end();
});

// Dummy AI reply endpoint for now
router.post('/ask', (req, res) => {
  const prompt = req.body.prompt || '';
  const dummyResponse = {
    reply: `You said: "${prompt}" – AI reply will go here.`,
  };
  res.json(dummyResponse);
});

module.exports = router;
