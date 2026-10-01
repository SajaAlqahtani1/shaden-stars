const DAY_START_HOUR = 3;

// The day starts at 3:00 AM, so anything recorded before that counts for the previous day.
export function getLocalDateKey(date = new Date()) {
  const shifted = new Date(date);
  shifted.setHours(shifted.getHours() - DAY_START_HOUR);

  const year = shifted.getFullYear();
  const month = String(shifted.getMonth() + 1).padStart(2, "0");
  const day = String(shifted.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}
