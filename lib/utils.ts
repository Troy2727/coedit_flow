import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

/** Join class names; later Tailwind classes win over earlier ones (used by components/ui). */
export function cn(...classes: ClassValue[]) {
  return twMerge(clsx(classes));
}

/**
 * Server actions can only return plain JSON values to the client, and the
 * Liveblocks SDK returns objects with Dates and class instances.
 */
export const parseStringify = <T = any>(value: unknown): T => JSON.parse(JSON.stringify(value));

/** Liveblocks room permissions for each role. Viewers can read and show their cursor. */
export function getAccessType(role: UserType | GeneralAccess): AccessType {
  return role === 'creator' || role === 'editor' ? ['room:write'] : ['room:read', 'room:presence:write'];
}

const UNITS: [unit: Intl.RelativeTimeFormatUnit, seconds: number][] = [
  ['week', 7 * 24 * 3600],
  ['day', 24 * 3600],
  ['hour', 3600],
  ['minute', 60],
];
const relative = new Intl.RelativeTimeFormat('en', { numeric: 'always' });

/** "Just now", "5 minutes ago", "2 days ago", "3 weeks ago". */
export function dateConverter(timestamp: string): string {
  const secondsAgo = (Date.now() - new Date(timestamp).getTime()) / 1000;
  for (const [unit, size] of UNITS) {
    if (secondsAgo >= size) return relative.format(-Math.floor(secondsAgo / size), unit);
  }
  return 'Just now';
}

// Cursor labels show white text on these, so each keeps at least 4.5:1 contrast
// with white (WCAG AA) and stays visible on the dark page.
export const cursorColors = {
  Blue: '#2563EB',
  Violet: '#7C3AED',
  Pink: '#DB2777',
  Red: '#DC2626',
  Orange: '#C2410C',
  Emerald: '#047857',
  Teal: '#0F766E',
  Sky: '#0369A1',
  Purple: '#9333EA',
  Rose: '#BE185D',
  Amber: '#A16207',
  Green: '#15803D',
};

export const brightColors = Object.values(cursorColors);

/** The user's saved cursor color, or a stable default picked from their id. */
export function getCursorColor(userId: string, savedColor: unknown): string {
  if (typeof savedColor === 'string' && brightColors.includes(savedColor)) return savedColor;
  let hash = 0;
  for (const char of userId) hash += char.charCodeAt(0);
  return brightColors[hash % brightColors.length];
}
