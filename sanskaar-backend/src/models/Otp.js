const mongoose = require('mongoose');


const otpSchema = new mongoose.Schema(
  {
    identifier: { type: String, required: true },
    code: { type: String, required: true },
    purpose: { type: String, enum: ['signup', 'login', 'reset_password', 'verify', 'organizer_contact'], default: 'signup' },
    expiresAt: { type: Date, required: true },
  }, { timestamps: true }
);

otpSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

module.exports = mongoose.model('Otp', otpSchema);