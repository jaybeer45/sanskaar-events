const express = require('express');
const router = express.Router();
const { getEvents, getEventById, getTonightEvents, createEvent, updateEvent, deleteEvent,getMyEvents , updateEventDates} = require('../controllers/event.controller');
const { getVariants, createVariant, updateVariant, deleteVariant,} = require('../controllers/ticketVariant.controller');
const { protect, authorize } = require('../middleware/auth.middleware');
const { inviteStaff, listStaff, revokeStaff } = require('../controllers/organizerStaff.controller');
const { checkInTicket } = require('../controllers/checkin.controller');

router.get('/tonight', getTonightEvents);
router.get('/mine', protect, getMyEvents);
router.get('/', getEvents);
router.get('/:id', getEventById);

router.post('/', protect, createEvent);
router.put('/:id', protect, authorize('organizer', 'admin'), updateEvent);
router.delete('/:id', protect, authorize('organizer', 'admin'), deleteEvent);
router.put('/:id/dates', protect, authorize('organizer', 'admin'), updateEventDates);

// Ticket variants — nested under event
router.get('/:id/variants', getVariants);
router.post('/:id/variants', protect, createVariant);
router.put('/:eventId/variants/:variantId', protect, updateVariant);
router.delete('/:eventId/variants/:variantId', protect, deleteVariant);

// Staff & gate access
router.post('/:eventId/staff', protect, inviteStaff);
router.get('/:eventId/staff', protect, listStaff);
router.delete('/:eventId/staff/:staffId', protect, revokeStaff);
router.post('/:eventId/checkin', protect, checkInTicket);

module.exports = router;