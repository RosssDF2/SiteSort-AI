const Report = require('../models/Report');

exports.getReports = async (req, res) => {
  try {
    const reports = await Report.find({ user: req.user.id })
      .sort({ createdAt: -1 })
      .populate('chatId', 'title')
      .select('-__v');
    res.json(reports);
  } catch (err) {
    console.error('Error fetching reports:', err);
    res.status(500).json({ error: 'Failed to fetch reports' });
  }
};

exports.createReport = async (req, res) => {
  try {
    const { content, chatId } = req.body;
    
    if (!content) {
      return res.status(400).json({ error: 'Content is required' });
    }

    const report = await Report.create({
      user: req.user.id,
      content,
      chatId,
      createdAt: new Date(),
      updatedAt: new Date()
    });

    res.status(201).json(report);
  } catch (err) {
    console.error('Error creating report:', err);
    res.status(500).json({ error: 'Failed to create report' });
  }
};

exports.deleteReport = async (req, res) => {
  try {
    const { reportId } = req.params;
    
    const result = await Report.deleteOne({
      _id: reportId,
      user: req.user.id
    });
    
    if (result.deletedCount === 0) {
      return res.status(404).json({ error: 'Report not found or unauthorized' });
    }
    
    res.json({ message: 'Report deleted successfully' });
  } catch (err) {
    console.error('Error deleting report:', err);
    res.status(500).json({ error: 'Failed to delete report' });
  }
};
