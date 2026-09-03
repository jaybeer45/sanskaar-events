require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../models/User');

const run = async () => {
  await mongoose.connect(process.env.MONGO_URI);

  const users = await mongoose.connection.collection('users').find({ role: { $exists: true } }).toArray();

  console.log(`Found ${users.length} users with an old 'role' field.`);

  for (const u of users) {
    const roles = Array.from(new Set(['user', u.role]));

    await mongoose.connection.collection('users').updateOne(
      { _id: u._id },
      { $set: { roles }, $unset: { role: '' } }
    );
    console.log(`Migrated ${u._id}: role="${u.role}" -> roles=${JSON.stringify(roles)}`);
  }

  console.log('Migration complete.');
  await mongoose.disconnect();
};

run().catch((err) => {
  console.error(err);
  process.exit(1);
});