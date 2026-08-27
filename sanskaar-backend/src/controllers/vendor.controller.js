const asyncHandler = require('express-async-handler');
const Vendor = require('../models/Vendor');
const VendorLead = require('../models/VendorLead');
const Rating = require('../models/Rating');

// @route GET /api/v1/vendors
const getVendors = asyncHandler(async (req, res) => {
  const { category, verified, search, minRating } = req.query;
  const filter = { isActive: true };

  if (category && category !== 'all') filter.categories = category;
  if (verified === 'true') filter.isApproved = true;
  if (search) filter.businessName = { $regex: search, $options: 'i' };
  if (minRating) filter.ratingAvg = { $gte: Number(minRating) };

  const results = await Vendor.find(filter).sort({ ratingAvg: -1 });
  res.status(200).json({ results, total: results.length });
});

// @route GET /api/v1/vendors/:id
const getVendorById = asyncHandler(async (req, res) => {
  const vendor = await Vendor.findById(req.params.id).populate('user', 'name avatar');
  if (!vendor) {
    res.status(404);
    throw new Error('Vendor nahi mila.');
  }
  res.status(200).json(vendor);
});

// @route POST /api/v1/vendors/:id/quote
const requestQuote = asyncHandler(async (req, res) => {
  const { message, eventType, budget, eventDate } = req.body;

  const lead = await VendorLead.create({
    vendor: req.params.id,
    user: req.user._id,
    message,
    eventType,
    budget,
    eventDate,
  });

  res.status(201).json({
    success: true,
    message: 'Quote request bhej diya gaya. Vendor 24 ghante me contact karega.',
    leadId: lead._id,
  });
});

// @route POST /api/v1/vendors/:id/reviews
const submitReview = asyncHandler(async (req, res) => {
  const { bookingId, stars, tags, review, photos } = req.body;

  if (!stars) {
    res.status(400);
    throw new Error('Stars rating required hai.');
  }

  const rating = await Rating.create({
    event: req.body.eventId,
    user: req.user._id,
    booking: bookingId,
    stars,
    tags,
    review,
    photos,
  });

  // Vendor ka average rating recalculate karo
  const vendor = await Vendor.findById(req.params.id);
  if (vendor) {
    vendor.ratingCount += 1;
    vendor.ratingAvg = ((vendor.ratingAvg * (vendor.ratingCount - 1)) + stars) / vendor.ratingCount;
    await vendor.save();
  }

  res.status(201).json({ success: true, rating });
});

// @route GET /api/v1/vendors/me
const getMyVendor = asyncHandler(async (req, res) => {
  const vendor = await Vendor.findOne({ user: req.user._id });
  if (!vendor) {
    res.status(404);
    throw new Error('No vendor profile found for this account.');
  }
  res.status(200).json(vendor);
});

// @route POST /api/v1/vendors
const registerVendor = asyncHandler(async (req, res) => {
  const existing = await Vendor.findOne({ user: req.user._id });
  if (existing) {
    res.status(400);
    throw new Error('You already have a vendor profile.');
  }

  const {
    businessName, categories, description, cityId, address, pincode,
    lat, lng, serviceRadiusKm, yearsExperience, phone, whatsapp,
    priceRange, portfolio, acceptedVendorTerms,
  } = req.body;

  if (!businessName || !categories || categories.length === 0) {
    res.status(400);
    throw new Error('businessName and at least one category are required.');
  }
  if (!acceptedVendorTerms) {
    res.status(400);
    throw new Error('You must accept the vendor agreement.');
  }

  const vendor = await Vendor.create({
    user: req.user._id,
    businessName,
    categories,
    description: description || '',
    cityId: cityId || '',
    address: address || '',
    pincode: pincode || '',
    lat,
    lng,
    serviceRadiusKm: serviceRadiusKm || 30,
    yearsExperience: yearsExperience || 0,
    phone: phone || '',
    whatsapp: whatsapp || '',
    priceRange: priceRange || { min: 0, max: 0 },
    portfolio: portfolio || [],
    acceptedVendorTerms: {
      version: 'v1',
      timestamp: new Date(),
      ip: req.ip,
    },
  });

  res.status(201).json(vendor);
});

// @route PATCH /api/v1/vendors/me/bank-details

const updateBankDetails = asyncHandler(async(req , res)=>{
 const {bankAccountName , bankAccountNumber , ifsc , accountType } = req.body ;
 const vendor = await Vendor.findOne({user : req.user._id}) ;
 if(!vendor){
  res.status(404);
  throw new Error('No vendot profile found for this account ')
 }
 if(!bankAccountName , !bankAccountNumber , !ifsc , !accountType ){
    res.send(400);
    throw new Error(' bankAccountName , bankAccountNumber , ifsc and accountType are all required. ');
 }
 
 if(!['saving', 'current'].includes(accountType)){
     res.send(400);
     throw new Error("account type must be 'saving or 'current' ");
 }

 vendor.bankAccountName = bankAccountName.trim();
  vendor.bankAccountNumber = bankAccountNumber.trim();
  vendor.ifsc = ifsc.trim().toUpperCase();
  vendor.accountType = accountType;
  await vendor.save();

  res.status(200).json(vendor);


 
})

module.exports = { getVendors, getVendorById, getMyVendor, registerVendor, requestQuote, submitReview , updateBankDetails };