const fs = require('fs');
const path = require('path');

const uploadsRoot = path.join(__dirname, '..', '..', '..', 'uploads');

const ensureDir = (dir) => {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
};

const makeFilename = (originalname) => {
  const ext = path.extname(originalname);
  return `${Date.now()}-${Math.round(Math.random() * 1e9)}${ext}`;
};

// Public — event images. Returns an array of URLs the frontend can use directly in <img src>.
const saveEventImages = async (files, req) => {
  const dir = path.join(uploadsRoot, 'events');
  ensureDir(dir);

  return files.map((file) => {
    const filename = makeFilename(file.originalname);
    fs.writeFileSync(path.join(dir, filename), file.buffer);
    return `${req.protocol}://${req.get('host')}/uploads/events/${filename}`;
  });
};

// Private — KYC documents. Returns an internal reference (NOT a public URL) —
// it can only be fetched later through the authenticated /api/v1/uploads/kyc/:userId/:filename route.
const saveKycDocument = async (file, userId, req) => {
  const dir = path.join(uploadsRoot, 'kyc', userId.toString());
  ensureDir(dir);

  const filename = makeFilename(file.originalname);
  fs.writeFileSync(path.join(dir, filename), file.buffer);

  return {
    reference: `${req.protocol}://${req.get('host')}/api/v1/uploads/kyc/${userId}/${filename}`,
    filename,
  };
};

// Resolves the absolute disk path for a private KYC document, used by the
// authenticated serve route to stream the file back.
const resolveKycDocumentPath = (userId, filename) => {
  return path.join(uploadsRoot, 'kyc', userId.toString(), filename);
};

module.exports = { saveEventImages, saveKycDocument, resolveKycDocumentPath };