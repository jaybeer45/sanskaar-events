const mongoose = require('mongoose');

// Append-only ledger — a refund/credit is never edited or deleted, only
// added. User.walletBalancePaise is the running total; this collection is
// the audit trail behind it. Always go through the adjustWallet() helper in
// rewards.controller.js so the two can never drift out of sync.
const walletTransactionSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    type: { type: String, enum: ['credit', 'debit'], required: true },
    amountPaise: { type: Number, required: true },
    reason: { type: String, required: true }, // e.g. 'refund', 'referral_bonus'
    relatedBooking: { type: mongoose.Schema.Types.ObjectId, ref: 'Booking', default: null },
    balanceAfterPaise: { type: Number, required: true },
  }, { timestamps: true }
);

module.exports = mongoose.model('WalletTransaction', walletTransactionSchema);