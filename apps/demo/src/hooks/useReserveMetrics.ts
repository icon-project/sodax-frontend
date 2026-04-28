import { useMemo } from 'react';
import { formatUnits } from 'viem';

import type { XToken } from '@sodax/types';
import type { FormatReserveUSDResponse, UserReserveData } from '@sodax/sdk';
import { formatCompactNumber } from '@/lib/utils';
import { AAVE_INDEX_PRECISION } from '@/components/mm/constants';

/**
 * React hook that computes key financial metrics for a money market reserve.
 *
 * In v2, vault and hub-asset addresses live directly on `XToken` (no more global `hubAssets` map),
 * and the SDK's `formatReservesUSD` already produces normalized supply/borrow APR/APY strings —
 * we just convert them to display percentages here.
 */

interface UseReserveMetricsProps {
  token: XToken;
  formattedReserves: FormatReserveUSDResponse[];
  userReserves: UserReserveData[];
}

export interface ReserveMetricsResult {
  /** Per-reserve user row from the hub UI pool data (supply + debt + collateral flags). */
  userReserve?: UserReserveData;
  formattedReserve?: FormatReserveUSDResponse;
  supplyAPR: string;
  borrowAPR: string;
  supplyAPY: string;
  borrowAPY: string;
  totalSupply: string;
  totalBorrow: string;
  totalLiquidityUSD: string;
  totalBorrowsUSD: string;
  supplyBalanceUSD: string;
  liquidationThreshold: string;
}

const EMPTY_METRICS: ReserveMetricsResult = {
  userReserve: undefined,
  formattedReserve: undefined,
  supplyAPR: '-',
  borrowAPR: '-',
  supplyAPY: '-',
  borrowAPY: '-',
  totalSupply: '-',
  totalBorrow: '-',
  totalLiquidityUSD: '-',
  totalBorrowsUSD: '-',
  supplyBalanceUSD: '-',
  liquidationThreshold: '-',
};

const formatRate = (value: string): string => `${(Number(value) * 100).toFixed(4)}%`;

export function useReserveMetrics({
  token,
  formattedReserves,
  userReserves,
}: UseReserveMetricsProps): ReserveMetricsResult {
  return useMemo(() => {
    const vault = token.vault;
    if (!vault) {
      return EMPTY_METRICS;
    }

    try {
      const vaultLower = vault.toLowerCase();
      const userReserve = userReserves.find(r => r.underlyingAsset.toLowerCase() === vaultLower);
      const formattedReserve = formattedReserves.find(r => r.underlyingAsset.toLowerCase() === vaultLower);

      if (!formattedReserve) {
        return { ...EMPTY_METRICS, userReserve, formattedReserve };
      }

      const totalVariableDebt = Number(formattedReserve.totalVariableDebt);
      const totalSupplyTokens =
        Number(formatUnits(BigInt(formattedReserve.availableLiquidity), 18)) + totalVariableDebt;

      const ltValue = Number(formattedReserve.formattedReserveLiquidationThreshold);
      const liquidationThreshold =
        Number.isFinite(ltValue) && ltValue > 0 ? `${(ltValue * 100).toFixed(2)}%` : '-';

      let supplyBalanceUSD = '-';
      if (userReserve) {
        // The stored supplied balance does not grow by itself; apply the current liquidity index
        // to get the real, interest-adjusted amount the user has supplied.
        const decimals = Number(formattedReserve.decimals ?? 18);
        const priceInUsd = Number(formattedReserve.priceInUSD);
        const liquidityIndex = BigInt(formattedReserve.liquidityIndex);
        const scaledBalance = BigInt(userReserve.scaledATokenBalance);
        const balanceRaw = (scaledBalance * liquidityIndex) / AAVE_INDEX_PRECISION;
        const suppliedUsd = Number(formatUnits(balanceRaw, decimals)) * priceInUsd;
        if (Number.isFinite(suppliedUsd) && suppliedUsd > 0) {
          supplyBalanceUSD = `$${suppliedUsd.toFixed(3)}`;
        }
      }

      return {
        userReserve,
        formattedReserve,
        supplyAPR: formatRate(formattedReserve.supplyAPR),
        borrowAPR: formatRate(formattedReserve.variableBorrowAPR),
        supplyAPY: formatRate(formattedReserve.supplyAPY),
        borrowAPY: formatRate(formattedReserve.variableBorrowAPY),
        totalSupply: formatCompactNumber(totalSupplyTokens),
        totalBorrow: formatCompactNumber(totalVariableDebt),
        totalLiquidityUSD: `$${Number(formattedReserve.totalLiquidityUSD ?? 0).toFixed(2)}`,
        totalBorrowsUSD: `$${Number(formattedReserve.totalDebtUSD ?? 0).toFixed(2)}`,
        supplyBalanceUSD,
        liquidationThreshold,
      };
    } catch (error) {
      console.error(`Error in useReserveMetrics for ${token.symbol} (${token.address}):`, error);
      return EMPTY_METRICS;
    }
  }, [token.address, token.symbol, token.vault, formattedReserves, userReserves]);
}
