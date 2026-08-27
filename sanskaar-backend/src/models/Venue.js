const mongoose = require('mongoose');

const venueSchema = new mongoose.Schema(
  {
    organizer: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    name: { type: String, required: true, trim: true, minlength: 2, maxlength: 80 },
    address: { type: String, required: true, trim: true },
    lat: { type: Number },
    lng: { type: Number },
  },
  { timestamps: true }
);

venueSchema.index({ organizer: 1 });

module.exports = mongoose.model('Venue', venueSchema);