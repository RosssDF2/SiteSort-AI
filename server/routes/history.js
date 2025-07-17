// server/routes/history.js
const express = require('express');
const router = express.Router();

let chatHistory = [];
let nextId = 1;

// GET all saved chats
router.get('/', (req, res) => {
  res.json(chatHistory);
});

// POST new chat entry
router.post('/', (req, res) => {
  const { prompt, response, attachedFiles = [] } = req.body;
  const newChat = {
    id: nextId++,
    prompt,
    response,
    attachedFiles,
    createdAt: new Date(),
  };
  chatHistory.push(newChat);
  res.status(201).json(newChat);
});

// PUT update a chat
router.put('/:id', (req, res) => {
  const id = parseInt(req.params.id);
  const index = chatHistory.findIndex((c) => c.id === id);
  if (index === -1) return res.status(404).json({ error: 'Not found' });

  const { prompt, response, attachedFiles } = req.body;
  chatHistory[index] = {
    ...chatHistory[index],
    prompt: prompt || chatHistory[index].prompt,
    response: response || chatHistory[index].response,
    attachedFiles: attachedFiles || chatHistory[index].attachedFiles,
  };
  res.json(chatHistory[index]);
});

// DELETE a chat entry
router.delete('/:id', (req, res) => {
  const id = parseInt(req.params.id);
  chatHistory = chatHistory.filter((c) => c.id !== id);
  res.json({ message: 'Deleted' });
});

module.exports = router;
