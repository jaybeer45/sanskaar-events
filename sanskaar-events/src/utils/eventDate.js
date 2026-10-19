// src/utils/eventDate.js

// Dates are shown in the viewer's local time zone (IST for most users), which is
// also what the event detail and profile pages do, so every page agrees.
export const getEventDateParts = (dateInput) => {
  if (!dateInput) return null;
  const d = new Date(dateInput);
  if (Number.isNaN(d.getTime())) return null;
  return {
    day: d.toLocaleDateString("en-IN", { day: "numeric" }),
    month: d.toLocaleDateString("en-IN", { month: "short" }),
    weekday: d.toLocaleDateString("en-IN", { weekday: "short" }),
  };
};

// "18:20" -> "6:20 PM". Strings that already have AM/PM are returned as they are.
export const formatEventTime = (time) => {
  if (!time) return "";
  if (/[AP]M/i.test(time)) return time;
  const match = String(time).match(/^(\d{1,2}):(\d{2})$/);
  if (!match) return time;
  const hours = Number(match[1]);
  return `${hours % 12 || 12}:${match[2]} ${hours >= 12 ? "PM" : "AM"}`;
};

// Calendar day as a sortable number (20261013). Infinity when there is no date.
export const getDayKey = (dateInput) => {
  if (!dateInput) return Infinity;
  const d = new Date(dateInput);
  if (Number.isNaN(d.getTime())) return Infinity;
  return d.getFullYear() * 10000 + (d.getMonth() + 1) * 100 + d.getDate();
};

export const isToday = (dateInput) =>
  getDayKey(dateInput) === getDayKey(new Date());

// "7:00 PM" or "19:00" -> minutes since midnight. Infinity when it cannot be read.
export const timeToMinutes = (time) => {
  if (!time) return Infinity;
  const m = String(time)
    .trim()
    .match(/^(\d{1,2}):(\d{2})\s*([AP]M)?$/i);
  if (!m) return Infinity;
  let hours = Number(m[1]);
  const meridiem = m[3]?.toUpperCase();
  if (meridiem === "PM" && hours < 12) hours += 12;
  if (meridiem === "AM" && hours === 12) hours = 0;
  return hours * 60 + Number(m[2]);
};

// Sort comparator: earliest day first, then earliest start time
export const compareByStart = (a, b) =>
  getDayKey(a.date) - getDayKey(b.date) ||
  timeToMinutes(a.time) - timeToMinutes(b.time);
