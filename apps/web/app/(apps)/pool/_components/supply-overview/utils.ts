// apps/web/app/(apps)/pool/_components/supply-overview/utils.ts
export function getConcentrationFactor(priceLower: number, priceUpper: number, priceCurrent: number): number {
  if (priceCurrent < priceLower || priceCurrent > priceUpper) {
    return 0;
  }

  const sqrtP = Math.sqrt(priceCurrent);
  const sqrtPa = Math.sqrt(priceLower);
  const sqrtPb = Math.sqrt(priceUpper);

  const denominator = 2 * sqrtP - sqrtPa - priceCurrent / sqrtPb;
  if (denominator <= 0) {
    return 0;
  }

  return (2 * sqrtP) / denominator;
}

export function getUserAPY(fullRangeAPY: number, priceLower: number, priceUpper: number, priceCurrent: number): number {
  if (!Number.isFinite(fullRangeAPY) || fullRangeAPY < 0) {
    return 0;
  }

  const factor = getConcentrationFactor(priceLower, priceUpper, priceCurrent);
  return fullRangeAPY * factor;
}
