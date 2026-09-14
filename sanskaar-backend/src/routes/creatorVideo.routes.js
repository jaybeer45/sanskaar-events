const express = require('express');
const router = express.Router();
const {
  createCreatorVideo,
  getMyCreatorVideos,
  getCreatorVideosByEvent,
  deleteCreatorVideo,
} = require('../controllers/creatorVideo.controller');
const { protect } = require('../middleware/auth.middleware');

router.post('/', protect, createCreatorVideo);
router.get('/mine', protect, getMyCreatorVideos);
router.get('/event/:eventId', getCreatorVideosByEvent); // public — no protect
router.delete('/:id', protect, deleteCreatorVideo);

module.exports = router;