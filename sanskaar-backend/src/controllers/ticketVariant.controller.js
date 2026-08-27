const asyncHandler = require('express-async-handler');
const Event = require('../models/Event');
const TicketVariant = require('../models/TicketVariant');

// Helper — checks the event exists and this user is allowed to manage it
const getEventAndCheckOwnership = async (eventId, user) => {
  const event = await Event.findById(eventId);
  if (!event) {
    const err = new Error('Event not found.');
    err.statusCode = 404;
    throw err;
  }
  if (event.organizer.toString() !== user._id.toString() && user.role !== 'admin') {
    const err = new Error('Only the event organizer or an admin can manage variants.');
    err.statusCode = 403;
    throw err;
  }
  return event;
};

// @route GET /api/v1/events/:id/variants
// Public — used on the event detail page
const getVariants = asyncHandler(async (req, res) => {
  const event = await Event.findById(req.params.id);
  if (!event) {
    res.status(404);
    throw new Error('Event not found.');
  }

  // Owner/admin can see all variants (pending/inactive too);
  // everyone else only sees active + approved ones
  const isOwnerOrAdmin = req.user && (event.organizer.toString() === req.user._id.toString() || req.user.role === 'admin');

  const filter = { event: event._id };
  if (!isOwnerOrAdmin) {
    filter.isActive = true;
    filter.status = 'approved';
  }

  const variants = await TicketVariant.find(filter).sort({ price: 1 });
  res.status(200).json({ results: variants });
});

// @route POST /api/v1/events/:id/variants
const createVariant = asyncHandler(async (req, res) => {
  const event = await getEventAndCheckOwnership(req.params.id, req.user).catch((err) => {
    res.status(err.statusCode || 500);
    throw err;
  });

  const { name, price, seatsPerUnit, capacity } = req.body;
  if (!name || price === undefined || capacity === undefined) {
    res.status(400);
    throw new Error('name, price and capacity are required.');
  }
  if (price < 0 || capacity < 0) {
    res.status(400);
    throw new Error('price and capacity cannot be negative.');
  }

  const variant = await TicketVariant.create({
    event: event._id,
    name,
    price,
    seatsPerUnit: seatsPerUnit || 1,
    capacity,
  });

  res.status(201).json(variant);
});

// @route PUT /api/v1/events/:eventId/variants/:variantId
const updateVariant = asyncHandler(async (req, res) => {
  await getEventAndCheckOwnership(req.params.eventId, req.user).catch((err) => {
    res.status(err.statusCode || 500);
    throw err;
  });

  const variant = await TicketVariant.findOne({ _id: req.params.variantId, event: req.params.eventId });
  if (!variant) {
    res.status(404);
    throw new Error('Variant not found.');
  }

  const { name, price, seatsPerUnit, capacity } = req.body;

  // Capacity can never drop below soldCount — enforced here per spec
  if (capacity !== undefined && capacity < variant.soldCount) {
    res.status(400);
    throw new Error(`Capacity cannot be less than ${variant.soldCount} — that many units are already sold.`);
  }

  if (name !== undefined) variant.name = name;
  if (price !== undefined) variant.price = price;
  if (seatsPerUnit !== undefined) variant.seatsPerUnit = seatsPerUnit;
  if (capacity !== undefined) variant.capacity = capacity;

  await variant.save();
  res.status(200).json(variant);
});

// @route DELETE /api/v1/events/:eventId/variants/:variantId
const deleteVariant = asyncHandler(async (req, res) => {
  await getEventAndCheckOwnership(req.params.eventId, req.user).catch((err) => {
    res.status(err.statusCode || 500);
    throw err;
  });

  const variant = await TicketVariant.findOne({ _id: req.params.variantId, event: req.params.eventId });
  if (!variant) {
    res.status(404);
    throw new Error('Variant not found.');
  }

  if (variant.soldCount > 0) {
    // No hard delete — bookings reference this variant. Just hide it.
    variant.isActive = false;
    await variant.save();
    return res.status(200).json({ success: true, message: 'Variant has sales, so it was deactivated instead of deleted.' });
  }

  await TicketVariant.deleteOne({ _id: variant._id });
  res.status(200).json({ success: true, message: 'Variant deleted.' });
});

module.exports = { getVariants, createVariant, updateVariant, deleteVariant };