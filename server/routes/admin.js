const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const User = require('../models/User');
const auth = require('../middlewares/authMiddleware');
const admin = require('../middlewares/adminMiddleware');

// Get all users
router.get('/users', auth, admin, async (req, res) => {
  const users = await User.find({}, '-password');
  res.json(users);
});

// Create new manager (with username)
router.post('/users', auth, admin, async (req, res) => {
  const { email, password, role, username } = req.body;

  const existing = await User.findOne({ email });
  if (existing) return res.status(400).json({ error: 'Email already exists' });

  const hashed = await bcrypt.hash(password, 10);
  const user = await User.create({ email, password: hashed, role, username });
  res.json(user);
});

// Edit user (username/password)
router.put('/users/:id', auth, admin, async (req, res) => {
  const { username, password } = req.body;
  const update = { username };

  if (password) {
    const hashed = await bcrypt.hash(password, 10);
    update.password = hashed;
  }

  const updated = await User.findByIdAndUpdate(req.params.id, update, { new: true });
  res.json({ message: 'User updated', user: updated });
});

// Update role
router.put('/users/:id/role', auth, admin, async (req, res) => {
  const { role } = req.body;
  const updated = await User.findByIdAndUpdate(req.params.id, { role }, { new: true });
  res.json({ message: 'Role updated', user: updated });
});

// Delete manager
router.delete('/users/:id', auth, admin, async (req, res) => {
  await User.findByIdAndDelete(req.params.id);
  res.json({ message: 'Deleted' });
});

module.exports = router;
