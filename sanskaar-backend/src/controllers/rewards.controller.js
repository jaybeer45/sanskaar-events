const asyncHandler = require('express-async-handler');
const User = require('../models/User');
const WalletTransaction = require('../models/WalletTransaction');

// Credits or debits a user's wallet and writes the matching ledger entry in
// one place — nothing else in the codebase should touch
// User.walletBalancePaise directly.
const adjustWallet = async (userId, amountPaise, type, reason, relatedBooking = null) => {
  const delta = type === 'credit' ? amountPaise : -amountPaise;
  const user = await User.findByIdAndUpdate(
    userId,
    { $inc: { walletBalancePaise: delta } },
    { new: true }
  );
  await WalletTransaction.create({
    user: userId,
    type,
    amountPaise,
    reason,
    relatedBooking,
    balanceAfterPaise: user.walletBalancePaise,
  });
  return user.walletBalancePaise;
};

// @route GET /api/v1/users/me/wallet
const getMyWallet = asyncHandler(async (req, res) => {
  const transactions = await WalletTransaction.find({ user: req.user._id })
    .sort({ createdAt: -1 })
    .limit(50);
  res.status(200).json({ balancePaise: req.user.walletBalancePaise, transactions });
});

module.exports = { adjustWallet, getMyWallet };
