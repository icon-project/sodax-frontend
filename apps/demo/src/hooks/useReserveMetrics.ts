import { formatUnits } from 'viem';

import { hubAssets, type XToken } from '@sodax/types';
import type { FormatReserveUSDResponse, UserReserveData } from '@sodax/sdk';
import { formatCompactNumber } from '@/lib/utils';

/**
 * React hook that computes key financial metrics for a money market reserve.
 *
 * It derives supply/borrow APRs and APYs, total supply and borrow amounts,
 * and their USD equivalents using reserve and user data from the Sodax SDK.
 * Handles special cases like merging `bnUSD` and `bnUSDVault` reserves.
 *
 * @param {XToken} token - Target token for which metrics are computed.
 * @param {FormatReserveUSDResponse[]} formattedReserves - USD-normalized reserve data.
 * @param {UserReserveData[][]} userReserves - Nested user reserve data arrays.
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
  formattedReserves: FormatReserveUSDResponse[];
  userReserves: UserReserveData[];
}

interface ReserveMetricsResult {
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

export function useReserveMetrics({
  token,
  formattedReserves,
  userReserves,
}: UseReserveMetricsProps): ReserveMetricsResult {
  try {
    const chainAssets = hubAssets[token.xChainId];
    const hubAsset = chainAssets?.[token.address];

    // This token does NOT exist on this chain’s hub
    // (normal in cross-chain borrow lists)
    if (!hubAsset) {
      return {
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
    }

    const vault = hubAsset.vault;
    const userReserve = userReserves.find(r => vault.toLowerCase() === r.underlyingAsset.toLowerCase());
    const formattedReserve = formattedReserves.find(r => vault.toLowerCase() === r.underlyingAsset.toLowerCase());
    // Default metrics
    let supplyAPR = '-';
    let borrowAPR = '-';
    let supplyAPY = '-';
    let borrowAPY = '-';
    let totalSupply = '-';
    let totalBorrow = '-';
    let totalLiquidityUSD = '-';
    let totalBorrowsUSD = '-';
    let supplyBalanceUSD = '-';
    let liquidationThreshold = '-';

    if (formattedReserve) {
      const liquidityRate = Number(formattedReserve.liquidityRate) / 1e27;
      const variableBorrowRate = Number(formattedReserve.variableBorrowRate) / 1e27;

      supplyAPR = `${(liquidityRate * 100).toFixed(4)}%`;
      borrowAPR = `${(variableBorrowRate * 100).toFixed(4)}%`;
      supplyAPY = `${getCompoundedRate(liquidityRate).toFixed(4)}%`;
      borrowAPY = `${getCompoundedRate(variableBorrowRate).toFixed(4)}%`;

      const availableLiquidity = Number(formatUnits(BigInt(formattedReserve.availableLiquidity), 18));
      const totalVariableDebt = Number(formattedReserve.totalScaledVariableDebt);
      const total = availableLiquidity + totalVariableDebt;
      totalSupply = formatCompactNumber(Number(total));
      totalBorrow = formatCompactNumber(Number(totalVariableDebt));

      if (formattedReserve) {
        totalLiquidityUSD = `$${Number(formattedReserve.totalLiquidityUSD ?? 0).toFixed(2)}`;
        totalBorrowsUSD = `$${Number(formattedReserve.totalDebtUSD ?? 0).toFixed(2)}`;
      }

      const ltValue = Number(formattedReserve.formattedReserveLiquidationThreshold);
      if (Number.isFinite(ltValue) && ltValue > 0) {
        liquidationThreshold = `${(ltValue * 100).toFixed(2)}%`;
      }

      if (userReserve) {
        const decimals = Number(formattedReserve.decimals ?? 18);
        const priceInUsd = Number(formattedReserve.priceInUSD);
        // The stored supplied balance does not grow by itself.
        // We apply the current liquidity index to get the real,interest-adjusted amount the user has supplied.
        const liquidityIndex = BigInt(formattedReserve.liquidityIndex);
        const scaledBalance = BigInt(userReserve.scaledATokenBalance);
        const balanceRaw = (scaledBalance * liquidityIndex) / BigInt(1e27);
        const suppliedTokens = Number(formatUnits(balanceRaw, decimals));
        const suppliedUsd = suppliedTokens * priceInUsd;
        if (Number.isFinite(suppliedUsd) && suppliedUsd > 0) {
          supplyBalanceUSD = `$${suppliedUsd.toFixed(3)}`;
        }
      }
    }

    return {
      userReserve,
      formattedReserve,
      supplyAPR,
      borrowAPR,
      supplyAPY,
      borrowAPY,
      totalSupply,
      totalBorrow,
      totalLiquidityUSD,
      totalBorrowsUSD,
      supplyBalanceUSD,
      liquidationThreshold,
    };
  } catch (error) {
    console.error(`Error in useReserveMetrics for ${token.symbol} (${token.address}):`, error);
    return {
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
  }
}
