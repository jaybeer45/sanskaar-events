const mongoose = require('mongoose');

const vendorPayoutSchema = new mongoose.Schema(
  {
    vendor: { type: mongoose.Schema.Types.ObjectId, ref: 'Vendor', required: true },
    booking: { type: mongoose.Schema.Types.ObjectId, ref: 'VendorBooking', required: true, unique: true },

    grossAmountPaise: { type: Number, required: true },

    commissionPercent: { type: Number, required: true },
    commissionPaise: { type: Number, required: true },
    pgcPercent: { type: Number, required: true },
    pgcPaise: { type: Number, required: true },
    gstOnCommissionPercent: { type: Number, required: true },
    gstOnCommissionPaise: { type: Number, required: true },

    netPayoutPaise: { type: Number, required: true },

    status: { type: String, enum: ['pending', 'processing', 'paid', 'failed'], default: 'pending' },
    bankRef: { type: String, default: '' },
    paidAt: { type: Date, default: null },
    paidBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  }, { timestamps: true }
);

module.exports = mongoose.model('VendorPayout', vendorPayoutSchema);