import weeksData from '../data/weeks.json';

export type WeekInfo = {
  week: number;
  lengthCm: number;
  weightG: number;
  emoji: string;
  animal: string;
  fact: string;
  baby: string; // what the baby is up to this week
  vs: [string, string, string][]; // [topic, beast, baby] differences
  gross: number; // 1 (cute) to 5 (horrifying)
};

export const WEEKS: WeekInfo[] = weeksData as WeekInfo[];
export const FIRST_WEEK = WEEKS[0].week;
export const LAST_WEEK = WEEKS[WEEKS.length - 1].week;

const DAY_MS = 24 * 60 * 60 * 1000;
export const PREGNANCY_DAYS = 280;

export function startOfDay(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

export function addDays(d: Date, days: number): Date {
  const s = startOfDay(d);
  return new Date(s.getFullYear(), s.getMonth(), s.getDate() + days);
}

/** Readable date in the phone's own locale, e.g. "May 14, 2027" or "14 May 2027". */
export function formatDate(d: Date): string {
  return d.toLocaleDateString(undefined, { day: 'numeric', month: 'long', year: 'numeric' });
}

export type Progress = {
  daysPregnant: number;
  week: number; // completed weeks
  dayOfWeek: number; // 0-6
  daysLeft: number;
  percent: number;
};

/** Gestational age from the due date (40+0). */
export function progressFromDueDate(dueDate: Date, today: Date = new Date()): Progress {
  const daysLeft = Math.round((startOfDay(dueDate).getTime() - startOfDay(today).getTime()) / DAY_MS);
  const daysPregnant = PREGNANCY_DAYS - daysLeft;
  const clamped = Math.max(0, daysPregnant);
  return {
    daysPregnant,
    week: Math.floor(clamped / 7),
    dayOfWeek: clamped % 7,
    daysLeft,
    percent: Math.min(100, Math.max(0, (daysPregnant / PREGNANCY_DAYS) * 100)),
  };
}

export function dueDateFromLastPeriod(lastPeriod: Date): Date {
  return addDays(lastPeriod, PREGNANCY_DAYS);
}

export function infoForWeek(week: number): WeekInfo {
  const w = Math.min(LAST_WEEK, Math.max(FIRST_WEEK, week));
  return WEEKS.find((x) => x.week === w) ?? WEEKS[0];
}

/** "A house mouse (minus the tail)" -> "House mouse" */
export function shortAnimal(info: WeekInfo): string {
  const name = info.animal.replace(/^(A|An) /, '').replace(/\s*\(.*\)$/, '');
  return name.charAt(0).toUpperCase() + name.slice(1);
}

const num = (n: number, digits = 1) => n.toLocaleString('en-US', { maximumFractionDigits: digits });

export function formatLength(cm: number): string {
  if (cm < 1) return `${Math.round(cm * 10)} mm`;
  return `${num(cm)} cm (${num(cm / 2.54)} in)`;
}

export function formatWeight(g: number): string {
  if (g < 1) return 'under 1 g';
  if (g >= 1000) return `${num(g / 1000)} kg (${num(g / 453.592)} lb)`;
  return `${g} g (${num(g / 28.3495)} oz)`;
}

/** Midnight on the day the given week starts (week+0). */
export function unlockDate(dueDate: Date, week: number): Date {
  return addDays(dueDate, week * 7 - PREGNANCY_DAYS);
}

/** "3d 14h 22m 05s" style countdown. */
export function formatCountdown(ms: number): { d: number; h: number; m: number; s: number } {
  const t = Math.max(0, Math.floor(ms / 1000));
  return { d: Math.floor(t / 86400), h: Math.floor((t % 86400) / 3600), m: Math.floor((t % 3600) / 60), s: t % 60 };
}

export function formatShortDate(d: Date): string {
  return d.toLocaleDateString(undefined, { day: 'numeric', month: 'short' });
}

/** Weeks with an extra celebration when their beast hatches. */
export const MILESTONES: Record<number, { title: string; extra: string[] }> = {
  20: { title: 'Halfway there! 🎉', extra: ['🎉', '🎊'] },
  28: { title: 'Third trimester! 🏁', extra: ['🏁', '✨'] },
  40: { title: 'The boss beast is here! 👑', extra: ['👑', '🎉', '🎊'] },
};

/** "12 weeks, 5 days" */
export function weeksAndDaysText(week: number, day: number): string {
  const w = `${week} ${week === 1 ? 'week' : 'weeks'}`;
  return day === 0 ? w : `${w}, ${day} ${day === 1 ? 'day' : 'days'}`;
}
