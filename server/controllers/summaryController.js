const Summary = require('../models/Summary');

exports.getSummaries = async (req, res) => {
  try {
    const summaries = await Summary.find({ user: req.user.id })
      .sort({ createdAt: -1 })
      .populate('chatId', 'title')
      .select('-__v');
    res.json(summaries);
  } catch (err) {
    console.error('Error fetching summaries:', err);
    res.status(500).json({ error: 'Failed to fetch summaries' });
  }
};

exports.createSummary = async (req, res) => {
  try {
    const { content, chatId } = req.body;
    
    if (!content) {
      return res.status(400).json({ error: 'Content is required' });
    }

    const summary = await Summary.create({
      user: req.user.id,
      content,
      chatId,
      createdAt: new Date(),
      updatedAt: new Date()
    });

    res.status(201).json(summary);
  } catch (err) {
    console.error('Error creating summary:', err);
    res.status(500).json({ error: 'Failed to create summary' });
  }
};

exports.deleteSummary = async (req, res) => {
  try {
    const { summaryId } = req.params;
    
    const result = await Summary.deleteOne({
      _id: summaryId,
      user: req.user.id
    });
    
    if (result.deletedCount === 0) {
      return res.status(404).json({ error: 'Summary not found or unauthorized' });
    }
    
    res.json({ message: 'Summary deleted successfully' });
  } catch (err) {
    console.error('Error deleting summary:', err);
    res.status(500).json({ error: 'Failed to delete summary' });
  }
};
