import * as d3 from 'd3';

const Q96 = 2n ** 96n;
const SQRT_PRECISION = 1_000_000_000n;

export function getPriceDecimals(value: number): number {
  const absValue = Math.abs(value);
  if (absValue >= 1000) {
    return 2;
  }
  if (absValue >= 1) {
    return 4;
  }
  if (absValue >= 0.1) {
    return 5;
  }
  if (absValue >= 0.01) {
    return 6;
  }
  if (absValue >= 0.001) {
    return 7;
  }
  return 8;
}

export function roundPrice(value: number): number {
  if (!Number.isFinite(value)) {
    return 0;
  }
  return +value.toFixed(getPriceDecimals(value));
}

export function formatPairPrice(value: number): string {
  const decimals = Math.abs(value) >= 1 ? 2 : getPriceDecimals(value);
  return d3.format(`,.${decimals}f`)(value);
}

export function normalizeExternalPrice(value: number | null | undefined): number | null {
  if (value === null || value === undefined || !Number.isFinite(value) || value <= 0) {
    return null;
  }
  return roundPrice(value);
}

export function tickIndexToPrice(tick: number): number | null {
  if (!Number.isFinite(tick)) {
    return null;
  }
  const price = 1.0001 ** tick;
  if (!Number.isFinite(price) || price <= 0) {
    return null;
  }
  return roundPrice(price);
}

export function sqrtPriceX96ToPrice(value: string): number | null {
  if (!/^\d+$/.test(value)) {
    return null;
  }
  const sqrtX96 = BigInt(value);
  if (sqrtX96 <= 0n) {
    return null;
  }

  const integerPart = sqrtX96 / Q96;
  const fractionPart = ((sqrtX96 % Q96) * SQRT_PRECISION) / Q96;
  const sqrtAsNumber = Number(integerPart) + Number(fractionPart) / Number(SQRT_PRECISION);
  if (!Number.isFinite(sqrtAsNumber) || sqrtAsNumber <= 0) {
    return null;
  }

  const price = sqrtAsNumber * sqrtAsNumber;
  return Number.isFinite(price) && price > 0 ? roundPrice(price) : null;
}
