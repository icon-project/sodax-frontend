import type { LiquidityApiResponse, LiquidityBucket, OhlcApiPoint, PricePoint, TickPoint } from './types';
import { sqrtPriceX96ToPrice, tickIndexToPrice } from './price-utils';

export function parseLiquidityTickPoints(payload: unknown): TickPoint[] {
  if (!payload || typeof payload !== 'object') {
    return [];
  }

  const data = payload as LiquidityApiResponse;
  if (!Array.isArray(data.buckets)) {
    return [];
  }

  const points = data.buckets
    .map((item): TickPoint | null => {
      if (!item || typeof item !== 'object') {
        return null;
      }
      const bucket = item as Partial<LiquidityBucket>;
      if (
        typeof bucket.tick_lower !== 'number' ||
        !Number.isFinite(bucket.tick_lower) ||
        typeof bucket.tick_upper !== 'number' ||
        !Number.isFinite(bucket.tick_upper)
      ) {
        return null;
      }

      const centerTick = (bucket.tick_lower + bucket.tick_upper) / 2;
      const price = tickIndexToPrice(centerTick);
      if (price === null) {
        return null;
      }

      const liquidityValue = Number(bucket.liquidity ?? '0');
      const liquidity = Number.isFinite(liquidityValue) && liquidityValue >= 0 ? liquidityValue : 0;
      return { price, liquidity };
    })
    .filter((point): point is TickPoint => point !== null)
    .sort((a, b) => a.price - b.price);

  // Merge identical price rows so the curve remains stable after rounding.
  const deduped: TickPoint[] = [];
  for (const point of points) {
    const last = deduped[deduped.length - 1];
    if (last && last.price === point.price) {
      last.liquidity += point.liquidity;
    } else {
      deduped.push({ ...point });
    }
  }
  return deduped;
}

export function parseOhlcPricePoints(payload: unknown): PricePoint[] {
  if (!Array.isArray(payload)) {
    return [];
  }

  const points = payload
    .map((item): PricePoint | null => {
      if (!item || typeof item !== 'object') {
        return null;
      }
      const ohlc = item as Partial<OhlcApiPoint>;
      const bucketTime = ohlc.bucket ? Date.parse(ohlc.bucket) : Number.NaN;
      const price = ohlc.close_sqrt ? sqrtPriceX96ToPrice(ohlc.close_sqrt) : null;
      if (!Number.isFinite(bucketTime) || price === null) {
        return null;
      }
      return { time: bucketTime, price };
    })
    .filter((point): point is PricePoint => point !== null)
    .sort((a, b) => a.time - b.time);

  if (!points.length) {
    return points;
  }

  const deduped: PricePoint[] = [];
  let lastTime: number | null = null;
  for (const point of points) {
    if (point.time !== lastTime) {
      deduped.push(point);
      lastTime = point.time;
    } else {
      deduped[deduped.length - 1] = point;
    }
  }
  return deduped;
}
