// ---------- Data Picker Helpers ---------- //

export const WEEKDAY_LABELS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
export const MONTH_LABELS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];


export function toDateInputValue(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}


// Accepts YYYY-MM-DD, MM/DD/YYYY, or M/D/YYYY typed by hand.
// Returns a valid "YYYY-MM-DD" string, or null if the text doesn't
// resolve to a real calendar date (so callers never commit garbage).
export function parseTypedDate(text: string): string | null {
  const trimmed = text.trim();
  if (!trimmed) return null;

  let y: number, m: number, d: number;

  const isoMatch = trimmed.match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/);
  const slashMatch = trimmed.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);

  if (isoMatch) {
    y = parseInt(isoMatch[1], 10);
    m = parseInt(isoMatch[2], 10);
    d = parseInt(isoMatch[3], 10);
  } else if (slashMatch) {
    m = parseInt(slashMatch[1], 10);
    d = parseInt(slashMatch[2], 10);
    y = parseInt(slashMatch[3], 10);
  } else {
    return null;
  }

  if (m < 1 || m > 12 || d < 1 || d > 31) return null;

  const candidate = new Date(y, m - 1, d);
  // Reject dates that overflowed (e.g. Feb 30 rolling into March)
  if (candidate.getFullYear() !== y || candidate.getMonth() !== m - 1 || candidate.getDate() !== d) {
    return null;
  }

  return toDateInputValue(candidate);
}


export function isSameDate(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}


// ---------- Time picker (visual clock/list for scheduling) ---------- //


function buildTimeSlots(): string[] {
  const slots: string[] = [];
  for (let h = 0; h < 24; h++) {
    for (const m of [0, 15, 30, 45]) {
      slots.push(`${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`);
    }
  }
  return slots;
}


export const TIME_SLOTS = buildTimeSlots();


export function formatTimeLabel(time24: string): string {
  const [hStr, m] = time24.split(":");
  const h = parseInt(hStr, 10);
  const period = h >= 12 ? "PM" : "AM";
  const h12 = h % 12 === 0 ? 12 : h % 12;
  return `${h12}:${m} ${period}`;
}


// Accepts "2:30 PM", "2:30pm", "14:30", or "1430" typed by hand.
// Returns a valid "HH:MM" 24hr string, or null if it doesn't resolve
// to a real time (so callers never commit garbage to the payload).
export function parseTypedTime(text: string): string | null {
  const trimmed = text.trim().toLowerCase();
  if (!trimmed) return null;

  const ampmMatch = trimmed.match(/^(\d{1,2}):?(\d{2})?\s*(am|pm)$/);
  const h24Match = trimmed.match(/^(\d{1,2}):(\d{2})$/);
  const digitsMatch = trimmed.match(/^(\d{1,2})(\d{2})$/);

  let h: number, m: number;

  if (ampmMatch) {
    h = parseInt(ampmMatch[1], 10);
    m = ampmMatch[2] ? parseInt(ampmMatch[2], 10) : 0;
    const period = ampmMatch[3];
    if (h < 1 || h > 12) return null;
    if (period === "pm" && h !== 12) h += 12;
    if (period === "am" && h === 12) h = 0;
  } else if (h24Match) {
    h = parseInt(h24Match[1], 10);
    m = parseInt(h24Match[2], 10);
  } else if (digitsMatch) {
    h = parseInt(digitsMatch[1], 10);
    m = parseInt(digitsMatch[2], 10);
  } else {
    return null;
  }

  if (h < 0 || h > 23 || m < 0 || m > 59) return null;

  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}