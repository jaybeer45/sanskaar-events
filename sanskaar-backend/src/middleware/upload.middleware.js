const multer = require('multer');

// memoryStorage keeps the file as a buffer in RAM — it does NOT write to disk.
// This is what makes the setup "provider-agnostic": the storage adapter
// (local disk, Cloudinary, S3 — see services/storage/) decides what happens
// to the buffer. Multer itself never needs to change when you switch providers.
const memoryStorage = multer.memoryStorage();

const imageFileFilter = (req, file, cb) => {
  const allowed = ['image/jpeg', 'image/png', 'image/webp'];
  if (allowed.includes(file.mimetype)) cb(null, true);
  else cb(new Error('Only JPG, PNG, or WebP images are allowed.'), false);
};

const kycFileFilter = (req, file, cb) => {
  const allowed = ['image/jpeg', 'image/png', 'application/pdf'];
  if (allowed.includes(file.mimetype)) cb(null, true);
  else cb(new Error('Only JPG, PNG, or PDF files are allowed for documents.'), false);
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

module.exports = { uploadEventImages, uploadKycDoc };