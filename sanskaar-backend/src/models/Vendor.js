const mongoose = require('mongoose');

const vendorSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
    businessName: { type: String, required: true },
    categories: [String],
    services: [String],
    description: { type: String, default: '' },
    priceRange: { min: { type: Number, default: 0 }, max: { type: Number, default: 0 } },
    portfolio: [String],
    serviceArea: [String],
    ratingAvg: { type: Number, default: 0 },
    ratingCount: { type: Number, default: 0 },
    isApproved: { type: Boolean, default: false },
    isActive: { type: Boolean, default: true },
    cityId: { type: String, default: '' },
    address: { type: String, default: '' },
    pincode: { type: String, default: '' },
    lat: { type: Number },
    lng: { type: Number },
    serviceRadiusKm: { type: Number, default: 30, min: 1, max: 500 },
    outstationAvailable: { type: Boolean, default: false },
    outstationMinDays: { type: Number, default: 0 },
    maxJobsPerDay: { type: Number, default: 1, min: 1 },
    blockedDates: [{ type: Date }],
    yearsExperience: { type: Number, default: 0, min: 0, max: 60 },
    phone: { type: String, default: '' },
    whatsapp: { type: String, default: '' },
    acceptedVendorTerms: {
      version: { type: String },
      timestamp: { type: Date },
      ip: { type: String },
    },
    
    commissionPercent: { type: Number, default: 15, min: 0, max: 100 },
    bankAccountName: { type: String, default: '' },
    bankAccountNumber: { type: String, default: '' },
    ifsc: { type: String, default: '' },
    accountType: { type: String, enum: ['savings', 'current', ''], default: '' },
  }, { timestamps: true }
);

module.exports = mongoose.model('Vendor', vendorSchema);