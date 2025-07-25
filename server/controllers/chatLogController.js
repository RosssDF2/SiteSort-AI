const ChatLog = require('../models/ChatLog');

exports.saveChat = async (req, res) => {
  const { prompt, response } = req.body;
  const userId = req.user.id; // from auth middleware

  if (!prompt || !response) return res.status(400).json({ error: 'Prompt and response required' });

  try {
    const chat = await ChatLog.create({ userId, prompt, response });
    res.status(201).json(chat);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to save chat' });
  }
};

exports.getChatsByUser = async (req, res) => {
  try {
    const chats = await ChatLog.find({ userId: req.user.id }).sort({ timestamp: -1 });
    res.json(chats);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch chats' });
  }
};
