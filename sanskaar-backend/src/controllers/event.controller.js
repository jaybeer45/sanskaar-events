const asyncHandler = require("express-async-handler");
const Event = require("../models/Event");
const Organizer = require("../models/Organizer");

// @route GET /api/v1/events
const getEvents = asyncHandler(async (req, res) => {
  const { category, search, isLive, tonight } = req.query;
  const filter = { status: "published" };

  if (category && category !== "all") filter.category = category;
  if (search) filter.title = { $regex: search, $options: "i" };

  if (isLive === "true") {
    const now = new Date();
    filter.date = { $lte: now };
  }

  if (tonight === "true") {
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date();
    endOfDay.setHours(23, 59, 59, 999);
    filter.date = { $gte: startOfDay, $lte: endOfDay };
  }

  const results = await Event.find(filter).sort({ date: 1 });
  res.status(200).json({ results, total: results.length });
});

// @route GET /api/v1/events/:id
const getEventById = asyncHandler(async (req, res) => {
  const event = await Event.findById(req.params.id).populate(
    "organizer",
    "name avatar",
  );
  if (!event) {
    res.status(404);
    throw new Error("Event nahi mila.");
  }
  res.status(200).json(event);
});

// @route GET /api/v1/events/mine
const getMyEvents = asyncHandler(async (req, res) => {
  const results = await Event.find({ organizer: req.user._id }).sort({
    createdAt: -1,
  });
  res.status(200).json({ results, total: results.length });
});

// @route GET /api/v1/events/tonight
const getTonightEvents = asyncHandler(async (req, res) => {
  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);
  const endOfDay = new Date();
  endOfDay.setHours(23, 59, 59, 999);

  const results = await Event.find({
    status: "published",
    date: { $gte: startOfDay, $lte: endOfDay },
  }).sort({ time: 1 });

  res.status(200).json({ results });
});

// @route POST /api/v1/events

const createEvent = asyncHandler(async (req, res) => {
  // Admins can create events directly without an organizer profile.
  if (req.user.role !== "admin") {
    const organizer = await Organizer.findOne({ owner: req.user._id });

    if (!organizer) {
      res.status(403);
      throw new Error(
        "You must register as an organizer before creating events.",
      );
    }
    if (organizer.kycStatus !== "verified") {
      res.status(403);
      throw new Error(
        "Your organizer KYC must be verified before you can publish events. Current status: " +
          organizer.kycStatus,
      );
    }
  }

  const event = await Event.create({
    ...req.body,
    organizer: req.user._id,
    status: "pending_approval", // admin will still approve the actual listing content
  });
  res.status(201).json(event);
});

// @route PUT /api/v1/events/:id
const updateEvent = asyncHandler(async (req, res) => {
  const event = await Event.findById(req.params.id);
  if (!event) {
    res.status(404);
    throw new Error("Event not found.");
  }

  const isAdmin = req.user.roles?.includes("admin");

  if (!isAdmin && event.organizer.toString() !== req.user._id.toString()) {
    res.status(403);
    throw new Error("Only the event organizer or admin can update the event.");
  }

  const disallowedFields = ["status", "rejectionReason", "organizer"];
  disallowedFields.forEach((f) => delete req.body[f]);

  const wasRejected = event.status === "rejected";

  Object.assign(event, req.body);

  if (wasRejected && !isAdmin) {
    event.status = "pending_approval";
    event.rejectionReason = "";
  }

  await event.save();
  res.status(200).json(event);
});

// @route DELETE /api/v1/events/:id
const deleteEvent = asyncHandler(async (req, res) => {
  const event = await Event.findById(req.params.id);
  if (!event) {
    res.status(404);
    throw new Error("Event not found .");
  }

  if (
    event.organizer.toString() !== req.user._id.toString() &&
    req.user.role !== "admin"
  ) {
    res.status(403);
    throw new Error("Only the event organizer or admin can delete the event.");
  }

  await event.deleteOne();
  res.status(200).json({ success: true });
});

// @route PUT /api/v1/events/:id/dates
// Replaces the whole eventDates array in one call — simplest contract for
// an organizer managing a multi-day event's schedule from a form (add one
// day, remove one day, edit a label — all just resubmit the full list).
// Existing soldCount per date is preserved by matching on date; a brand new
// date entry starts at soldCount 0.
const updateEventDates = asyncHandler(async (req, res) => {
  const { dates } = req.body; // [{ date, label, capacity }]
  if (!Array.isArray(dates) || dates.length === 0) {
    res.status(400);
    throw new Error("dates must be a non-empty array.");
  }

  const event = await Event.findById(req.params.id);
  if (!event) {
    res.status(404);
    throw new Error("Event not found.");
  }
  if (
    event.organizer.toString() !== req.user._id.toString() &&
    !req.user.roles.includes("admin")
  ) {
    res.status(403);
    throw new Error("You can only edit your own event.");
  }

  event.eventDates = dates.map((d) => {
    // Keep the existing soldCount for a date that already existed (matched
    // by exact timestamp) — only a genuinely new date starts at 0.
    const existing = event.eventDates.find(
      (ed) => ed.date.getTime() === new Date(d.date).getTime(),
    );
    return {
      date: d.date,
      label: d.label || "",
      capacity: d.capacity || 0,
      soldCount: existing ? existing.soldCount : 0,
    };
  });

  await event.save();
  res.status(200).json(event);
});

module.exports = {
  getEvents,
  getEventById,
  getTonightEvents,
  createEvent,
  updateEvent,
  deleteEvent,
  getMyEvents,
  updateEventDates,
};
