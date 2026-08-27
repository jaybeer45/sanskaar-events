const mongoose = require('mongoose');

const attendeeSchema = new mongoose.Schema({ name: { type: String, required: true } }, { _id: false });

const bookingSchema = new mongoose.Schema(
  {
    event: { type: mongoose.Schema.Types.ObjectId, ref: 'Event', required: true },
    variant: { type: mongoose.Schema.Types.ObjectId, ref: 'TicketVariant', default: null },
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    fullName: { type: String, required: true },
    phone: { type: String, required: true },
    email: { type: String, required: true },
    quantity: { type: Number, required: true, min: 1 },
    attendees: [attendeeSchema],
    promoCode: { type: String, default: null },
    amount: { type: Number, required: true },
    gst: { type: Number, default: 0 },
    totalAmount: { type: Number, required: true },
    paymentStatus: { type: String, enum: ['pending', 'paid', 'failed', 'refunded'], default: 'pending' },
    paymentMethod: { type: String, enum: ['upi', 'card', 'netbanking', 'wallet', 'pay_later', 'razorpay'],},
    razorpayOrderId: { type: String, default: null },
    razorpayPaymentId: { type: String, default: null },
    checkedIn: { type: Boolean, default: false },
    checkedInAt: { type: Date, default: null },
    ticketCode: { type: String, unique: true, sparse: true },
    status: { type: String, enum: ['confirmed', 'cancelled', 'transferred', 'used'], default: 'confirmed' },
  }, { timestamps: true }
);

module.exports = mongoose.model('Booking', bookingSchema);