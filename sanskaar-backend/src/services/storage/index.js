// Single entry point for file storage. Every controller imports FROM HERE,
// never directly from local.provider.js or cloudinary.provider.js.
// Switching storage backend later = change STORAGE_PROVIDER in .env. That's it.

const PROVIDER = process.env.STORAGE_PROVIDER || 'local';

const providers = {
  local: require('./local.provider'),
  cloudinary: require('./cloudinary.provider'),
};

if (!providers[PROVIDER]) {
  throw new Error(`Unknown STORAGE_PROVIDER "${PROVIDER}". Use "local" or "cloudinary".`);
}

module.exports = providers[PROVIDER];