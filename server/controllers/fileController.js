// server/controllers/fileController.js
const path = require('path');
const File = require('../models/File');

exports.handleUpload = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    // Save file info to DB (optional, if you have a File model)
    const file = new File({
      filename: req.file.filename,
      originalname: req.file.originalname,
      mimetype: req.file.mimetype,
      size: req.file.size,
      path: req.file.path,
      uploadDate: new Date()
    });
    await file.save();

    res.status(200).json({ message: 'File uploaded successfully', file: req.file });
  } catch (err) {
    res.status(500).json({ error: 'File upload failed', details: err.message });
  }
};