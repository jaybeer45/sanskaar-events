const mongoose = require('mongoose');

const quoteSchema = new mongoose.Schema(
  {
    match: { type: mongoose.Schema.Types.ObjectId, ref: 'RequestMatch', required: true },
    request: { type: mongoose.Schema.Types.ObjectId, ref: 'PlanningRequest', required: true },
    vendor: { type: mongoose.Schema.Types.ObjectId, ref: 'Vendor', required: true },
    lineItems: [{
      name: { type: String, required: true },
      amountPaise: { type: Number, required: true, min: 0 },
    }],
    travelChargePaise: { type: Number, default: 0, min: 0 },
    advancePercent: { type: Number, default: 50, min: 0, max: 100 },
    validUntil: { type: Date, required: true },
    status: { type: String, enum: ['pending', 'accepted', 'rejected', 'expired'], default: 'pending' },
  },
  { timestamps: true }
);

quoteSchema.virtual('totalAmountPaise').get(function () {
  return this.lineItems.reduce((sum, i) => sum + i.amountPaise, 0) + this.travelChargePaise;
});
quoteSchema.set('toJSON', { virtuals: true });

module.exports = mongoose.model('Quote', quoteSchema);