const mongoose = require('mongoose');

const planningRequestSchema = new mongoose.Schema(
  {
    reference: { type: String, required: true, unique: true },
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    services: [{ type: String, required: true }], // category strings, e.g. ["photographer", "caterer"]
    occasion: { type: String, default: '' }, // e.g. "wedding"
    eventDate: { type: Date, required: true },
    flexibleDates: { type: Boolean, default: false },
    cityId: { type: String, required: true },
    lat: { type: Number },
    lng: { type: Number },
    budgetMin: { type: Number, required: true, min: 0 },
    budgetMax: { type: Number, required: true, min: 0 },
    description: { type: String, default: '', maxlength: 1000 },
    status: { type: String, enum: ['pending_matching', 'matched', 'closed'], default: 'pending_matching' },
  },
  { timestamps: true }
);

planningRequestSchema.index({ user: 1 });

module.exports = mongoose.model('PlanningRequest', planningRequestSchema);