import { formatUnits } from 'viem';

import { hubAssets, type ChainId, type XToken } from '@sodax/types';
import type { AggregatedReserveData, FormatReserveUSDResponse, UserReserveData } from '@sodax/sdk';
import { formatCompactNumber } from '@/lib/utils';

/**
 * React hook that computes key financial metrics for a money market reserve.
 *
 * It derives supply/borrow APRs and APYs, total supply and borrow amounts,
 * and their USD equivalents using reserve and user data from the Sodax SDK.
 * Handles special cases like merging `bnUSD` and `bnUSDVault` reserves.
 *
 * @param {XToken} token - Target token for which metrics are computed.
 * @param {AggregatedReserveData[]} reserves - All aggregated reserve data.
 * @param {FormatReserveUSDResponse[]} formattedReserves - USD-normalized reserve data.
 * @param {UserReserveData[][]} userReserves - Nested user reserve data arrays.
 * @param {ChainId} selectedChainId - Active chain ID.
 *
 * @returns {ReserveMetricsResult} Computed reserve metrics, including APRs, APYs,
 * total supply/borrow (in tokens and USD), and user-specific reserve data.
 *
 * @example
 * const metrics = useReserveMetrics({ token, reserves, formattedReserves, userReserves, selectedChainId });
 * console.log(metrics.supplyAPY); // "4.62%"
 * console.log(metrics.totalLiquidityUSD); // "$15,482,100.23"
 */

const SECONDS_PER_YEAR = 31536000;

function getCompoundedRate(rate: number) {
  const ratePerSecond = rate / SECONDS_PER_YEAR;
  return ((1 + ratePerSecond) ** SECONDS_PER_YEAR - 1) * 100;
}

interface UseReserveMetricsProps {
  token: XToken;
  reserves: readonly AggregatedReserveData[];
  formattedReserves: FormatReserveUSDResponse[];
  userReserves: UserReserveData[][];
  selectedChainId: ChainId;
}

interface ReserveMetricsResult {
  userReserve?: UserReserveData;
  supplyAPR: string;
  borrowAPR: string;
  supplyAPY: string;
  borrowAPY: string;
  totalSupply: string;
  totalBorrow: string;
  totalLiquidityUSD: string;
  totalBorrowsUSD: string;
}

export function useReserveMetrics({
  token,
  reserves,
  formattedReserves,
  userReserves,
  selectedChainId,
}: UseReserveMetricsProps): ReserveMetricsResult {
  try {
    const vault = hubAssets[selectedChainId][token.address].vault;
    const userReserve = userReserves?.[0]?.find(r => vault.toLowerCase() === r.underlyingAsset.toLowerCase());
    const reserve = reserves?.find(r => vault.toLowerCase() === r.underlyingAsset.toLowerCase());
    const formattedReserve = formattedReserves?.find(r => vault.toLowerCase() === r.underlyingAsset.toLowerCase());
    // Default metrics
    let supplyAPR = '-';
    let borrowAPR = '-';
    let supplyAPY = '-';
    let borrowAPY = '-';
    let totalSupply = '-';
    let totalBorrow = '-';
    let totalLiquidityUSD = '-';
    let totalBorrowsUSD = '-';

    if (reserve) {
      const liquidityRate = Number(reserve.liquidityRate) / 1e27;
      const variableBorrowRate = Number(reserve.variableBorrowRate) / 1e27;

      supplyAPR = `${(liquidityRate * 100).toFixed(4)}%`;
      borrowAPR = `${(variableBorrowRate * 100).toFixed(4)}%`;
      supplyAPY = `${getCompoundedRate(liquidityRate).toFixed(4)}%`;
      borrowAPY = `${getCompoundedRate(variableBorrowRate).toFixed(4)}%`;

      // All amounts from SDK are in WAD format (1e18)
      const availableLiquidity = BigInt(reserve.availableLiquidity ?? 0n);
      const totalVariableDebt = BigInt(reserve.totalScaledVariableDebt ?? 0n);
      const total = availableLiquidity + totalVariableDebt;
      totalSupply = formatCompactNumber(Number(formatUnits(total, 18)));
      totalBorrow = formatCompactNumber(Number(formatUnits(totalVariableDebt, 18)));

      if (formattedReserve) {
        totalLiquidityUSD = `$${Number(formattedReserve.totalLiquidityUSD ?? 0).toFixed(2)}`;
        totalBorrowsUSD = `$${Number(formattedReserve.totalDebtUSD ?? 0).toFixed(2)}`;
      }
    }

    return {
      userReserve,
      supplyAPR,
      borrowAPR,
      supplyAPY,
      borrowAPY,
      totalSupply,
      totalBorrow,
      totalLiquidityUSD,
      totalBorrowsUSD,
    };
  } catch (error) {
    console.error(`Error in useReserveMetrics for ${token.symbol} (${token.address}):`, error);
    return {
      userReserve: undefined,
      supplyAPR: '-',
      borrowAPR: '-',
      supplyAPY: '-',
      borrowAPY: '-',
      totalSupply: '-',
      totalBorrow: '-',
      totalLiquidityUSD: '-',
      totalBorrowsUSD: '-',
    };
  }
}
