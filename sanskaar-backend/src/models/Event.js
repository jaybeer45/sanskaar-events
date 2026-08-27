const mongoose = require('mongoose');

const eventSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    description: { type: String, default: '' },
    category: { type: String, required: true },
    images: [String],
    date: { type: Date, required: true },
    time: { type: String, required: true },
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