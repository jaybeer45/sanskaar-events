const express = require('express');
const router = express.Router();
const { createRequest, getMyRequests, getRequestByReference , getMatches , approveMatch } = require('../controllers/planningRequest.controller');
const { protect } = require('../middleware/auth.middleware');


router.use(protect);

router.post('/', createRequest);
router.get('/mine', getMyRequests);
router.get('/:reference', getRequestByReference);
router.get('/:reference/matches', getMatches);
router.post('/:reference/approve', approveMatch);

module.exports = router;