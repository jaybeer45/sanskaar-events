const mongoose = require('mongoose');

const organizerStaffSchema = new mongoose.Schema(
  {
    event: { type: mongoose.Schema.Types.ObjectId, ref: 'Event', required: true },
    organizer: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }, // who invited them
    staffUser: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    status: { type: String, enum: ['active', 'revoked'], default: 'active' },
  },
  { timestamps: true }
);

organizerStaffSchema.index({ event: 1, staffUser: 1 }, { unique: true }); // same person can't be invited twice to the same event

module.exports = mongoose.model('OrganizerStaff', organizerStaffSchema);