const mongoose = require('mongoose');


// A sub-document per day/slot. Present only for multi-day events — an event
// with an empty eventDates array is a normal single-date event and keeps
// using the top-level `date` field exactly as before (fully backward
// compatible with every event created before this existed).
const eventDateSchema = new mongoose.Schema(
  {
    date: { type: Date, required: true },
    label: { type: String, default: '' }, // e.g. "Day 1" — optional, UI can also just format the date
    capacity: { type: Number, default: 0 }, // 0 = no per-day cap (falls back to the event's overall inventory)
    soldCount: { type: Number, default: 0 },
  }
);



const eventSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    description: { type: String, default: '' },
    category: { type: String, required: true },
    images: [String],
    date: { type: Date, required: true },
    time: { type: String, required: true },
     eventDates: { type: [eventDateSchema], default: [] },
    venue: { name: String, address: String, lat: Number, lng: Number },
    price: { free: { type: Boolean, default: false }, min: { type: Number, default: 0 }, max: { type: Number, default: 0 } },
    inventory: { total: { type: Number, default: 0 }, remaining: { type: Number, default: 0 } },
    organizer: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    status: { type: String, enum: ['draft', 'pending_approval', 'published', 'cancelled', 'completed'], default: 'draft' },
    ratingAvg: { type: Number, default: 0 },
    ratingCount: { type: Number, default: 0 },
    bookingUrl: { type: String, default: '' },
    organizerName: { type: String, default: '' },
    organizerPhone: { type: String, default: '' },
    organizerEmail: { type: String, default: '' },
  }, { timestamps: true }
);

eventSchema.index({ category: 1, date: 1 });

module.exports = mongoose.model('Event', eventSchema);