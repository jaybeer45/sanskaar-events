const mongoose = require('mongoose');

// A user-created promotional video for an event. The video file itself is
// uploaded as-is (via the existing event-video upload endpoint) — trim,
// filter, and text are stored as metadata here and replayed with CSS on
// playback (see event-video-artist-feature notes: Option A, not a real
// burned-in export). musicUrl is a placeholder — no music-library UI yet.
const creatorVideoSchema = new mongoose.Schema(
  {
    event: { type: mongoose.Schema.Types.ObjectId, ref: 'Event', required: true },
    creator: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    videoUrl: { type: String, required: true },
    thumbnailUrl: { type: String, default: '' },
    duration: { type: Number, default: 0 }, // seconds, full source duration
    musicUrl: { type: String, default: '' },

    // Editing metadata — replayed via CSS on the frontend, not burned in
    trimStart: { type: Number, default: 0 },
    trimEnd: { type: Number, default: 0 },
    filterCss: { type: String, default: 'none' },
    textOverlays: [
      {
        content: { type: String, required: true },
        x: { type: Number, required: true }, // 0-100, percentage
        y: { type: Number, required: true }, // 0-100, percentage
        fontSize: { type: Number, default: 24 },
        color: { type: String, default: '#ffffff' },
      },
    ],

    status: { type: String, enum: ['draft', 'ready'], default: 'ready' },
    visibility: { type: String, enum: ['private', 'public'], default: 'private' },
  },
  { timestamps: true }
);

module.exports = mongoose.model('CreatorVideo', creatorVideoSchema);