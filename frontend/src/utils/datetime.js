const IST_TIME_ZONE = 'Asia/Kolkata';

function parseApiDate(value) {
  // Backend dates are UTC; old rows may arrive without the "Z" suffix.
  if (!value) return null;
  const hasTimezone = /[zZ]|[+-]\d{2}:\d{2}$/.test(value);
  return new Date(hasTimezone ? value : `${value}Z`);
}

export function formatIstDateTime(value) {
  // Show order times exactly as Indian Standard Time for the assessment.
  const date = parseApiDate(value);
  if (!date || Number.isNaN(date.getTime())) return 'Invalid date';

  return new Intl.DateTimeFormat('en-IN', {
    dateStyle: 'medium',
    timeStyle: 'short',
    timeZone: IST_TIME_ZONE,
  }).format(date);
}

export function getIstDateStamp(value) {
  // Date filters compare only the calendar day in India.
  const date = parseApiDate(value);
  if (!date || Number.isNaN(date.getTime())) return 0;

  const parts = new Intl.DateTimeFormat('en-CA', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    timeZone: IST_TIME_ZONE,
  }).formatToParts(date);

  const year = parts.find((part) => part.type === 'year')?.value;
  const month = parts.find((part) => part.type === 'month')?.value;
  const day = parts.find((part) => part.type === 'day')?.value;
  return new Date(`${year}-${month}-${day}T00:00:00`).getTime();
}
