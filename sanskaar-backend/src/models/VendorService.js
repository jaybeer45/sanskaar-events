const mongoose = require('mongoose');

const vendorServiceSchema = new mongoose.Schema(
  {
    vendor: { type: mongoose.Schema.Types.ObjectId, ref: 'Vendor', required: true },
    name: { type: String, required: true, trim: true, minlength: 2, maxlength: 80 },
    occasions: [{ type: String }], // e.g. ["wedding", "birthday", "corporate"]
    leadTimeDays: { type: Number, default: 7, min: 0 },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

vendorServiceSchema.index({ vendor: 1 });

module.exports = mongoose.model('VendorService', vendorServiceSchema);