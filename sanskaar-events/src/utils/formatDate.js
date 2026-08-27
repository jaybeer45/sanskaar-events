// src/utils/formatDate.js
export const formatDate = (dateStr) => {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-IN', { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' });
};

export const formatTime = (timeStr) => timeStr || '';

export const isToday = (dateStr) => {
  const today = new Date().toISOString().split('T')[0];
  return dateStr === today;
};

export const isTomorrow = (dateStr) => {
  const tomorrow = new Date(Date.now() + 86400000).toISOString().split('T')[0];
  return dateStr === tomorrow;
};

export const getRelativeDay = (dateStr) => {
  if (isToday(dateStr)) return 'Today';
  if (isTomorrow(dateStr)) return 'Tomorrow';
  return formatDate(dateStr);
};
