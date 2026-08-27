const mongoose = require('mongoose');

const PRICING_MODELS = ['FIXED', 'PER_PERSON', 'PER_HOUR', 'PER_DAY', 'PER_UNIT', 'STARTING_FROM', 'CUSTOM_QUOTE'];

const vendorPackageSchema = new mongoose.Schema(
  {
    service: { type: mongoose.Schema.Types.ObjectId, ref: 'VendorService', required: true },
    name: { type: String, required: true, trim: true, minlength: 2, maxlength: 60 },
    pricingModel: { type: String, enum: PRICING_MODELS, required: true },
    pricePaise: { type: Number, min: 0 }, // integer paise — not required, CUSTOM_QUOTE has no fixed price
    unitLabel: { type: String, default: '' }, // e.g. "plate", "guest", "hour"
    minUnits: { type: Number, min: 0 },
    maxUnits: { type: Number, min: 0 },
    durationHours: { type: Number, min: 0 },
    inclusions: {
      type: [String],
      validate: {
        validator: (arr) => arr.length >= 2 && arr.length <= 15,
        message: 'inclusions must have between 2 and 15 items.',
      },
    },
    exclusions: { type: [String], default: [] },
    advancePercent: { type: Number, default: 50, min: 0, max: 100 },
    capacityPerDay: { type: Number, min: 0 },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

vendorPackageSchema.index({ service: 1 });

module.exports = mongoose.model('VendorPackage', vendorPackageSchema);