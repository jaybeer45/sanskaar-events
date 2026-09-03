// All reward/refund numbers live here — a single place to change once the
// mentor confirms final values. Nothing below should ever be hardcoded
// anywhere else; controllers must always import from this file.
module.exports = {
  // Refund policy — tiers checked in order, first match wins.
  // daysBeforeEvent: minimum days between "now" and the event date.
  REFUND_TIERS: [
    { daysBeforeEvent: 7, refundPercent: 100 },
    { daysBeforeEvent: 3, refundPercent: 50 },
    { daysBeforeEvent: 0, refundPercent: 0 },
  ],
};