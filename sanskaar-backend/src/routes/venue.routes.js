const express = require('express');
const router = express.Router();
const { getMyVenues, createVenue, deleteVenue } = require('../controllers/venue.controller');
const { protect } = require('../middleware/auth.middleware');

router.use(protect);

router.get('/mine', getMyVenues);
router.post('/', createVenue);
router.delete('/:id', deleteVenue);

module.exports = router;