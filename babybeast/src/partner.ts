import { startOfDay } from './pregnancy';

/**
 * Partner codes carry only the due date, so no server is needed.
 * Format: BEAST-XXXX, where the first three characters are days since 2020-01-01
 * in base 36 and the last one is a check character that catches typos.
 */
const EPOCH = new Date(2020, 0, 1);
const DAY_MS = 24 * 60 * 60 * 1000;
const ALPHABET = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ';

function checkChar(days: number): string {
  let sum = 7;
  for (const ch of days.toString(36)) sum = (sum * 31 + ch.charCodeAt(0)) % 36;
  return ALPHABET[sum];
}

function daysSinceEpoch(d: Date): number {
  return Math.round((startOfDay(d).getTime() - EPOCH.getTime()) / DAY_MS);
}

export function encodePartnerCode(dueDate: Date): string {
  const days = daysSinceEpoch(dueDate);
  return `BEAST-${days.toString(36).toUpperCase().padStart(3, '0')}${checkChar(days)}`;
}

/** Accepts "BEAST-22QM", "beast22qm", "22QM" and similar. Returns null if the code is wrong. */
export function decodePartnerCode(input: string): Date | null {
  const clean = input.toUpperCase().replace(/[^0-9A-Z]/g, '').replace(/^BEAST/, '');
  if (!/^[0-9A-Z]{4}$/.test(clean)) return null;
  const days = parseInt(clean.slice(0, 3), 36);
  if (Number.isNaN(days) || checkChar(days) !== clean[3]) return null;
  return new Date(EPOCH.getFullYear(), EPOCH.getMonth(), EPOCH.getDate() + days);
}

export const APP_SCHEME = 'babybeast';

/** Invite link, optionally saying which relation the invitee is (babybeast://join/BEAST-22QM?as=grandparent). */
export function partnerLink(dueDate: Date, relation?: string): string {
  return `${APP_SCHEME}://join/${encodePartnerCode(dueDate)}${relation ? `?as=${relation}` : ''}`;
}

/** Pulls the code and optional relation out of an invite link. */
export function parseJoinUrl(url: string | null | undefined): { code: string; relation: string | null } | null {
  if (!url) return null;
  const m = url.match(/join\/([A-Za-z0-9-]+)(?:\?as=([a-z]+))?/);
  return m ? { code: m[1], relation: m[2] ?? null } : null;
}
