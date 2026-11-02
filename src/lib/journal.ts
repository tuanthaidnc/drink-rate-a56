import { localDayParts } from './frequency.ts';
import type { ReviewItem } from './models.ts';
export function journalDay(at: string | Date): string {
  const p = localDayParts(typeof at === 'string' ? new Date(at) : at);
  return `${p.year}-${String(p.month + 1).padStart(2, '0')}-${String(p.day).padStart(2, '0')}`;
}
export function journalGroups(items: ReviewItem[]): Map<string, ReviewItem[]> {
  const days = new Map<string, ReviewItem[]>();
  [...items].filter(r => !r.isDemo).sort((a,b) => Date.parse(b.reviewedAt ?? b.createdAt) - Date.parse(a.reviewedAt ?? a.createdAt)).forEach(r => {
    const day = journalDay(r.reviewedAt ?? r.createdAt);
    days.set(day, [...(days.get(day) ?? []), r]);
  });
  return days;
}
export function monthCells(month: string) {
  const [y,m] = month.split('-').map(Number);
  const first = new Date(Date.UTC(y, m - 1, 1));
  const length = new Date(Date.UTC(y, m, 0)).getUTCDate();
  const offset = (first.getUTCDay() + 6) % 7;
  return Array.from({ length: Math.ceil((offset + length) / 7) * 7 }, (_, i) => {
    const day = i - offset + 1;
    return day < 1 || day > length ? null : `${month}-${String(day).padStart(2,'0')}`;
  });
}
export function adjacentMonth(month: string, delta: number) {
  const [y,m] = month.split('-').map(Number);
  const at = new Date(Date.UTC(y, m - 1 + delta, 1));
  return `${at.getUTCFullYear()}-${String(at.getUTCMonth() + 1).padStart(2,'0')}`;
}
