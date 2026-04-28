import type { OhlcInterval } from './types';

const ONE_DAY_MS = 86400000;

export const DEFAULT_CURRENT_PRICE = 0.78;
export const MOCK_CHART_MIN_PRICE = 0.1;
export const MOCK_CHART_MAX_PRICE = 1.5;

export const C = {
  lineInside: '#483534',
  lineOutside: '#8E7E7D',
  lineWidthIn: 3,
  lineWidthOut: 1.5,
  nowLine: '#B9ACAB',
  minMaxLine: '#D7CDCB',
  bandFill: '#EDE6E6',
  bandOpacityTop: 0.18,
  bandOpacityBot: 0.1,
  textDim: '#8E7E7D',
  tickInStroke: 'transparent',
  tickOutStroke: 'transparent',
  tickInFill: '#B9ACAB',
  tickInOpacityA: 0.55,
  tickInOpacityB: 0.04,
  tickOutFill: '#EDE6E6',
  tickOutOpacityA: 0.55,
  tickOutOpacityB: 0.04,
  handleCircle: 'white',
  handleGrip: '#B9ACAB',
} as const;

export const RANGES = [
  { label: '1D', ms: 1 * ONE_DAY_MS },
  { label: '1W', ms: 7 * ONE_DAY_MS },
  { label: '1M', ms: 30 * ONE_DAY_MS },
  { label: '1Y', ms: 365 * ONE_DAY_MS },
  { label: 'All time', ms: null },
] as const;

export const RANGE_FETCH_CONFIG: Record<
  (typeof RANGES)[number]['label'],
  { interval: OhlcInterval; lookbackMs: number; limit: number }
> = {
  '1D': { interval: '1h', lookbackMs: 1 * ONE_DAY_MS, limit: 200 },
  '1W': { interval: '1h', lookbackMs: 7 * ONE_DAY_MS, limit: 300 },
  '1M': { interval: '1d', lookbackMs: 30 * ONE_DAY_MS, limit: 300 },
  '1Y': { interval: '1d', lookbackMs: 365 * ONE_DAY_MS, limit: 400 },
  'All time': { interval: '1d', lookbackMs: 730 * ONE_DAY_MS, limit: 500 },
};

export const RANGE_DAYS: Record<(typeof RANGES)[number]['label'], number> = {
  '1D': 1,
  '1W': 7,
  '1M': 30,
  '1Y': 365,
  'All time': 730,
};

export const HEIGHT = 132;
export const ML = { top: 24, right: 0, bottom: 8, left: 0 };
export const TICK_W = 90;
export const TM = { top: 24, right: 0, bottom: 8, left: 0 };

// When false, disables dragging and zooming of the chart. Min/Max are controlled externally.
export const INTERACTIVE = true as const;
export const SHOW_MIN_MAX_HANDLES = true as const;
