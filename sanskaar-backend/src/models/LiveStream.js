// src/models/LiveStream.js
const mongoose = require('mongoose');

const liveStreamSchema = new mongoose.Schema(
  {
    event: { type: mongoose.Schema.Types.ObjectId, ref: 'Event', required: true },
    host: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    title: { type: String, trim: true, maxlength: 100 },
    filterCss: { type: String, default: 'none' },
    status: { type: String, enum: ['live', 'ended'], default: 'live' },
    startedAt: { type: Date, default: Date.now },
    endedAt: { type: Date, default: null },
    peakViewers: { type: Number, default: 0 },
    heartsCount: { type: Number, default: 0 },
  },
  { timestamps: true }
);

module.exports = mongoose.model('LiveStream', liveStreamSchema);