const mongoose = require('mongoose');

const vendorLeadSchema = new mongoose.Schema(
  {
    vendor: { type: mongoose.Schema.Types.ObjectId, ref: 'Vendor', required: true },
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    message: { type: String, required: true },
    eventType: { type: String, default: '' },
   budget: { type: Number, default: 0 },
    eventDate: { type: Date, default: null },
    status: { type: String, enum: ['new', 'responded', 'closed'], default: 'new' },
    reply: { type: String, default: '' },
    repliedAt: { type: Date, default: null },
  }, { timestamps: true }
);

module.exports = mongoose.model('VendorLead', vendorLeadSchema);