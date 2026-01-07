import { useMemo } from 'react';
import type { XToken } from '@sodax/types';
import type { FormatReserveUSDResponse } from '@sodax/sdk';
import { hubAssets } from '@sodax/types';

export function useLiquidity(tokens: XToken[], formattedReserves?: FormatReserveUSDResponse[], isLoading?: boolean) {
  return useMemo(() => {
    if (isLoading || !formattedReserves || formattedReserves.length === 0) return { apy: '-', deposits: '-' };

    const first = tokens[0];
    if (!first) return { apy: '-', deposits: '-' };

    try {
      const vault = hubAssets[first.xChainId]?.[first.address]?.vault;
      if (!vault) return { apy: '-', deposits: '-' };

      const entry = formattedReserves.find(r => vault.toLowerCase() === r.underlyingAsset.toLowerCase());
      if (!entry) return { apy: '-', deposits: '-' };

      const SECONDS = 31536000;
      const liquidityRate = Number(entry.liquidityRate) / 1e27;
      const apy = ((1 + liquidityRate / SECONDS) ** SECONDS - 1) * 100;
      const deposits = Number(entry.totalLiquidityUSD ?? 0);

      return {
        apy: `${apy.toFixed(4)}%`,
        deposits: deposits >= 1000 ? `$${(deposits / 1000).toFixed(1)}k` : `$${deposits.toFixed(2)}`,
      };
    } catch {
      return { apy: '-', deposits: '-' };
    }
  }, [tokens, formattedReserves, isLoading]);
}
