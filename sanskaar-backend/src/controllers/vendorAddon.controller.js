const asyncHandler = require('express-async-handler');
const Vendor = require('../models/Vendor');
const VendorPackage = require('../models/VendorPackage');
const VendorAddon = require('../models/VendorAddon');

const getPackageAndCheckOwnership = async (vendorId, packageId, user) => {
  const vendor = await Vendor.findById(vendorId);
  if (!vendor) {
    const err = new Error('Vendor not found.');
    err.statusCode = 404;
    throw err;
  }
  if (vendor.user.toString() !== user._id.toString() && user.role !== 'admin') {
    const err = new Error('Only the vendor owner or an admin can manage add-ons.');
    err.statusCode = 403;
    throw err;
  }

  const pkg = await VendorPackage.findById(packageId);
  if (!pkg) {
    const err = new Error('Package not found.');
    err.statusCode = 404;
    throw err;
  }

  return { vendor, pkg };
};

// @route GET /api/v1/vendors/:vendorId/packages/:packageId/addons
// Public
const getAddons = asyncHandler(async (req, res) => {
  const pkg = await VendorPackage.findById(req.params.packageId);
  if (!pkg) {
    res.status(404);
    throw new Error('Package not found.');
  }

  const vendor = await Vendor.findById(req.params.vendorId);
  const isOwnerOrAdmin = req.user && vendor && (vendor.user.toString() === req.user._id.toString() || req.user.role === 'admin');

  const filter = { package: pkg._id };
  if (!isOwnerOrAdmin) filter.isActive = true;

  const results = await VendorAddon.find(filter).sort({ pricePaise: 1 });
  res.status(200).json({ results });
});

// @route POST /api/v1/vendors/:vendorId/packages/:packageId/addons
const createAddon = asyncHandler(async (req, res) => {
  const { pkg } = await getPackageAndCheckOwnership(req.params.vendorId, req.params.packageId, req.user).catch((err) => {
    res.status(err.statusCode || 500);
    throw err;
  });

  const { name, pricePaise, pricingModel, unitLabel, maxQuantity, description } = req.body;
  if (!name || pricePaise === undefined) {
    res.status(400);
    throw new Error('name and pricePaise are required.');
  }

  const addon = await VendorAddon.create({
    package: pkg._id,
    name,
    pricePaise,
    pricingModel: pricingModel || 'FIXED',
    unitLabel: unitLabel || '',
    maxQuantity: maxQuantity || 1,
    description: description || '',
  });

  res.status(201).json(addon);
});

// @route PUT /api/v1/vendors/:vendorId/packages/:packageId/addons/:addonId
const updateAddon = asyncHandler(async (req, res) => {
  await getPackageAndCheckOwnership(req.params.vendorId, req.params.packageId, req.user).catch((err) => {
    res.status(err.statusCode || 500);
    throw err;
  });

  const addon = await VendorAddon.findOne({ _id: req.params.addonId, package: req.params.packageId });
  if (!addon) {
    res.status(404);
    throw new Error('Add-on not found.');
  }

  const fields = ['name', 'pricePaise', 'pricingModel', 'unitLabel', 'maxQuantity', 'description'];
  fields.forEach((f) => {
    if (req.body[f] !== undefined) addon[f] = req.body[f];
  });

  await addon.save();
  res.status(200).json(addon);
});

// @route DELETE /api/v1/vendors/:vendorId/packages/:packageId/addons/:addonId
const deleteAddon = asyncHandler(async (req, res) => {
  await getPackageAndCheckOwnership(req.params.vendorId, req.params.packageId, req.user).catch((err) => {
    res.status(err.statusCode || 500);
    throw err;
  });

  const addon = await VendorAddon.findOne({ _id: req.params.addonId, package: req.params.packageId });
  if (!addon) {
    res.status(404);
    throw new Error('Add-on not found.');
  }

  await VendorAddon.deleteOne({ _id: addon._id }); // leaf node — safe to hard-delete, nothing references it
  res.status(200).json({ success: true, message: 'Add-on deleted.' });
});



module.exports = { getAddons, createAddon, updateAddon, deleteAddon };