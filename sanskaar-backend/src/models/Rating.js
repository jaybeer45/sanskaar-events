const mongoose = require('mongoose');

const ratingSchema = new mongoose.Schema(
  {
    event: { type: mongoose.Schema.Types.ObjectId, ref: 'Event', required: true },
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    booking: { type: mongoose.Schema.Types.ObjectId, ref: 'Booking', required: true },
    stars: { type: Number, required: true, min: 1, max: 5 },
    tags: [String],
    review: { type: String, maxlength: 1000, default: '' },
    photos: { type: [String], validate: [(arr) => arr.length <= 5, 'Max 5 photos allowed'] },
    isModerated: { type: Boolean, default: false },
    isHidden: { type: Boolean, default: false },
  }, { timestamps: true }
);

ratingSchema.index({ event: 1, user: 1 }, { unique: true });

module.exports = mongoose.model('Rating', ratingSchema);