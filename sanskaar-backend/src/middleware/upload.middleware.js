const multer = require("multer");

// memoryStorage keeps the file as a buffer in RAM — it does NOT write to disk.
// This is what makes the setup "provider-agnostic": the storage adapter
// (local disk, Cloudinary, S3 — see services/storage/) decides what happens
// to the buffer. Multer itself never needs to change when you switch providers.
const memoryStorage = multer.memoryStorage();

const imageFileFilter = (req, file, cb) => {
  const allowed = ["image/jpeg", "image/png", "image/webp"];
  if (allowed.includes(file.mimetype)) cb(null, true);
  else cb(new Error("Only JPG, PNG, or WebP images are allowed."), false);
};

const kycFileFilter = (req, file, cb) => {
  const allowed = ["image/jpeg", "image/png", "application/pdf"];
  if (allowed.includes(file.mimetype)) cb(null, true);
  else
    cb(
      new Error("Only JPG, PNG, or PDF files are allowed for documents."),
      false,
    );
};

const uploadEventImages = multer({
  storage: memoryStorage,
  fileFilter: imageFileFilter,
  limits: { fileSize: 5 * 1024 * 1024, files: 5 }, // 5MB each, max 5 files
});

const uploadKycDoc = multer({
  storage: memoryStorage,
  fileFilter: kycFileFilter,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
});

const videoFileFilter = (req, file, cb) => {
  const allowedMimeTypes = ['video/mp4', 'video/webm', 'video/quicktime'];
  const allowedExtensions = ['.mp4', '.webm', '.mov'];
  const ext = require('path').extname(file.originalname).toLowerCase();

  if (allowedMimeTypes.includes(file.mimetype) || allowedExtensions.includes(ext)) {
    cb(null, true);
  } else {
    cb(new Error('Only MP4, WebM, or MOV videos are allowed.'), false);
  }
};

const uploadEventVideo = multer({
  storage: memoryStorage,
  fileFilter: videoFileFilter,
  limits: { fileSize: 50 * 1024 * 1024 }, // 50MB — MVP limit, event promo video only
});

module.exports = { uploadEventImages, uploadKycDoc, uploadEventVideo };
