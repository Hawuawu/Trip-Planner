function pad(n: number): string {
  return String(n).padStart(2, '0');
}

function formatLocalDate(d: Date): string {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

// Builds a Date from the local calendar components of a bare YYYY-MM-DD
// string. Never pass a bare date string to `new Date(...)` directly — that
// parses as UTC midnight and can roll the date back a day in negative-UTC-
// offset zones.
export function parseLocalDate(dateStr: string): Date {
  const [year, month, day] = dateStr.split('-').map(Number);
  return new Date(year, month - 1, day);
}

export function enumerateDays(start: string, end: string): string[] {
  const days: string[] = [];
  const cursor = parseLocalDate(start);
  const endDate = parseLocalDate(end);
  while (cursor <= endDate) {
    days.push(formatLocalDate(cursor));
    cursor.setDate(cursor.getDate() + 1);
  }
  return days;
}

export function localDayKey(isoDateTime: string): string {
  return formatLocalDate(new Date(isoDateTime));
}

export function formatDayLabel(dayKey: string): string {
  return parseLocalDate(dayKey).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}
