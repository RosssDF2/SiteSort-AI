require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const User = require('./models/User');

mongoose.connect(process.env.MONGO_URI).then(async () => {
  const usersToSeed = [
    {
      email: 'manager@sitesort.com',
      password: 'password123',
      role: 'manager',
    },
    {
      email: 'admin@sitesort.com',
      password: 'adminpass321',
      role: 'admin',
    }
  ];

  for (const user of usersToSeed) {
    const existing = await User.findOne({ email: user.email });
    if (!existing) {
      const hashed = await bcrypt.hash(user.password, 10);
      await User.create({
        email: user.email,
        password: hashed,
        role: user.role
      });
      console.log(`✅ Seeded user: ${user.email}`);
    } else {
      console.log(`⚠️ User already exists: ${user.email}`);
    }
  }

  mongoose.disconnect();
});
