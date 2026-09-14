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


  await Event.deleteMany({});
  await Vendor.deleteMany({});
  await User.deleteMany({ email: { $regex: '^seed' } });

  // ── 1. Ek demo organizer user banao (events ke liye) ────────
  const organizer = await User.create({
    name: 'Sanskaar Events',
    email: 'seed.organizer@sanskaar.com',
    phone: '9990000001',
    password: 'password123',
    roles: ['user', 'organizer'],
  });

    const admin = await User.create({
  name: 'Super Admin',
  email: 'seed.admin@sanskaar.com',
  phone: '9990000000',
  password: 'password123',
  roles: ['user', 'admin'],
});

  // ── 2. mock events.json ko Event schema mein daalo ──────────
  const eventsToInsert = mockEvents.map((e, i) => {
  const baseDate = (() => {
    const d = new Date();
    d.setDate(d.getDate() + (i % 3)); // aaj, kal, parso mein spread karega
    d.setHours(0, 0, 0, 0);
    return d;
  })();

  // Har 3rd event ko multi-date banao (reschedule/cancel testing ke liye)
  const eventDates =
    i % 3 === 0
      ? [0, 1, 2].map((offset) => {
          const d = new Date(baseDate);
          d.setDate(d.getDate() + offset);
          return {
            date: d,
            label: `Day ${offset + 1}`,
            capacity: Math.max(10, Math.floor((e.capacity || 30) / 3)),
          };
        })
      : [];

  // Har doosre event ko 1-2 artists do (artist section testing ke liye)
  const artists =
    i % 2 === 0
      ? [
          {
            name: `Artist ${i + 1}`,
            photo: `https://picsum.photos/seed/artist${i + 1}/200/200`,
            bio: 'A talented performer featured at this event.',
            socialLink: i % 4 === 0 ? `https://instagram.com/artist${i + 1}` : '',
          },
          ...(i % 4 === 0
            ? [
                {
                  name: `Artist ${i + 1}B`,
                  photo: `https://picsum.photos/seed/artist${i + 1}b/200/200`,
                  bio: 'Special guest performer.',
                  socialLink: '',
                },
              ]
            : []),
        ]
      : [];

  // Sirf pehle event ko promotional video do (video-playback testing ke liye)
  const promotionalVideo =
    i === 0
      ? { url: 'https://www.w3schools.com/html/mov_bbb.mp4', mimeType: 'video/mp4' }
      : { url: '', mimeType: '' };

  return {
    title: e.title,
    description: e.description || '',
    category: e.category,
    images: e.images || [],
    date: baseDate,
    time: e.time,
    eventDates,
    artists,
    promotionalVideo,
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
  };
});

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
      roles: ['user', 'vendor'],
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