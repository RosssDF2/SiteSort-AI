const express = require('express');
const router = express.Router();
const { getFilesByProject, getFilesInFolder, getFileContent } = require('../controllers/fileController');

router.get('/', getFilesByProject); // GET /api/files?project=Block A Construction
router.get('/folder', getFilesInFolder); // /api/files/folder?folder=xxxxx
router.get('/content/:fileId', getFileContent); // GET /api/files/content/fileId - New route for file content

module.exports = router;
