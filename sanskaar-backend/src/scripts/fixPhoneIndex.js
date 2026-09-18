require('dotenv').config();
const mongoose = require('mongoose');

const run = async () => {
  await mongoose.connect(process.env.MONGO_URI);

  const indexes = await mongoose.connection.collection('users').indexes();
  console.log('Current indexes on users collection:');
  console.log(indexes.map((i) => i.name));

  const hasPhoneIndex = indexes.some((i) => i.name === 'phone_1');
  if (!hasPhoneIndex) {
    console.log('No phone_1 index found — nothing to drop. You are done.');
  } else {
    await mongoose.connection.collection('users').dropIndex('phone_1');
    console.log('Dropped old phone_1 index.');
  }

  // Recreate it as a sparse unique index so Google-signup users (no phone) don't collide
  await mongoose.connection.collection('users').createIndex(
    { phone: 1 },
    { unique: true, sparse: true, name: 'phone_1' }
  );
  console.log('Recreated phone_1 as a sparse unique index. Done.');

  await mongoose.disconnect();
  process.exit(0);
};

run().catch((err) => {
  console.error('Script failed:', err.message);
  process.exit(1);
});