import type { PricePoint } from './types';
import { DEFAULT_CURRENT_PRICE, MOCK_CHART_MIN_PRICE, MOCK_CHART_MAX_PRICE } from './constants';
import { roundPrice } from './price-utils';

function clampMockPrice(value: number): number {
  return Math.max(MOCK_CHART_MIN_PRICE, Math.min(MOCK_CHART_MAX_PRICE, value));
}

function createSeededRandom(seed: number): () => number {
  let state = seed >>> 0;
  return (): number => {
    state = (state * 1664525 + 1013904223) >>> 0;
    return state / 4294967296;
  };
}

export function generatePairData(days: number): PricePoint[] {
  const data: PricePoint[] = [];
  const now = Date.now();
  const intervalMs = days <= 1 ? 60 * 60 * 1000 : 24 * 60 * 60 * 1000;
  const totalIntervals = Math.max(2, Math.floor((days * 24 * 60 * 60 * 1000) / intervalMs) + 1);
  const random = createSeededRandom(days * 9973 + 17);

  let price = DEFAULT_CURRENT_PRICE * (0.92 + random() * 0.16);
  let velocity = 0;
  let regimeDrift = (random() - 0.5) * 0.02;
  let regimeSpan = Math.max(8, Math.floor(totalIntervals * (0.08 + random() * 0.12)));

  for (let i = totalIntervals - 1; i >= 0; i--) {
    const index = totalIntervals - 1 - i;
    if (index > 0 && index % regimeSpan === 0) {
      regimeDrift = (random() - 0.5) * 0.03;
      regimeSpan = Math.max(8, Math.floor(totalIntervals * (0.06 + random() * 0.18)));
    }

    const shock = random() < 0.04 ? (random() - 0.5) * 0.22 : 0;
    const noise = (random() - 0.5) * 0.04;
    const meanReversion = (DEFAULT_CURRENT_PRICE - price) * 0.08;
    velocity = velocity * 0.6 + regimeDrift + noise + shock + meanReversion;

    price = clampMockPrice(price + velocity);
    const isLast = i === 0;
    const nextPrice = isLast ? DEFAULT_CURRENT_PRICE : price;
    data.push({ time: now - i * intervalMs, price: roundPrice(nextPrice) });
  }

  return data;
}

export function getInitialPriceBand(
  prices: PricePoint[],
  fallbackPrice: number,
): { min: number; max: number } {
  const validPrices = prices.map(point => point.price).filter(price => Number.isFinite(price) && price > 0);
  const latestValidPrice = validPrices.length > 0 ? validPrices[validPrices.length - 1] : undefined;

  const basePrice =
    latestValidPrice !== undefined
      ? latestValidPrice
      : Number.isFinite(fallbackPrice) && fallbackPrice > 0
        ? fallbackPrice
        : DEFAULT_CURRENT_PRICE;

  const seriesMin = validPrices.length > 0 ? Math.min(...validPrices) : basePrice;
  const seriesMax = validPrices.length > 0 ? Math.max(...validPrices) : basePrice;
  const marketSpan = Math.max(seriesMax - seriesMin, 0);
  const minSpan = Math.max(basePrice * 0.006, 0.000001);
  const bandSpan = Math.max(marketSpan * 2.5, minSpan);

  const computedMin = Math.max(basePrice - bandSpan / 2, 0.00000001);
  const computedMax = basePrice + bandSpan / 2;
  const roundedMin = roundPrice(computedMin);
  const roundedMax = roundPrice(computedMax);

  if (!Number.isFinite(roundedMin) || !Number.isFinite(roundedMax) || roundedMax <= roundedMin) {
    const fallbackMin = roundPrice(Math.max(basePrice * 0.997, 0.00000001));
    const fallbackMax = roundPrice(basePrice * 1.003);
    return { min: fallbackMin, max: fallbackMax };
  }

  return { min: roundedMin, max: roundedMax };
}
