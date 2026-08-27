// NOT YET IMPLEMENTED.
// When ready to switch: run `npm install cloudinary`, add credentials to .env,
// implement these 3 functions with the same signatures as local.provider.js,
// then set STORAGE_PROVIDER=cloudinary in .env. Nothing else in the app changes.

const saveEventImages = async (files, req) => {
  throw new Error('Cloudinary provider is not configured yet. Set STORAGE_PROVIDER=local in .env.');
};

const saveKycDocument = async (file, userId, req) => {
  throw new Error('Cloudinary provider is not configured yet. Set STORAGE_PROVIDER=local in .env.');
};

const resolveKycDocumentPath = (userId, filename) => {
  throw new Error('Cloudinary provider is not configured yet. Set STORAGE_PROVIDER=local in .env.');
};

module.exports = { saveEventImages, saveKycDocument, resolveKycDocumentPath };