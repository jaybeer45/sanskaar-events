const asyncHandler = require('express-async-handler');
const Organizer = require('../models/Organizer');
const Otp = require('../models/Otp');

// @route POST /api/v1/organizers
const registerOrganizer = asyncHandler(async (req, res) => {
  const existing = await Organizer.findOne({ owner: req.user._id });
  if (existing) {
    res.status(400);
    throw new Error('You have already registered as an organizer');
  }

  const {
    displayName, organizerType, cityId, categoryIds, about, logoUrl,
    contactName, contactPhone, contactEmail, links, expectedVolume,
    acceptedOrganizerTerms,
  } = req.body;

  if (!displayName || !organizerType || !cityId || !categoryIds?.length || !contactName || !contactPhone || !contactEmail) {
    res.status(400);
    throw new Error('Zaroori fields missing hain.');
  }
  if (!acceptedOrganizerTerms) {
    res.status(400);
    throw new Error('Organizer agreement accept karna zaroori hai.');
  }
  if (categoryIds.length > 5) {
    res.status(400);
    throw new Error('Maximum 5 categories chuni ja sakti hain.');
  }
  if (links && links.length > 5) {
    res.status(400);
    throw new Error('Maximum 5 links allowed hain.');
  }

  const organizer = await Organizer.create({
    owner: req.user._id,
    displayName, organizerType, cityId, categoryIds, about, logoUrl,
    contactName, contactPhone, contactEmail,
    links: links || [],
    expectedVolume: expectedVolume || null,
    acceptedOrganizerTerms: { version: 'v1', timestamp: new Date(), ip: req.ip },
  });

  res.status(201).json(organizer.toSafeObject());
});

// @route GET /api/v1/organizers/me
const getMyOrganizer = asyncHandler(async (req, res) => {
  const organizer = await Organizer.findOne({ owner: req.user._id });
  if (!organizer) {
    res.status(404);
    throw new Error('You have not registered as an organizer yet');
  }
  res.status(200).json(organizer.toSafeObject());
});

// @route POST /api/v1/organizers/:id/kyc
const submitKyc = asyncHandler(async (req, res) => {
  const organizer = await Organizer.findById(req.params.id);
  if (!organizer) {
    res.status(404);
    throw new Error('Organizer profile not found .');
  }
  if (organizer.owner.toString() !== req.user._id.toString()) {
    res.status(403);
    throw new Error('You can onlly submit kyc .');
  }
  if (!organizer.contactPhoneVerified || !organizer.contactEmailVerified) {
    res.status(400);
    throw new Error('Before submiting kyc phone and email verification is required .');
  }

  const {
    legalName, pan, gstin, address, idDocUrl, businessDocUrl,
    bankAccountName, bankAccountNumber, bankAccountNumberConfirm,
    ifsc, accountType, chequeUrl, payoutFrequency,
  } = req.body;

  if (!legalName || !pan || !address?.pincode || !idDocUrl || !bankAccountName || !bankAccountNumber || !ifsc || !accountType) {
    res.status(400);
    throw new Error('KYC ke saare zaroori fields bharna hai.');
  }
  if (!/^[A-Z]{5}[0-9]{4}[A-Z]$/.test(pan)) {
    res.status(400);
    throw new Error('PAN format galat hai.');
  }
  if (!/^[1-9][0-9]{5}$/.test(address.pincode)) {
    res.status(400);
    throw new Error('Pincode galat hai.');
  }
  if (!/^[A-Z]{4}0[A-Z0-9]{6}$/.test(ifsc)) {
    res.status(400);
    throw new Error('IFSC code galat hai.');
  }
  if (bankAccountNumber !== bankAccountNumberConfirm) {
    res.status(400);
    throw new Error('Account number dono baar match nahi kar raha.');
  }
  const nonIndividualTypes = ['proprietorship', 'partnership', 'pvt_ltd', 'llp', 'trust_ngo', 'government'];
  if (nonIndividualTypes.includes(organizer.organizerType) && !gstin) {
    res.status(400);
    throw new Error(' GSTIN is required .');
  }
  if (nonIndividualTypes.includes(organizer.organizerType) && !businessDocUrl) {
    res.status(400);
    throw new Error('Business proof document required.');
  }

  organizer.kyc = {
    legalName, pan, gstin, address, idDocUrl, businessDocUrl,
    bankAccountName, bankAccountNumber, ifsc, accountType,
    chequeUrl, payoutFrequency: payoutFrequency || 'per_event_t2',
  };
  organizer.kycStatus = 'submitted';
  organizer.kycRejectionReason = '';

  

  await organizer.save();
  res.status(200).json(organizer.toSafeObject());
});

// @route POST /api/v1/organizers/:id/contact-otp/send
const sendContactOtp = asyncHandler(async (req, res) => {
  const organizer = await Organizer.findById(req.params.id);
  if (!organizer) {
    res.status(404);
    throw new Error('Organizer profile nahi mila.');
  }
  if (organizer.owner.toString() !== req.user._id.toString()) {
    res.status(403);
    throw new Error('Aap sirf apni hi contact details verify kar sakte hain.');
  }

  const { field } = req.body; // 'phone' ya 'email'
  if (!['phone', 'email'].includes(field)) {
    res.status(400);
    throw new Error("field 'phone' ya 'email' hona chahiye.");
  }

  const identifier = field === 'phone' ? organizer.contactPhone : organizer.contactEmail;

  const code = String(Math.floor(100000 + Math.random() * 900000));
  const expiresAt = new Date(Date.now() + 5 * 60 * 1000);

  await Otp.create({ identifier, code, purpose: 'organizer_contact', expiresAt });

  console.log(`[DEV OTP] ${identifier} -> ${code}`); // baad me SMS/email gateway lagega

  res.status(200).json({ success: true, message: `OTP ${field} pe bhej diya gaya hai.` });
});

// @route POST /api/v1/organizers/:id/contact-otp/verify
const verifyContactOtp = asyncHandler(async (req, res) => {
  const organizer = await Organizer.findById(req.params.id);
  if (!organizer) {
    res.status(404);
    throw new Error('Organizer profile nahi mila.');
  }
  if (organizer.owner.toString() !== req.user._id.toString()) {
    res.status(403);
    throw new Error('Aap sirf apni hi contact details verify kar sakte hain.');
  }

  const { field, code } = req.body;
  if (!['phone', 'email'].includes(field) || !code) {
    res.status(400);
    throw new Error('field aur code dono required hain.');
  }

  const identifier = field === 'phone' ? organizer.contactPhone : organizer.contactEmail;

  const entry = await Otp.findOne({ identifier, code, purpose: 'organizer_contact' }).sort({ createdAt: -1 });
  if (!entry) {
    res.status(400);
    throw new Error('Galat ya expired OTP.');
  }
  if (entry.expiresAt < new Date()) {
    res.status(400);
    throw new Error('OTP expire ho chuka hai.');
  }

  await Otp.deleteOne({ _id: entry._id });

  if (field === 'phone') organizer.contactPhoneVerified = true;
  else organizer.contactEmailVerified = true;

  await organizer.save();
  res.status(200).json(organizer.toSafeObject());
});

module.exports = { registerOrganizer, getMyOrganizer, submitKyc ,  sendContactOtp, verifyContactOtp };