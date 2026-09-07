const asyncHandler = require("express-async-handler");
const crypto = require("crypto");
const Booking = require("../models/Booking");
const razorpay = require("../config/razorpay");
const Event = require("../models/Event");
const TicketVariant = require("../models/TicketVariant");
const { REFUND_TIERS } = require("../config/rewardsConfig");
const { adjustWallet } = require("./rewards.controller");
const {
  awardBookingRewards,
  checkCouponEligibility,
} = require("./rewards.controller");

// @route POST /api/v1/bookings
const createBooking = asyncHandler(async (req, res) => {
  const {
    eventId,
    variantId,
    eventDateId,
    fullName,
    phone,
    email,
    quantity,
    attendees,
    promoCode,
  } = req.body;

  // Basic validation
  if (!eventId || !fullName || !phone || !email || !quantity || quantity < 1) {
    res.status(400);
    throw new Error(
      "eventId, fullName, phone, email aur valid quantity required hain.",
    );
  }

  const event = await Event.findById(eventId);

  if (!event) {
    res.status(404);
    throw new Error("Event not found.");
  }

  let dateUpdated = false;
  let variant = null;
  let amount;

  // =========================================================
  // 1. MULTI-DATE EVENT INVENTORY
  // =========================================================

  const isMultiDate =
    Array.isArray(event.eventDates) && event.eventDates.length > 0;

  if (isMultiDate) {
    if (!eventDateId) {
      res.status(400);
      throw new Error(
        "This event runs across multiple dates — eventDateId is required.",
      );
    }

    const targetDate = event.eventDates.id(eventDateId);

    if (!targetDate) {
      res.status(400);
      throw new Error("Invalid eventDateId for this event.");
    }

    const hasCapacityLimit = targetDate.capacity > 0;

    const maxAllowedSoldCount = hasCapacityLimit
      ? targetDate.capacity - quantity
      : null;

    const dateFilter = hasCapacityLimit
      ? {
          _id: event._id,
          eventDates: {
            $elemMatch: {
              _id: eventDateId,
              soldCount: {
                $lte: maxAllowedSoldCount,
              },
            },
          },
        }
      : {
          _id: event._id,
          "eventDates._id": eventDateId,
        };

    const updatedEvent = await Event.findOneAndUpdate(
      dateFilter,
      {
        $inc: {
          "eventDates.$.soldCount": quantity,
        },
      },
      {
        new: true,
      },
    );

    if (!updatedEvent) {
      res.status(400);
      throw new Error("Not enough seats left for this date.");
    }

    dateUpdated = true;
  }

  // =========================================================
  // 2. TICKET VARIANT / LEGACY INVENTORY
  // =========================================================

  if (variantId) {
    // Variant-based flow
    variant = await TicketVariant.findOneAndUpdate(
      {
        _id: variantId,
        event: event._id,
        isActive: true,
        status: "approved",

        $expr: {
          $lte: [
            {
              $add: ["$soldCount", quantity],
            },
            "$capacity",
          ],
        },
      },
      {
        $inc: {
          soldCount: quantity,
        },
      },
      {
        new: true,
      },
    );

    if (!variant) {
      res.status(400);
      throw new Error(
        "This ticket type is unavailable or does not have enough seats left.",
      );
    }

    amount = variant.price * quantity;
  } else if (!isMultiDate) {
    // =======================================================
    // LEGACY SINGLE-DATE EVENT INVENTORY
    // =======================================================

    if (!event.inventory || event.inventory.remaining < quantity) {
      res.status(400);
      throw new Error("Not enough seats available.");
    }

    amount = event.price.free ? 0 : event.price.min * quantity;
    event.inventory.remaining -= quantity;

    await event.save();
  } else {
    amount = event.price.free ? 0 : event.price.min * quantity;
  }

  const gst = Math.round(amount * 0.18);
  let totalAmount = amount + gst;

  try {
    // COUPON REDEMPTION (optional — via promoCode) — try block ke andar,
    // taaki invalid coupon pe bhi neeche wala rollback chale. Inner
    // try/catch sirf status code ko 400 pe set karta hai; outer catch
    // rollback ke baad error ko aage throw kar deta hai.
    let redeemedCoupon = null;
    if (promoCode) {
      try {
        redeemedCoupon = await checkCouponEligibility(promoCode, req.user);
      } catch (couponErr) {
        res.status(400);
        throw couponErr;
      }
      const discountRupees = redeemedCoupon.valuePaise / 100;
      totalAmount = Math.max(0, totalAmount - discountRupees);
    }

    const booking = await Booking.create({
      event: event._id,
      variant: variant ? variant._id : null,
      eventDateId: eventDateId || null,
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
      ticketCode: crypto.randomBytes(6).toString("hex").toUpperCase(),
      paymentStatus: amount === 0 ? "paid" : "pending",
    });

    if (redeemedCoupon) {
      redeemedCoupon.usedCount += 1;
      redeemedCoupon.redeemedBy.push(req.user._id);
      redeemedCoupon.usedOnBooking = booking._id;
      if (redeemedCoupon.usedCount >= redeemedCoupon.maxUses) {
        redeemedCoupon.status = "used";
      }
      await redeemedCoupon.save();
    }

    if (booking.paymentStatus === "paid") {
      await awardBookingRewards(booking);
    }

    res.status(201).json({
      success: true,
      booking,
    });
  } catch (err) {
    if (variant) {
      await TicketVariant.updateOne(
        { _id: variant._id },
        { $inc: { soldCount: -quantity } },
      );
    }

    if (!variant && !isMultiDate) {
      event.inventory.remaining += quantity;
      await event.save();
    }

    if (dateUpdated && eventDateId && isMultiDate) {
      await Event.updateOne(
        { _id: event._id, "eventDates._id": eventDateId },
        { $inc: { "eventDates.$.soldCount": -quantity } },
      );
    }

    throw err;
  }
});

// @route GET /api/v1
const getMyBookings = asyncHandler(async (req, res) => {
  const bookings = await Booking.find({
    user: req.user._id,
  })
    .populate({
      path: "event",
      select:
        "title date time venue images eventDates organizerName organizerPhone organizer",
      populate: { path: "organizer", select: "displayName contactPhone" },
    })
    .sort({ createdAt: -1 });

  res.status(200).json({
    results: bookings,
    total: bookings.length,
  });
});

// ===========================================================
// GET BOOKING BY ID
// ===========================================================

// @route GET /api/v1/bookings/:id
const getBookingById = asyncHandler(async (req, res) => {
  const booking = await Booking.findById(req.params.id).populate(
    "event",
    "title date time venue images",
  );

  if (!booking) {
    res.status(404);
    throw new Error("Booking not found.");
  }

  if (
    booking.user.toString() !== req.user._id.toString() &&
    !req.user.roles.includes("admin")
  ) {
    res.status(403);
    throw new Error("Only can check out booking.");
  }

  res.status(200).json(booking);
});

// ===========================================================
// CREATE RAZORPAY ORDER
// ===========================================================

// @route POST /api/v1/bookings/:id/order
const createRazorpayOrder = asyncHandler(async (req, res) => {
  const booking = await Booking.findById(req.params.id);

  if (!booking) {
    res.status(404);
    throw new Error("Booking nahi mili.");
  }

  if (booking.user.toString() !== req.user._id.toString()) {
    res.status(403);
    throw new Error("Sirf apni booking hi pay kar sakte ho.");
  }

  if (booking.paymentStatus === "paid") {
    res.status(400);
    throw new Error("Ye booking pehle se paid hai.");
  }

  const order = await razorpay.orders.create({
    amount: Math.round(booking.totalAmount * 100),
    currency: "INR",
    receipt: booking._id.toString(),
  });

  booking.razorpayOrderId = order.id;

  await booking.save();

  res.status(200).json({
    orderId: order.id,
    amount: order.amount,
    currency: order.currency,
    keyId: process.env.RAZORPAY_KEY_ID,
  });
});

// ===========================================================
// VERIFY RAZORPAY PAYMENT
// ===========================================================

const verifyRazorpayPayment = asyncHandler(async (req, res) => {
  const { razorpay_order_id, razorpay_payment_id, razorpay_signature } =
    req.body;

  if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
    res.status(400);
    throw new Error(
      "razorpay_order_id, razorpay_payment_id aur razorpay_signature required hain.",
    );
  }

  const booking = await Booking.findById(req.params.id);

  if (!booking) {
    res.status(404);
    throw new Error("Booking nahi mili.");
  }

  if (booking.user.toString() !== req.user._id.toString()) {
    res.status(403);
    throw new Error("Sirf apni booking hi pay kar sakte ho.");
  }

  if (booking.razorpayOrderId !== razorpay_order_id) {
    res.status(400);
    throw new Error("Order id booking se match nahi karti.");
  }

  const expectedSignature = crypto
    .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
    .update(`${razorpay_order_id}|${razorpay_payment_id}`)
    .digest("hex");

  if (expectedSignature !== razorpay_signature) {
    booking.paymentStatus = "failed";

    await booking.save();

    res.status(400);
    throw new Error("Payment verification failed signature not match .");
  }

  booking.paymentStatus = "paid";
  booking.paymentMethod = "razorpay";
  booking.razorpayPaymentId = razorpay_payment_id;

  await booking.save();

  await awardBookingRewards(booking);

  res.status(200).json(booking);
});

// @route POST /api/v1/bookings/:id/cancel
const cancelBooking = asyncHandler(async (req, res) => {
  const booking = await Booking.findById(req.params.id).populate(
    "event",
    "date",
  );

  if (!booking) {
    res.status(404);
    throw new Error("Booking not found.");
  }

  if (booking.user.toString() !== req.user._id.toString()) {
    res.status(403);
    throw new Error("You can only cancel your own booking.");
  }

  if (booking.status === "cancelled") {
    res.status(400);
    throw new Error("This booking is already cancelled.");
  }

  if (booking.paymentStatus !== "paid") {
    res.status(400);
    throw new Error("Only paid bookings can be cancelled through this flow.");
  }

  const eventDate = new Date(booking.event.date);
  const now = new Date();

  const daysLeft = Math.floor((eventDate - now) / (1000 * 60 * 60 * 24));

  const tier =
    REFUND_TIERS.find((t) => daysLeft >= t.daysBeforeEvent) ||
    REFUND_TIERS[REFUND_TIERS.length - 1];

  const refundPercent = tier.refundPercent;

  const refundedPaise = Math.round(
    booking.totalAmount * 100 * (refundPercent / 100),
  );

  // =======================================================
  // RELEASE INVENTORY
  // =======================================================

  if (booking.variant) {
    await TicketVariant.updateOne(
      {
        _id: booking.variant,
      },
      {
        $inc: {
          soldCount: -booking.quantity,
        },
      },
    );
  } else if (booking.eventDateId) {
    await Event.updateOne(
      {
        _id: booking.event._id,
        "eventDates._id": booking.eventDateId,
      },
      {
        $inc: {
          "eventDates.$.soldCount": -booking.quantity,
        },
      },
    );
  } else {
    const event = await Event.findById(booking.event._id);

    event.inventory.remaining += booking.quantity;

    await event.save();
  }

  // =======================================================
  // UPDATE BOOKING
  // =======================================================

  booking.status = "cancelled";
  booking.cancelledAt = new Date();
  booking.refundPercent = refundPercent;
  booking.refundedPaise = refundedPaise;

  booking.paymentStatus =
    refundedPaise > 0 ? "refunded" : booking.paymentStatus;

  await booking.save();

  if (refundedPaise > 0) {
    await adjustWallet(
      req.user._id,
      refundedPaise,
      "credit",
      "booking_cancellation_refund",
      booking._id,
    );
  }

  res.status(200).json({
    success: true,
    refundPercent,
    refundedPaise,
    booking,
  });
});

// ===========================================================
// RESCHEDULE BOOKING
// ===========================================================

// @route POST /api/v1/bookings/:id/reschedule
const rescheduleBooking = asyncHandler(async (req, res) => {
  const { newEventDateId } = req.body;

  if (!newEventDateId) {
    res.status(400);
    throw new Error("newEventDateId is required.");
  }

  const booking = await Booking.findById(req.params.id);

  if (!booking) {
    res.status(404);
    throw new Error("Booking not found.");
  }

  if (booking.user.toString() !== req.user._id.toString()) {
    res.status(403);
    throw new Error("You can only reschedule your own booking.");
  }

  if (booking.status === "cancelled") {
    res.status(400);
    throw new Error("A cancelled booking cannot be rescheduled.");
  }

  if (!booking.eventDateId) {
    res.status(400);
    throw new Error(
      "This booking is not for a multi-day event, so there is nothing to reschedule between.",
    );
  }

  if (booking.eventDateId.toString() === newEventDateId) {
    res.status(400);
    throw new Error("This is already the date on your booking.");
  }

  const event = await Event.findById(booking.event);

  if (!event) {
    res.status(404);
    throw new Error("Event not found.");
  }

  const newDate = event.eventDates.id(newEventDateId);

  if (!newDate) {
    res.status(400);
    throw new Error("Invalid date for this event.");
  }

  const hasCapacityLimit = newDate.capacity > 0;

  const maxAllowedSoldCount = hasCapacityLimit
    ? newDate.capacity - booking.quantity
    : null;

  const reserveFilter = hasCapacityLimit
    ? {
        _id: event._id,
        eventDates: {
          $elemMatch: {
            _id: newEventDateId,
            soldCount: {
              $lte: maxAllowedSoldCount,
            },
          },
        },
      }
    : {
        _id: event._id,
        "eventDates._id": newEventDateId,
      };

  const reserved = await Event.findOneAndUpdate(
    reserveFilter,
    {
      $inc: {
        "eventDates.$.soldCount": booking.quantity,
      },
    },
    {
      new: true,
    },
  );

  if (!reserved) {
    res.status(400);
    throw new Error("Not enough seats left on the date you want to move to.");
  }

  // Release old date
  await Event.updateOne(
    {
      _id: event._id,
      "eventDates._id": booking.eventDateId,
    },
    {
      $inc: {
        "eventDates.$.soldCount": -booking.quantity,
      },
    },
  );

  booking.eventDateId = newEventDateId;

  await booking.save();

  res.status(200).json({
    success: true,
    booking,
  });
});

module.exports = {
  createBooking,
  getMyBookings,
  getBookingById,
  createRazorpayOrder,
  verifyRazorpayPayment,
  cancelBooking,
  rescheduleBooking,
};
