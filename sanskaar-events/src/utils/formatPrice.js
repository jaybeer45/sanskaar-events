// src/utils/formatPrice.js

export const formatPrice = (price) => {
  if (!price) return 'Free';
  if (price.free) return 'Free';
  const fmt = (n) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(Math.round(n));

  return fmt(price.min);
};

export const formatPriceRange = (min, max, currency = 'INR', unit = '') => {
  const fmt = (n) => new Intl.NumberFormat('en-IN', { style: 'currency', currency, maximumFractionDigits: 0 }).format(n);
  return `${fmt(min)} – ${fmt(max)}${unit ? ' ' + unit : ''}`;
};

// Vendor-module money is stored as integer paise (R2). Convert to rupees only
// at the render layer — never do money math in rupees/floats.
export const formatPaise = (paise) => {
  if (paise === undefined || paise === null) return '—';
  return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(Math.round(paise) / 100);
};

export const rupeesToPaise = (rupees) => Math.round(Number(rupees) * 100);

