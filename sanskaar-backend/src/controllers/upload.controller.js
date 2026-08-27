const asyncHandler = require('express-async-handler');
const path = require('path');
const storage = require('../services/storage');
const Organizer = require('../models/Organizer');

// @route POST /api/v1/uploads/event-images
// @desc  Public — returns URLs to use directly in the event form (images[])
const uploadEventImages = asyncHandler(async (req, res) => {
  if (!req.files || req.files.length === 0) {
    res.status(400);
    throw new Error('At least one image file is required.');
  }

  const urls = await storage.saveEventImages(req.files, req);
  res.status(200).json({ urls });
});

// @route POST /api/v1/uploads/kyc-document
// @desc  Private — returns a reference URL that only works through the authenticated serve route
const uploadKycDocument = asyncHandler(async (req, res) => {
  if (!req.file) {
    res.status(400);
    throw new Error('A document file is required.');
  }

  const result = await storage.saveKycDocument(req.file, req.user._id, req);
  res.status(200).json({ url: result.reference });
});

// @route GET /api/v1/uploads/kyc/:userId/:filename
// @desc  Private — only the document owner or an admin/moderator can view it
const serveKycDocument = asyncHandler(async (req, res) => {
  const { userId, filename } = req.params;

  const isOwner = req.user._id.toString() === userId;
  const isPrivileged = ['admin', 'moderator'].includes(req.user.role);

  if (!isOwner && !isPrivileged) {
    res.status(403);
    throw new Error('You are not authorized to view this document.');
  }

  // Lightweight audit trail — logs who accessed a sensitive KYC document and when
  console.log(`[KYC ACCESS] user=${req.user._id} role=${req.user.role} viewed doc owner=${userId} file=${filename} at=${new Date().toISOString()}`);

  const filePath = storage.resolveKycDocumentPath(userId, filename);
  res.sendFile(filePath, (err) => {
    if (err) {
      res.status(404);
      throw new Error('Document not found.');
    }
  });
});

module.exports = { uploadEventImages, uploadKycDocument, serveKycDocument };