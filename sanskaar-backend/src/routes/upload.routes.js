const express = require('express');
const router = express.Router();
const { uploadEventImages, uploadKycDocument, serveKycDocument } = require('../controllers/upload.controller');
const { uploadEventImages: eventMulter, uploadKycDoc: kycMulter } = require('../middleware/upload.middleware');
const { protect } = require('../middleware/auth.middleware');

router.post('/event-images', protect, eventMulter.array('images', 5), uploadEventImages);
router.post('/kyc-document', protect, kycMulter.single('document'), uploadKycDocument);
router.get('/kyc/:userId/:filename', protect, serveKycDocument);

module.exports = router;