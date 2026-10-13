export function startOfToday() {
  const date = new Date();
  date.setHours(0, 0, 0, 0);
  return date;
}

// Events without an end date are single-day: they end on their start date.
export function eventEndDate(event) {
  return event.endDate ?? event.date;
}

const formatIstDate = (date) => new Date(date).toLocaleDateString('en-IN', {
  day: 'numeric', month: 'short', year: 'numeric', timeZone: 'Asia/Kolkata',
});

// "14 Aug 2026" for a single day, "14 Aug 2026 – 16 Aug 2026" for a range.
export function formatDateRange(start, end) {
  const from = formatIstDate(start);
  if (!end) return from;
  const till = formatIstDate(end);
  return till === from ? from : `${from} – ${till}`;
}
