const EMPTY_VALUE = '—';
const SECONDS_PER_MINUTE = 60;
const SECONDS_PER_HOUR = 3600;
const SECONDS_PER_DAY = 86400;

const thousandsFormatter = new Intl.NumberFormat('en-US', { maximumFractionDigits: 0 });

/** Rounds and comma-formats a SODA amount. e.g. `1234567.89 → "1,234,568 SODA"`. */
export function formatSodaAmount(value: number | null | undefined): string {
  if (value === null || value === undefined || !Number.isFinite(value)) {
    return EMPTY_VALUE;
  }
  return `${thousandsFormatter.format(Math.round(value))} SODA`;
}

/** Rounds and comma-formats a SODA delta with explicit sign. e.g. `34643 → "+34,643"`. */
export function formatSodaDelta(value: number | null | undefined): string {
  if (value === null || value === undefined || !Number.isFinite(value)) {
    return EMPTY_VALUE;
  }
  const rounded = Math.round(value);
  const sign = rounded > 0 ? '+' : rounded < 0 ? '-' : '';
  return `${sign}${thousandsFormatter.format(Math.abs(rounded))}`;
}

/** Compacts a large number into abbreviated form. e.g. `1079981857 → "1.08B"`, `420_000_000 → "420M"`. */
export function formatLargeNumber(value: number | null | undefined): string {
  if (value === null || value === undefined || !Number.isFinite(value)) {
    return EMPTY_VALUE;
  }
  const abs = Math.abs(value);

  if (abs >= 1_000_000_000) {
    return `${trimTrailingZeros((value / 1_000_000_000).toFixed(2))}B`;
  }
  if (abs >= 1_000_000) {
    return `${trimTrailingZeros((value / 1_000_000).toFixed(abs >= 100_000_000 ? 0 : 1))}M`;
  }
  if (abs >= 1_000) {
    return `${trimTrailingZeros((value / 1_000).toFixed(1))}K`;
  }
  return thousandsFormatter.format(Math.round(value));
}

/** Compacts a large USD amount. e.g. `41965189 → "$42.0M"`, `1_200_000_000 → "$1.2B"`. */
export function formatUsdLarge(value: number | null | undefined): string {
  if (value === null || value === undefined || !Number.isFinite(value)) {
    return EMPTY_VALUE;
  }
  return `$${formatLargeNumber(value)}`;
}

/** Converts seconds-per-transaction cadence into human-readable minutes. e.g. `152.65 → "~2.5 min"`. */
export function formatCadence(cadenceSeconds: number | null | undefined): string {
  if (
    cadenceSeconds === null ||
    cadenceSeconds === undefined ||
    !Number.isFinite(cadenceSeconds) ||
    cadenceSeconds <= 0
  ) {
    return EMPTY_VALUE;
  }

  if (cadenceSeconds < SECONDS_PER_MINUTE) {
    return `~${Math.max(1, Math.round(cadenceSeconds))} sec`;
  }
  if (cadenceSeconds < SECONDS_PER_HOUR) {
    return `~${trimTrailingZeros((cadenceSeconds / SECONDS_PER_MINUTE).toFixed(1))} min`;
  }
  return `~${trimTrailingZeros((cadenceSeconds / SECONDS_PER_HOUR).toFixed(1))} hr`;
}

/** Formats a percentage with explicit +/− sign and one decimal place. e.g. `68.32 → "+68.3%"`. */
export function formatPercentDelta(value: number | null | undefined): string {
  if (value === null || value === undefined || !Number.isFinite(value)) {
    return EMPTY_VALUE;
  }
  const sign = value > 0 ? '+' : value < 0 ? '-' : '';
  const abs = Math.abs(value).toFixed(1);
  return `${sign}${trimTrailingZeros(abs)}%`;
}

/** Returns a relative-time label such as `"just now"`, `"2 min ago"`, `"3 hr ago"`. */
export function formatRelativeTime(iso: string | null | undefined, now: Date = new Date()): string {
  if (!iso) {
    return EMPTY_VALUE;
  }
  const then = new Date(iso).getTime();
  if (!Number.isFinite(then)) {
    return EMPTY_VALUE;
  }

  const diffSeconds = Math.max(0, Math.round((now.getTime() - then) / 1000));
  if (diffSeconds < 30) {
    return 'just now';
  }
  if (diffSeconds < SECONDS_PER_MINUTE) {
    return `${diffSeconds} sec ago`;
  }
  if (diffSeconds < SECONDS_PER_HOUR) {
    const minutes = Math.round(diffSeconds / SECONDS_PER_MINUTE);
    return `${minutes} min ago`;
  }
  if (diffSeconds < SECONDS_PER_DAY) {
    const hours = Math.round(diffSeconds / SECONDS_PER_HOUR);
    return `${hours} hr ago`;
  }
  const days = Math.round(diffSeconds / SECONDS_PER_DAY);
  return `${days} day${days === 1 ? '' : 's'} ago`;
}

/** Read-aloud form of a SODA amount for screen readers. e.g. `1234567 → "1,234,567 SODA"` (same as display). */
export function describeSodaAmount(value: number | null | undefined): string {
  if (value === null || value === undefined || !Number.isFinite(value)) {
    return 'unavailable';
  }
  return `${thousandsFormatter.format(Math.round(value))} SODA`;
}

function trimTrailingZeros(numericString: string): string {
  if (!numericString.includes('.')) {
    return numericString;
  }
  return numericString.replace(/\.?0+$/, '');
}

export { EMPTY_VALUE as EMPTY_STAT_VALUE };
