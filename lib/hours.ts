export interface HoursRow {
  day_of_week: number;
  open_time: string;
  close_time: string;
  is_closed: number;
}

export function isCurrentlyOpen(hours: HoursRow[]): boolean {
  if (hours.length === 0) return true; // no hours set = always open (unset owner restaurant)
  const now = new Date();
  const dow = now.getDay();
  const timeStr = now.toTimeString().slice(0, 5);
  const today = hours.find(h => h.day_of_week === dow);
  if (!today || today.is_closed) return false;
  return timeStr >= today.open_time && timeStr < today.close_time;
}
