const ChatLog = require('../models/ChatLog');

// Get all chats for the authenticated user
exports.getChatsByUser = async (req, res) => {
  try {
    const chats = await ChatLog.find({ user: req.user.id })
      .sort({ createdAt: -1 })
      .select('-__v');
    res.json(chats);
  } catch (err) {
    console.error('Error fetching chats:', err);
    res.status(500).json({ error: 'Failed to fetch chats' });
  }
};

// Save a new chat
exports.saveChat = async (req, res) => {
  try {
    const { title, messages } = req.body;
    
    if (!messages || !Array.isArray(messages)) {
      return res.status(400).json({ error: 'Valid messages array is required' });
    }

    const chat = await ChatLog.create({
      user: req.user.id,
      title: title || messages[0]?.text?.slice(0, 30) || 'New Chat',
      messages,
      createdAt: new Date(),
      updatedAt: new Date()
    });

    res.status(201).json(chat);
  } catch (err) {
    console.error('Error saving chat:', err);
    res.status(500).json({ error: 'Failed to save chat' });
  }
};

// Update an existing chat
exports.updateChat = async (req, res) => {
  try {
    const { chatId } = req.params;
    const { title, messages } = req.body;

    // Find chat and verify ownership
    const chat = await ChatLog.findOne({ _id: chatId, user: req.user.id });
    
    if (!chat) {
      return res.status(404).json({ error: 'Chat not found or unauthorized' });
    }

    // Update the chat
    chat.title = title || chat.title;
    if (messages && Array.isArray(messages)) {
      chat.messages = messages;
    }
    chat.updatedAt = new Date();

    await chat.save();
    res.json(chat);
  } catch (err) {
    console.error('Error updating chat:', err);
    res.status(500).json({ error: 'Failed to update chat' });
  }
};

// Delete a chat
exports.deleteChat = async (req, res) => {
  try {
    const { chatId } = req.params;
    
    // Find and delete chat, ensuring it belongs to the user
    const result = await ChatLog.deleteOne({ _id: chatId, user: req.user.id });
    
    if (result.deletedCount === 0) {
      return res.status(404).json({ error: 'Chat not found or unauthorized' });
    }
    
    res.json({ message: 'Chat deleted successfully' });
  } catch (err) {
    console.error('Error deleting chat:', err);
    res.status(500).json({ error: 'Failed to delete chat' });
  }
};
