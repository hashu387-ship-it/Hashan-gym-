import type { SVGProps } from 'react';

type P = SVGProps<SVGSVGElement>;
const base = (p: P) => ({
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 2,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
  'aria-hidden': true,
  width: 22,
  height: 22,
  ...p,
});

export const IconHome = (p: P) => <svg {...base(p)}><path d="M4 11.5 12 5l8 6.5V19a1 1 0 0 1-1 1h-4v-5h-6v5H5a1 1 0 0 1-1-1z" /></svg>;
export const IconDumbbell = (p: P) => <svg {...base(p)}><path d="M6.5 7v10M17.5 7v10M3.5 9.5v5M20.5 9.5v5M6.5 12h11" /></svg>;
export const IconChart = (p: P) => <svg {...base(p)}><path d="M5 20V10M12 20V4M19 20v-7" /></svg>;
export const IconBook = (p: P) => <svg {...base(p)}><path d="M5 4.5A1.5 1.5 0 0 1 6.5 3H19v15H6.5A1.5 1.5 0 0 0 5 19.5zM5 19.5A1.5 1.5 0 0 0 6.5 21H19M9 7h6" /></svg>;
export const IconMoon = (p: P) => <svg {...base(p)}><path d="M20 14.5A8 8 0 1 1 9.5 4a6.5 6.5 0 0 0 10.5 10.5z" /></svg>;
export const IconHeart = (p: P) => <svg {...base(p)}><path d="M12 20s-7-4.4-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 10c0 5.6-7 10-7 10z" /><path d="M8.5 11.5h2l1-2 1.5 4 1-2h1.5" /></svg>;
export const IconSteps = (p: P) => <svg {...base(p)}><path d="M8 3c1.7 0 2.5 1.8 2.5 4S9.5 11 8 11 5.5 9.2 5.5 7 6.3 3 8 3zM6 14h4v2a2 2 0 0 1-4 0zM16 7c1.7 0 2.5 1.8 2.5 4s-1 4-2.5 4-2.5-1.8-2.5-4S14.3 7 16 7zM14 18h4v1a2 2 0 0 1-4 0z" /></svg>;
export const IconGlass = (p: P) => <svg {...base(p)}><path d="M6 3h12l-1.5 17a1 1 0 0 1-1 1h-7a1 1 0 0 1-1-1zM6.6 9h10.8" /></svg>;
export const IconFlame = (p: P) => <svg {...base(p)}><path d="M12 21a6 6 0 0 0 6-6c0-4-3-6-3.5-9.5C12 7 10 9 10 11.5 8.5 10.5 8 9 8 8c-1.5 1.5-2 3.5-2 5a6 6 0 0 0 6 6z" /></svg>;
export const IconClock = (p: P) => <svg {...base(p)}><circle cx="12" cy="12" r="8.5" /><path d="M12 7.5V12l3 2" /></svg>;
export const IconLevel = (p: P) => <svg {...base(p)}><path d="M4 18 6 8l4 4 2-6 2 6 4-4 2 10z" /></svg>;
export const IconArrow = (p: P) => <svg {...base(p)}><path d="M5 12h14M13 6l6 6-6 6" /></svg>;
export const IconChevronRight = (p: P) => <svg {...base(p)}><path d="m9 6 6 6-6 6" /></svg>;
export const IconChevronLeft = (p: P) => <svg {...base(p)}><path d="m15 6-6 6 6 6" /></svg>;
export const IconCheck = (p: P) => <svg {...base(p)}><path d="m5 12.5 4.5 4.5L19 7.5" /></svg>;
export const IconPlay = (p: P) => <svg {...base(p)}><path d="M8 5.5v13l10.5-6.5z" fill="currentColor" stroke="none" /></svg>;
export const IconSwap = (p: P) => <svg {...base(p)}><path d="M4 8h13l-3-3M20 16H7l3 3" /></svg>;
export const IconPill = (p: P) => <svg {...base(p)}><rect x="3" y="8.5" width="18" height="7" rx="3.5" transform="rotate(-35 12 12)" /><path d="m9.6 8.6 4.8 6.8" /></svg>;
export const IconFood = (p: P) => <svg {...base(p)}><path d="M7 3v8M5 3v5a2 2 0 0 0 4 0V3M7 11v10M16 21V3c-2 1.5-3 4-3 7h3" /></svg>;
export const IconScale = (p: P) => <svg {...base(p)}><rect x="4" y="4" width="16" height="16" rx="4" /><path d="M9 9.5a4 4 0 0 1 6 0M12 9.5l1-1.5" /></svg>;
export const IconMinus = (p: P) => <svg {...base(p)}><path d="M6 12h12" /></svg>;
export const IconPlus = (p: P) => <svg {...base(p)}><path d="M12 6v12M6 12h12" /></svg>;
