const asyncHandler = require('express-async-handler');
const Vendor = require('../models/Vendor');
const VendorService = require('../models/VendorService');
const VendorPackage = require('../models/VendorPackage');

const getServiceAndCheckOwnership = async (vendorId, serviceId, user) => {
  const vendor = await Vendor.findById(vendorId);
  if (!vendor) {
    const err = new Error('Vendor not found.');
    err.statusCode = 404;
    throw err;
  }
  if (vendor.user.toString() !== user._id.toString() && user.role !== 'admin') {
    const err = new Error('Only the vendor owner or an admin can manage packages.');
    err.statusCode = 403;
    throw err;
  }

  const service = await VendorService.findOne({ _id: serviceId, vendor: vendorId });
  if (!service) {
    const err = new Error('Service not found.');
    err.statusCode = 404;
    throw err;
  }

  return { vendor, service };
};

// @route GET /api/v1/vendors/:vendorId/services/:serviceId/packages
// Public — shown on the vendor's public profile
const getPackages = asyncHandler(async (req, res) => {
  const service = await VendorService.findOne({ _id: req.params.serviceId, vendor: req.params.vendorId });
  if (!service) {
    res.status(404);
    throw new Error('Service not found.');
  }

  const vendor = await Vendor.findById(req.params.vendorId);
  const isOwnerOrAdmin = req.user && vendor && (vendor.user.toString() === req.user._id.toString() || req.user.role === 'admin');

  const filter = { service: service._id };
  if (!isOwnerOrAdmin) filter.isActive = true;

  const results = await VendorPackage.find(filter).sort({ pricePaise: 1 });
  res.status(200).json({ results });
});

// @route POST /api/v1/vendors/:vendorId/services/:serviceId/packages
const createPackage = asyncHandler(async (req, res) => {
  const { service } = await getServiceAndCheckOwnership(req.params.vendorId, req.params.serviceId, req.user).catch((err) => {
    res.status(err.statusCode || 500);
    throw err;
  });

  const {
    name, pricingModel, pricePaise, unitLabel, minUnits, maxUnits,
    durationHours, inclusions, exclusions, advancePercent, capacityPerDay,
  } = req.body;

  if (!name || !pricingModel) {
    res.status(400);
    throw new Error('name and pricingModel are required.');
  }

  if (pricingModel !== 'CUSTOM_QUOTE' && (pricePaise === undefined || pricePaise === null)) {
    res.status(400);
    throw new Error('pricePaise (amount in paise) is required for all pricing models except CUSTOM_QUOTE.');
  }

  if (['PER_UNIT', 'PER_PERSON'].includes(pricingModel) && !unitLabel) {
    res.status(400);
    throw new Error('unitLabel is required for PER_UNIT and PER_PERSON pricing models.');
  }

  if (!inclusions || inclusions.length < 2 || inclusions.length > 15) {
    res.status(400);
    throw new Error('inclusions must have between 2 and 15 items.');
  }

  const pkg = await VendorPackage.create({
    service: service._id,
    name,
    pricingModel,
    pricePaise,
    unitLabel: unitLabel || '',
    minUnits,
    maxUnits,
    durationHours,
    inclusions,
    exclusions: exclusions || [],
    advancePercent: advancePercent ?? 50,
    capacityPerDay,
  });

  res.status(201).json(pkg);
});

// @route PUT /api/v1/vendors/:vendorId/services/:serviceId/packages/:packageId
const updatePackage = asyncHandler(async (req, res) => {
  await getServiceAndCheckOwnership(req.params.vendorId, req.params.serviceId, req.user).catch((err) => {
    res.status(err.statusCode || 500);
    throw err;
  });

  const pkg = await VendorPackage.findOne({ _id: req.params.packageId, service: req.params.serviceId });
  if (!pkg) {
    res.status(404);
    throw new Error('Package not found.');
  }

  const fields = [
    'name', 'pricingModel', 'pricePaise', 'unitLabel', 'minUnits', 'maxUnits',
    'durationHours', 'inclusions', 'exclusions', 'advancePercent', 'capacityPerDay',
  ];
  fields.forEach((f) => {
    if (req.body[f] !== undefined) pkg[f] = req.body[f];
  });

  await pkg.save(); // triggers the inclusions min/max validator again on save
  res.status(200).json(pkg);
});

// @route DELETE /api/v1/vendors/:vendorId/services/:serviceId/packages/:packageId
const deletePackage = asyncHandler(async (req, res) => {
  await getServiceAndCheckOwnership(req.params.vendorId, req.params.serviceId, req.user).catch((err) => {
    res.status(err.statusCode || 500);
    throw err;
  });

  const pkg = await VendorPackage.findOne({ _id: req.params.packageId, service: req.params.serviceId });
  if (!pkg) {
    res.status(404);
    throw new Error('Package not found.');
  }

  pkg.isActive = false; // soft delete — add-ons underneath reference this package
  await pkg.save();
  res.status(200).json({ success: true, message: 'Package deactivated.' });
});

module.exports = { getPackages, createPackage, updatePackage, deletePackage };