const express = require('express');
const router = express.Router();
const { getFilesByProject, getFilesInFolder } = require('../controllers/fileController');

router.get('/', getFilesByProject); // GET /api/files?project=Block A Construction
router.get('/folder', getFilesInFolder); // /api/files/folder?folder=xxxxx

module.exports = router;
