require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const User = require('./models/User');

mongoose.connect(process.env.MONGO_URI).then(async () => {
  const existing = await User.findOne({ email: 'manager@sitesort.com' });
  if (!existing) {
    const hashed = await bcrypt.hash('password123', 10);
    await User.create({
      email: 'manager@sitesort.com',
      password: hashed,
      role: 'manager'
    });
    console.log('✅ Seeded manager user to Atlas');
  } else {
    console.log('⚠️ User already exists in Atlas');
  }
  mongoose.disconnect();
});
