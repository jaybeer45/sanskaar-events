const asyncHandler = require('express-async-handler');
const Vendor = require('../models/Vendor');
const VendorService = require('../models/VendorService');

const getVendorAndCheckOwnership = async (vendorId, user) => {
  const vendor = await Vendor.findById(vendorId);
  if (!vendor) {
    const err = new Error('Vendor not found.');
    err.statusCode = 404;
    throw err;
  }
  if (vendor.user.toString() !== user._id.toString() && user.role !== 'admin') {
    const err = new Error('Only the vendor owner or an admin can manage services.');
    err.statusCode = 403;
    throw err;
  }
  return vendor;
};

// @route GET /api/v1/vendors/:id/services
// Public — shown on the vendor's public profile
const getServices = asyncHandler(async (req, res) => {
  const vendor = await Vendor.findById(req.params.id);
  if (!vendor) {
    res.status(404);
    throw new Error('Vendor not found.');
  }

  const isOwnerOrAdmin = req.user && (vendor.user.toString() === req.user._id.toString() || req.user.role === 'admin');

  const filter = { vendor: vendor._id };
  if (!isOwnerOrAdmin) filter.isActive = true;

  const results = await VendorService.find(filter).sort({ name: 1 });
  res.status(200).json({ results });
});

// @route POST /api/v1/vendors/:id/services
const createService = asyncHandler(async (req, res) => {
  const vendor = await getVendorAndCheckOwnership(req.params.id, req.user).catch((err) => {
    res.status(err.statusCode || 500);
    throw err;
  });

  const { name, occasions, leadTimeDays } = req.body;
  if (!name) {
    res.status(400);
    throw new Error('name is required.');
  }

  const service = await VendorService.create({
    vendor: vendor._id,
    name,
    occasions: occasions || [],
    leadTimeDays: leadTimeDays ?? 7,
  });

  res.status(201).json(service);
});

// @route PUT /api/v1/vendors/:vendorId/services/:serviceId
const updateService = asyncHandler(async (req, res) => {
  await getVendorAndCheckOwnership(req.params.vendorId, req.user).catch((err) => {
    res.status(err.statusCode || 500);
    throw err;
  });

  const service = await VendorService.findOne({ _id: req.params.serviceId, vendor: req.params.vendorId });
  if (!service) {
    res.status(404);
    throw new Error('Service not found.');
  }

  const { name, occasions, leadTimeDays } = req.body;
  if (name !== undefined) service.name = name;
  if (occasions !== undefined) service.occasions = occasions;
  if (leadTimeDays !== undefined) service.leadTimeDays = leadTimeDays;

  await service.save();
  res.status(200).json(service);
});

// @route DELETE /api/v1/vendors/:vendorId/services/:serviceId
const deleteService = asyncHandler(async (req, res) => {
  await getVendorAndCheckOwnership(req.params.vendorId, req.user).catch((err) => {
    res.status(err.statusCode || 500);
    throw err;
  });

  const service = await VendorService.findOne({ _id: req.params.serviceId, vendor: req.params.vendorId });
  if (!service) {
    res.status(404);
    throw new Error('Service not found.');
  }

  service.isActive = false; // soft delete — packages underneath reference this service
  await service.save();
  res.status(200).json({ success: true, message: 'Service deactivated.' });
});

module.exports = { getServices, createService, updateService, deleteService };