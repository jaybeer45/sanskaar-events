const mongoose = require('mongoose');

const ticketVariantSchema = new mongoose.Schema(
  {
    event: { type: mongoose.Schema.Types.ObjectId, ref: 'Event', required: true },
    name: { type: String, required: true, trim: true, minlength: 2, maxlength: 60 }, // e.g. "Silver", "VIP Table"
    price: { type: Number, required: true, min: 0 }, // in rupees, same as Event.price
    seatsPerUnit: { type: Number, default: 1, min: 1 }, // e.g. "VIP table for 4" = 4
    capacity: { type: Number, required: true, min: 0 }, // total units available for sale
    soldCount: { type: Number, default: 0, min: 0 },
    status: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'approved' },
    isActive: { type: Boolean, default: true }, // soft delete only, never hard delete
  },
  { timestamps: true }
);

ticketVariantSchema.index({ event: 1 });

module.exports = mongoose.model('TicketVariant', ticketVariantSchema);