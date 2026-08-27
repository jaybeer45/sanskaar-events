const express = require('express');
const router = express.Router();
const { updateProfile, saveEvent, unsaveEvent, recordConsent, getConsents } = require('../controllers/user.controller');
const { protect } = require('../middleware/auth.middleware');

router.put('/:id', protect, updateProfile);
router.post('/:id/saved-events', protect, saveEvent);
router.delete('/:id/saved-events/:eventId', protect, unsaveEvent);
router.post('/:id/consents', protect, recordConsent);
router.get('/:id/consents', protect, getConsents);

module.exports = router;