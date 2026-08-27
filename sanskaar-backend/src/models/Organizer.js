const mongoose = require('mongoose');

const organizerSchema = new mongoose.Schema(
  {
    owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },

    // --- OM-1: Registration fields (PRD 9.4) ---
    displayName: { type: String, required: true, trim: true, minlength: 2, maxlength: 80 },
    organizerType: {
      type: String,
      required: true,
      enum: ['individual', 'proprietorship', 'partnership', 'pvt_ltd', 'llp', 'trust_ngo', 'government'],
    },
    cityId: { type: String, required: true },
    categoryIds: { type: [String], validate: (v) => v.length >= 1 && v.length <= 5, required: true },
    about: { type: String, maxlength: 1000, default: '' },
    logoUrl: { type: String, default: '' },
    contactName: { type: String, required: true, minlength: 2, maxlength: 80 },
    contactPhone: { type: String, required: true },
    contactPhoneVerified: { type: Boolean, default: false },
    contactEmail: { type: String, required: true, lowercase: true },
    contactEmailVerified: { type: Boolean, default: false },
    links: { type: [String], default: [] },
    expectedVolume: { type: String, enum: ['1-2', '3-5', '6-10', '10+', null], default: null },
    acceptedOrganizerTerms: {
      version: String,
      timestamp: Date,
      ip: String,
    },

    // --- OM-2: KYC & bank (PRD 9.5) ---
    kyc: {
      legalName: String,
      pan: { type: String, uppercase: true },
      gstin: { type: String, uppercase: true },
      address: {
        line1: String,
        line2: String,
        city: String,
        state: String,
        pincode: String,
      },
      idDocUrl: String,
      businessDocUrl: String,
      bankAccountName: String,
      bankAccountNumber: String,
      ifsc: String,
      accountType: { type: String, enum: ['savings', 'current'] },
      chequeUrl: String,
      payoutFrequency: { type: String, enum: ['per_event_t2', 'weekly'], default: 'per_event_t2' },
      razorpayContactId: String,
      razorpayFundAccountId: String,
    },

    kycStatus: {
      type: String,
      enum: ['draft', 'submitted', 'verified', 'rejected'],
      default: 'draft',
    },
    kycRejectionReason: { type: String, default: '' },

    commissionTier: { type: String, enum: ['standard', 'high_volume', 'new_organizer'], default: 'new_organizer' },
    isSuspended: { type: Boolean, default: false },
  },
  { timestamps: true }
);

organizerSchema.methods.toSafeObject = function () {
  const obj = this.toObject();
  if (obj.kyc?.pan) obj.kyc.pan = `XXXXX${obj.kyc.pan.slice(-4)}`;
  if (obj.kyc?.bankAccountNumber) obj.kyc.bankAccountNumber = `XXXX${obj.kyc.bankAccountNumber.slice(-4)}`;
  return obj;
};

module.exports = mongoose.model('Organizer', organizerSchema);