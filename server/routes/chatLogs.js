const express = require('express');
const router = express.Router();
const chatLogController = require('../controllers/chatLogController');
const authenticateToken = require('../middlewares/authMiddleware'); // ✅ MATCHES your export

router.post('/chatlog', authenticateToken, chatLogController.saveChat);
router.get('/chatlog', authenticateToken, chatLogController.getChatsByUser);
module.exports = router;
