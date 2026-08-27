// src/scripts/seed.js
require('dotenv').config();
const mongoose = require('mongoose');
const connectDB = require('../config/db');

const User = require('../models/User');
const Event = require('../models/Event');
const Vendor = require('../models/Vendor');

const mockEvents = require('../../../sanskaar-events/src/mock/events.json');
const mockVendors = require('../../../sanskaar-events/src/mock/vendors.json');

const CATEGORY_MAP = {
  photographer: 'event-planner',
};

const run = async () => {
  await connectDB();

  // ── Purana seeded data hatao (safe re-run ke liye) ──────────
  await Event.deleteMany({});
  await Vendor.deleteMany({});
  await User.deleteMany({ email: { $regex: '^seed' } });

  // ── 1. Ek demo organizer user banao (events ke liye) ────────
  const organizer = await User.create({
    name: 'Sanskaar Events',
    email: 'seed.organizer@sanskaar.com',
    phone: '9990000001',
    password: 'password123',
    role: 'organizer',
  });

  const admin = await User.create({
  name: 'Super Admin',
  email: 'seed.admin@sanskaar.com',
  phone: '9990000000',
  password: 'password123',
  role: 'admin',
});

  // ── 2. mock events.json ko Event schema mein daalo ──────────
  const eventsToInsert = mockEvents.map((e , i) => ({
    title: e.title,
    description: e.description || '',
    category: e.category,
    images: e.images || [],
    date: (() => {
  const d = new Date();
  d.setDate(d.getDate() + (i % 3)); // aaj, kal, parso mein spread karega
  d.setHours(0, 0, 0, 0);
  return d;
})(),
    time: e.time,
    venue: {
      name: e.venue?.name,
      address: e.venue?.address,
      lat: e.venue?.lat,
      lng: e.venue?.lng,
    },
    price: {
      free: e.price?.free || false,
      min: e.price?.min || 0,
      max: e.price?.max || 0,
    },
    inventory: {
      total: e.capacity || 0,
      remaining: (e.capacity || 0) - (e.attendees || 0),
    },
    organizer: organizer._id,
    status: 'published',
    ratingAvg: 0,
    ratingCount: 0,
  }));

  const insertedEvents = await Event.insertMany(eventsToInsert);
  console.log(`✅ ${insertedEvents.length} events seeded`);

  // ── 3. mock vendors.json ke liye ek-ek user + vendor banao ──
  let vendorCount = 0;
  for (let i = 0; i < mockVendors.length; i++) {
    const v = mockVendors[i];

    const vendorUser = await User.create({
      name: v.name,
      email: `seed.vendor${i + 1}@sanskaar.com`,
      phone: `999000${1000 + i}`,
      password: 'password123',
      role: 'vendor',
    });

    await Vendor.create({
      user: vendorUser._id,
      businessName: v.name,
      categories: [CATEGORY_MAP[v.category] || v.category],
      services: v.services || [],
      description: v.bio || '',
      priceRange: {
        min: v.priceRange?.min || 0,
        max: v.priceRange?.max || 0,
      },
      portfolio: v.photos || [],
      serviceArea: [v.location?.city].filter(Boolean),
      ratingAvg: v.rating || 0,
      ratingCount: v.reviewCount || 0,
      isApproved: v.verified || false,
      isActive: true,
    });
    vendorCount++;
  }
  console.log(`✅ ${vendorCount} vendors seeded`);

  console.log('🌱 Seeding complete!');
  await mongoose.connection.close();
  process.exit(0);
};

run().catch((err) => {
  console.error('❌ Seeding failed:', err);
  process.exit(1);
});