const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const organizerKycSchema = new mongoose.Schema(
  {
    orgName: String, pan: String, gst: String, bankAccount: String,
    ifsc: String, upiId: String, documents: [String],
    status: { type: String, enum: ['not_submitted', 'pending', 'approved', 'rejected'], default: 'not_submitted' },
  }, { _id: false }
);

const vendorKycSchema = new mongoose.Schema(
  {
    businessName: String, categories: [String], services: [String],
    priceRangeMin: Number, priceRangeMax: Number, portfolio: [String],
    serviceArea: [String], bankAccount: String, ifsc: String, upiId: String,
    documents: [String],
    status: { type: String, enum: ['not_submitted', 'pending', 'approved', 'rejected'], default: 'not_submitted' },
  }, { _id: false }
);

const consentSchema = new mongoose.Schema(
  {
    type: { type: String, enum: ['terms', 'privacy', 'marketing'], required: true },
    version: { type: String, required: true },
    accepted: { type: Boolean, required: true },
    ip: { type: String, default: '' },
    acceptedAt: { type: Date, default: Date.now },
  }, { _id: false }
);

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, minlength: 2, maxlength: 50 },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    phone: { type: String, required: true, unique: true, trim: true },
    password: { type: String, required: true, minlength: 8, select: false },
    roles: {type: [String], enum: ['user', 'organizer', 'vendor', 'admin', 'moderator', 'event_team'], default: ['user']},
    avatar: { type: String, default: '' },
    bio: { type: String, maxlength: 200, default: '' },
    city: { type: String, default: 'Bareilly' },
    isPhoneVerified: { type: Boolean, default: false },
    isEmailVerified: { type: Boolean, default: false },
    interests: [String],
    alertPrefs: {
      push: { type: Boolean, default: true },
      email: { type: Boolean, default: true },
      whatsapp: { type: Boolean, default: false },
    },
    savedEvents: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Event' }],
    // append-only ledger — purane entries kabhi overwrite nahi hote, sirf naye push hote hain
    consents: [consentSchema],
    organizerKyc: organizerKycSchema,
    vendorKyc: vendorKycSchema,
    isActive: { type: Boolean, default: true },
    walletBalancePaise: { type: Number, default: 0 },
  }, { timestamps: true }
);

userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return ;
  this.password = await bcrypt.hash(this.password, 10);
 
});

userSchema.methods.comparePassword = async function (candidate) {
  return bcrypt.compare(candidate, this.password);
};

userSchema.methods.toSafeObject = function () {
  const obj = this.toObject();
  delete obj.password;
  return obj;
};

userSchema.methods.hasRole = function (r) {
  return this.roles.includes(r);
};
module.exports = mongoose.model('User', userSchema);