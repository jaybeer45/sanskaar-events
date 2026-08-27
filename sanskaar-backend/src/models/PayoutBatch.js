const mongoose = require('mongoose');

const payoutItemSchema = new mongoose.Schema(
  {
    recipient: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    amount: { type: Number, required: true },
    status: { type: String, enum: ['pending', 'processing', 'paid', 'failed'], default: 'pending' },
    bankRef: { type: String, default: '' },
  }, { _id: false }
);

const payoutBatchSchema = new mongoose.Schema(
  {
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    items: [payoutItemSchema],
    totalAmount: { type: Number, required: true },
    status: { type: String, enum: ['draft', 'processing', 'completed', 'failed'], default: 'draft' },
  }, { timestamps: true }
);

module.exports = mongoose.model('PayoutBatch', payoutBatchSchema);