const mongoose = require('mongoose');

const vendorBookingSchema = new mongoose.Schema(
  {
    quote: { type: mongoose.Schema.Types.ObjectId, ref: 'Quote', required: true },
    request: { type: mongoose.Schema.Types.ObjectId, ref: 'PlanningRequest', required: true },
    vendor: { type: mongoose.Schema.Types.ObjectId, ref: 'Vendor', required: true },
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    totalAmountPaise: { type: Number, required: true },
    advanceAmountPaise: { type: Number, required: true },
    balanceAmountPaise: { type: Number, required: true },
    advancePaid: { type: Boolean, default: false },
    balancePaid: { type: Boolean, default: false },
    advanceRazorpayOrderId: { type: String, default: null },
    advanceRazorpayPaymentId: { type: String, default: null },
    balanceRazorpayOrderId: { type: String, default: null },
    balanceRazorpayPaymentId: { type: String, default: null },
    status: { type: String, enum: ['confirmed', 'in_progress', 'completed', 'cancelled'], default: 'confirmed' },
    
  },
  { timestamps: true }
);

module.exports = mongoose.model('VendorBooking', vendorBookingSchema);