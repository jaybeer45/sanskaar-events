// src/routes/liveStream.routes.js
const express = require('express');
const router = express.Router();
const { startLiveStream, endLiveStream, getActiveLiveForEvent } = require('../controllers/liveStream.controller');
const { protect } = require('../middleware/auth.middleware');

router.post('/', protect, startLiveStream);
router.patch('/:id/end', protect, endLiveStream);
router.get('/event/:eventId', getActiveLiveForEvent);

module.exports = router;