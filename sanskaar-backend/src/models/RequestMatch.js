const mongoose = require('mongoose');

const requestMatchSchema = new mongoose.Schema(
  {
    request: { type: mongoose.Schema.Types.ObjectId, ref: 'PlanningRequest', required: true },
    vendor: { type: mongoose.Schema.Types.ObjectId, ref: 'Vendor', required: true },
    service: { type: String, default: '' }, // which of the request's services this match is for
    score: { type: Number, default: 0 },
    reason: { type: String, default: '' }, // human-readable, e.g. "High rating, within budget"
    approvedByUser: { type: Boolean, default: false }, // THE PRIVACY GATE — false until the customer explicitly approves
  },
  { timestamps: true }
);

requestMatchSchema.index({ request: 1 });
requestMatchSchema.index({ vendor: 1, approvedByUser: 1 }); // fast lookup for "vendor's approved leads"

module.exports = mongoose.model('RequestMatch', requestMatchSchema);