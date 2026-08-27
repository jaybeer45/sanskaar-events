const mongoose = require('mongoose');

const vendorAddonSchema = new mongoose.Schema(
  {
    package: { type: mongoose.Schema.Types.ObjectId, ref: 'VendorPackage', required: true },
    name: { type: String, required: true, trim: true, minlength: 2, maxlength: 60 },
    pricePaise: { type: Number, required: true, min: 0 }, // integer paise
    pricingModel: { type: String, enum: ['FIXED', 'PER_UNIT', 'PER_HOUR'], default: 'FIXED' },
    unitLabel: { type: String, default: '' },
    maxQuantity: { type: Number, default: 1, min: 1 },
    description: { type: String, default: '', maxlength: 300 },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

vendorAddonSchema.index({ package: 1 });

module.exports = mongoose.model('VendorAddon', vendorAddonSchema);