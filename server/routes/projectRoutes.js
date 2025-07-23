const express = require('express');
const router = express.Router();
const { createProject } = require('../controllers/projectController');
const { listProjects } = require('../controllers/projectController');

router.post('/', createProject); // POST /api/projects
router.get('/', listProjects); // GET /api/projects

module.exports = router;
