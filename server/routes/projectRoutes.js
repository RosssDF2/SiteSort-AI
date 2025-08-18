const express = require('express');
const router = express.Router();
const { createProject, listProjects, getProjectStats } = require('../controllers/projectController');

router.post('/', createProject); // POST /api/projects
router.get('/', listProjects); // GET /api/projects
router.get('/:id/stats', getProjectStats);  // <-- added

module.exports = router;
