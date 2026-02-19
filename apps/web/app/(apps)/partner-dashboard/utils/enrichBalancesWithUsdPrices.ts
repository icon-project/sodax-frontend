import { getAssetUsdPrice } from '@/lib/getAssetUsdPrice';
import type { PartnerFeeClaimAssetBalance } from '@sodax/sdk';

export async function enrichBalancesWithUsdPrices(
  balances: Map<string, PartnerFeeClaimAssetBalance>,
): Promise<Map<string, PartnerFeeClaimAssetBalance>> {
  const symbols = Array.from(balances.values()).map(a => a.symbol);
  const uniqueSymbols = Array.from(new Set(symbols));

  const priceEntries = await Promise.all(
    uniqueSymbols.map(async symbol => {
      const { usdPrice } = await getAssetUsdPrice(symbol);
      return [symbol, usdPrice] as const;
    }),
  );

  const priceMap = new Map(priceEntries);

  return new Map(
    Array.from(balances.entries()).map(([key, asset]) => [
      key,
      {
        ...asset,
        usdPrice: priceMap.get(asset.symbol) ?? null,
      },
    ]),
  );
}
