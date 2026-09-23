const express = require('express');
const router = express.Router();
const {
  createCreatorVideo,
  getMyCreatorVideos,
  getCreatorLeaderboard,
  getCreatorVideosByEvent,
  deleteCreatorVideo,
  incrementShare,
  incrementView 
} = require('../controllers/creatorVideo.controller');
const { toggleLike } = require('../controllers/videoLike.controller');
const { addComment,getReplies ,  getComments, deleteComment } = require('../controllers/videoComment.controller');
const { protect, attachUserIfPresent } = require('../middleware/auth.middleware');

router.post('/', protect, createCreatorVideo);
router.get('/mine', protect, getMyCreatorVideos);
router.get('/event/:eventId', attachUserIfPresent, getCreatorVideosByEvent);
router.get('/leaderboard/:eventId', getCreatorLeaderboard);
router.post('/:id/like', protect, toggleLike);
router.get('/:id/comments', getComments);
router.post('/:id/comments', protect, addComment);
router.get('/comments/:commentId/replies', getReplies);
router.delete('/comments/:commentId', protect, deleteComment);
router.post('/:id/share', incrementShare);
router.post('/:id/view', incrementView);
router.delete('/:id', protect, deleteCreatorVideo);

module.exports = router;