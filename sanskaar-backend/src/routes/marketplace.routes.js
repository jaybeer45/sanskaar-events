const express = require('express');
const router = express.Router();
const { submitLeadRequest } = require('../controllers/marketplace.controller');
const {getMatches} = require('../controllers/planningRequest.controller')
const { protect } = require('../middleware/auth.middleware');

router.post('/lead', protect, submitLeadRequest);
router.get('/lead/:id/matches', protect, getMatches);

module.exports = router;