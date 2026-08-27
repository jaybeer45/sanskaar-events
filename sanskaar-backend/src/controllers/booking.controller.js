const asyncHandler = require('express-async-handler');
const crypto = require('crypto');
const Booking = require('../models/Booking');
const razorpay = require('../config/razorpay');
const Event = require('../models/Event');
const TicketVariant = require('../models/TicketVariant');

// @route POST /api/v1/bookings
const createBooking = asyncHandler(async (req, res) => {
  const { eventId, variantId, fullName, phone, email, quantity, attendees, promoCode } = req.body;

  const event = await Event.findById(eventId);
  if (!event) {
    res.status(404);
    throw new Error('Event not found.');
  }

  let amount;
  let variant = null;

  if (variantId) {
    // Variant-based flow — atomic check-and-increment to avoid overselling
    // when two people book the last seat at the same time.
    variant = await TicketVariant.findOneAndUpdate(
      {
        _id: variantId,
        event: event._id,
        isActive: true,
        status: 'approved',
        $expr: { $lte: [{ $add: ['$soldCount', quantity] }, '$capacity'] },
      },
      { $inc: { soldCount: quantity } },
      { new: true }
    );

    if (!variant) {
      res.status(400);
      throw new Error('This ticket type is unavailable or does not have enough seats left.');
    }

    amount = variant.price * quantity;
  } else {
    // Legacy flow — events created before ticket variants existed
    if (event.inventory.remaining < quantity) {
      res.status(400);
      throw new Error('Not enough seats available.');
    }

    amount = event.price.free ? 0 : event.price.min * quantity;
    event.inventory.remaining -= quantity;
    await event.save();
  }

  const gst = Math.round(amount * 0.18);
  const totalAmount = amount + gst;

  try {
    const booking = await Booking.create({
      event: event._id,
      variant: variant ? variant._id : null,
      user: req.user._id,
      fullName,
      phone,
      email,
      quantity,
      attendees: attendees || [],
      promoCode: promoCode || null,
      amount,
      gst,
      totalAmount,
      ticketCode: crypto.randomBytes(6).toString('hex').toUpperCase(),
      paymentStatus: amount === 0 ? 'paid' : 'pending',
    });

    res.status(201).json(booking);
  } catch (err) {
    // If booking creation fails after we already reserved seats, roll the count back
    if (variant) {
      await TicketVariant.updateOne({ _id: variant._id }, { $inc: { soldCount: -quantity } });
    } else {
      event.inventory.remaining += quantity;
      await event.save();
    }
    throw err;
  }
});

// @route GET /api/v1/bookings/my
const getMyBookings = asyncHandler(async (req, res) => {
  const bookings = await Booking.find({ user: req.user._id })
    .populate('event', 'title date time venue images')
    .sort({ createdAt: -1 });

  res.status(200).json({ results: bookings, total: bookings.length });
});

// @route GET /api/v1/bookings/:id
const getBookingById = asyncHandler(async (req, res) => {
  const booking = await Booking.findById(req.params.id).populate('event', 'title date time venue images');
  if (!booking) {
    res.status(404);
    throw new Error('Booking not found .');
  }

  if (booking.user.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
    res.status(403);
    throw new Error('Only can check out booking .');
  }

  res.status(200).json(booking);
});


// STEP 1: Order banao

const createRazorpayOrder = asyncHandler(async (req, res) => {
  const booking = await Booking.findById(req.params.id);
  if (!booking) {
    res.status(404);
    throw new Error('Booking nahi mili.');
  }

  if (booking.user.toString() !== req.user._id.toString()) {
    res.status(403);
    throw new Error('Sirf apni booking hi pay kar sakte ho.');
  }

  if (booking.paymentStatus === 'paid') {
    res.status(400);
    throw new Error('Ye booking pehle se paid hai.');
  }

  const order = await razorpay.orders.create({
    amount: Math.round(booking.totalAmount * 100), // Razorpay paise me leta hai (₹500 = 50000)
    currency: 'INR',
    receipt: booking._id.toString(),
  });

  booking.razorpayOrderId = order.id;
  await booking.save();

  res.status(200).json({
    orderId: order.id,
    amount: order.amount,
    currency: order.currency,
    keyId: process.env.RAZORPAY_KEY_ID, // public key 
  });
});


const verifyRazorpayPayment = asyncHandler(async (req, res) => {
  const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;

  if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
    res.status(400);
    throw new Error('razorpay_order_id, razorpay_payment_id aur razorpay_signature required hain.');
  }

  const booking = await Booking.findById(req.params.id);
  if (!booking) {
    res.status(404);
    throw new Error('Booking nahi mili.');
  }

  if (booking.user.toString() !== req.user._id.toString()) {
    res.status(403);
    throw new Error('Sirf apni booking hi pay kar sakte ho.');
  }

  if (booking.razorpayOrderId !== razorpay_order_id) {
    res.status(400);
    throw new Error('Order id booking se match nahi karti.');
  }

  const expectedSignature = crypto
    .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
    .update(`${razorpay_order_id}|${razorpay_payment_id}`)
    .digest('hex');

  if (expectedSignature !== razorpay_signature) {
    booking.paymentStatus = 'failed';
    await booking.save();
    res.status(400);
    throw new Error('Payment verification fail ho gayi — signature match nahi hui.');
  }

  booking.paymentStatus = 'paid';
  booking.paymentMethod = 'razorpay';
  booking.razorpayPaymentId = razorpay_payment_id;
  await booking.save();

  res.status(200).json(booking);
});


module.exports = { createBooking, getMyBookings, getBookingById, createRazorpayOrder, verifyRazorpayPayment };