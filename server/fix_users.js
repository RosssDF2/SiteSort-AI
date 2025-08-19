// Script to fix missing usernames and unlock all users (admin rescue)
const mongoose = require('mongoose');
const User = require('./models/User');

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/sitesort';

async function fixUsers() {
  await mongoose.connect(MONGO_URI);
  const users = await User.find({ $or: [ { username: { $exists: false } }, { username: '' }, { isLocked: true } ] });
  for (const user of users) {
    if (!user.username || user.username === '') {
      user.username = user.email.split('@')[0] || 'user';
    }
    user.isLocked = false;
    user.failedLoginAttempts = 0;
    user.lockUntil = null;
    await user.save();
    console.log(`Fixed user: ${user.email}`);
  }
  console.log('Done.');
  process.exit();
}

fixUsers().catch(e => { console.error(e); process.exit(1); });
