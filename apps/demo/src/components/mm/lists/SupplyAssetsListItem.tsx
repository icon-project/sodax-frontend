import React, { type ReactElement, useMemo } from 'react';
import { TableCell, TableRow } from '@/components/ui/table';
import type { XToken, Address } from '@sodax/types';
import { formatUnits } from 'viem';
import type { FormatReserveUSDResponse, UserReserveData } from '@sodax/sdk';
import { useReserveMetrics } from '@/hooks/useReserveMetrics';
import { Button } from '@/components/ui/button';
import { DUST_THRESHOLD, ATOKEN_DECIMALS } from '../constants';
import { isUserReserveDataArray, isValidAddress } from '../typeGuards';
import { truncateToDecimals } from '@/lib/utils';

/** Portfolio snapshot from useUserFormattedSummary used for HF-aware max withdrawal. */
export type MmPortfolioSummary = {
  healthFactor: string | undefined;
  totalBorrowsUSD: string | undefined;
  totalCollateralUSD: string | undefined;
  /** Weighted-average liquidation threshold across all collateral (normalized, e.g. "0.8"). */
  currentLiquidationThreshold: string | undefined;
};

interface SupplyAssetsListItemProps {
  token: XToken;
  walletBalance: string;
  formattedReserves: FormatReserveUSDResponse[];
  userReserves: readonly UserReserveData[];
  aTokenBalancesMap?: Map<Address, bigint>;
  onRefreshReserves?: () => void;
  onWithdrawClick: (token: XToken, maxWithdraw: string, isHfLimited: boolean) => void;
  onSupplyClick: (token: XToken, maxSupply: string) => void;
  /** Hub portfolio summary for HF-aware max withdrawal calculation. */
  mmPortfolio?: MmPortfolioSummary;
}

export function SupplyAssetsListItem({
  token,
  walletBalance,
  formattedReserves,
  userReserves,
  aTokenBalancesMap,
  onWithdrawClick,
  onSupplyClick,
  mmPortfolio,
}: SupplyAssetsListItemProps): ReactElement {
  // Validate userReserves array before passing to useReserveMetrics
  if (!isUserReserveDataArray(userReserves)) {
    throw new Error('Invalid type of variable userReserves: expected UserReserveData[]');
  }

  const metrics = useReserveMetrics({
    token,
    formattedReserves,
    userReserves,
  });

  const aTokenAddress = metrics.formattedReserve?.aTokenAddress;

  // 2. GET THE RAW BIGINT FROM THE MAP
  // Validate aTokenAddress is a valid Address before using
  const aTokenBalance =
    aTokenAddress && isValidAddress(aTokenAddress) && aTokenBalancesMap
      ? aTokenBalancesMap.get(aTokenAddress)
      : undefined;

  // ALWAYS USE ATOKEN_DECIMALS (18) FOR aTOKENS
  const formattedBalance =
    aTokenBalance !== undefined ? truncateToDecimals(Number(formatUnits(aTokenBalance, ATOKEN_DECIMALS)), 5) : '-';

  /**
   * Health-factor-aware max withdrawal — Aave V3 formula.
   *
   * Reference: Aave V3 Technical Paper, Section 4.1 (Health Factor)
   * https://github.com/aave/aave-v3-core/blob/master/techpaper/Aave_V3_Technical_Paper.pdf
   *
   * HF = (totalCollateral × weightedAvgLT) / totalBorrows
   *
   * To keep HF >= 1 after withdrawing:
   *   excessCollateralUSD = totalCollateralUSD × weightedAvgLT − totalBorrowsUSD
   *   maxWithdrawUSD      = excessCollateralUSD / thisAssetLT
   *   maxWithdrawTokens   = maxWithdrawUSD / assetPriceUSD
   *   maxWithdraw         = min(aTokenBalance, maxWithdrawTokens) × safetyMargin
   *
   * Falls back to aTokenBalance × 0.99 when there are no borrows or asset is not collateral.
   */
  const maxWithdrawExact = useMemo(() => {
    if (!aTokenBalance || aTokenBalance === 0n || !aTokenAddress) return '0';
    const fullBalance = Number(formatUnits(aTokenBalance, ATOKEN_DECIMALS));

    const isCollateral = metrics.userReserve?.usageAsCollateralEnabledOnUser ?? false;
    const totalBorrowsUSD = Number(mmPortfolio?.totalBorrowsUSD ?? '0');
    const hasBorrows = Number.isFinite(totalBorrowsUSD) && totalBorrowsUSD > 0;

    if (!isCollateral || !hasBorrows || !mmPortfolio || !metrics.formattedReserve) {
      return truncateToDecimals(fullBalance * 0.99, token.decimals);
    }

    const totalCollateralUSD = Number(mmPortfolio.totalCollateralUSD ?? '0');
    const weightedAvgLT = Number(mmPortfolio.currentLiquidationThreshold ?? '0');
    const assetLT = Number(metrics.formattedReserve.formattedReserveLiquidationThreshold ?? '0');
    const assetPriceUSD = Number(metrics.formattedReserve.priceInUSD ?? '0');

    if (assetLT <= 0 || assetPriceUSD <= 0) {
      return truncateToDecimals(fullBalance * 0.99, token.decimals);
    }

    const excessCollateralUSD = totalCollateralUSD * weightedAvgLT - totalBorrowsUSD;
    if (excessCollateralUSD <= 0) return '0';

    const maxWithdrawTokens = excessCollateralUSD / assetLT / assetPriceUSD;
    const cappedMax = Math.min(fullBalance, maxWithdrawTokens);

    return truncateToDecimals(cappedMax * 0.99, token.decimals);
  }, [aTokenBalance, aTokenAddress, token.decimals, metrics.userReserve, metrics.formattedReserve, mmPortfolio]);

  const isHfLimited = useMemo(() => {
    if (!aTokenBalance || aTokenBalance === 0n) return false;
    const isCollateral = metrics.userReserve?.usageAsCollateralEnabledOnUser ?? false;
    const totalBorrowsUSD = Number(mmPortfolio?.totalBorrowsUSD ?? '0');
    return isCollateral && Number.isFinite(totalBorrowsUSD) && totalBorrowsUSD > 0;
  }, [aTokenBalance, metrics.userReserve, mmPortfolio]);

  // Check if user has meaningful supply: balance exists AND formatted amount is greater than DUST_THRESHOLD
  // This prevents enabling withdraw button for dust amounts that display as "0.00000"
  const hasSupply =
    aTokenBalance !== undefined &&
    aTokenBalance > 0n &&
    formattedBalance !== '-' &&
    Number.parseFloat(formattedBalance) > DUST_THRESHOLD;

  return (
    <TableRow className="border-b border-cherry-grey/10 hover:bg-cream/20 transition-colors">
      {/* Asset */}
      <TableCell className="px-6 py-5">
        <div className="flex items-center gap-3">
          <span className="font-bold text-cherry-dark">{token.symbol}</span>
        </div>
      </TableCell>

      {/* Wallet Balance */}
      <TableCell className="px-6 py-5">
        <span className="text-sm text-foreground">{walletBalance}</span>
      </TableCell>

      {/* Supplied */}
      <TableCell className="px-6 py-5">
        <div className="flex flex-col gap-0.5">
          <span className="text-sm font-medium text-foreground">{formattedBalance ?? '-'}</span>
          <span className="text-xs text-clay">{metrics.supplyBalanceUSD || '-'}</span>
        </div>
      </TableCell>

      {/* LT % */}
      <TableCell className="px-6 py-5">
        <span className="text-sm text-foreground">{metrics.liquidationThreshold || '-'}</span>
      </TableCell>

      {/* Total Supply */}
      <TableCell className="px-6 py-5">
        <div className="flex flex-col gap-0.5">
          <span className="text-sm font-medium text-foreground">{metrics.totalSupply || '-'}</span>
          <span className="text-xs text-clay">{metrics.totalLiquidityUSD || '-'}</span>
        </div>
      </TableCell>

      {/* Supply APY */}
      <TableCell className="px-6 py-5">
        <span className="text-sm font-medium text-cherry-dark">{metrics.supplyAPY || '-'}</span>
      </TableCell>

      {/* Supply APR */}
      <TableCell className="px-6 py-5">
        <span className="text-sm font-medium text-cherry-dark">{metrics.supplyAPR || '-'}</span>
      </TableCell>

      {/* Actions */}
      <TableCell className="px-6 py-5">
        <div className="flex items-center gap-2">
          <Button
            variant="cherry"
            size="sm"
            onClick={() => onSupplyClick(token, walletBalance ?? '0')}
            disabled={
              // Disable if wallet balance is not available ('-'), empty, zero/negative, or invalid number
              // Note: We show "0.0000" when loading, so we check for <= 0 to disable during loading too
              !walletBalance ||
              walletBalance === '-' ||
              Number.parseFloat(walletBalance) <= 0 ||
              Number.isNaN(Number.parseFloat(walletBalance))
            }
            className="flex-1 min-w-[85px]"
          >
            Supply
          </Button>
          <Button
            variant="cherry"
            size="sm"
            onClick={() => {
              onWithdrawClick(token, maxWithdrawExact, isHfLimited);
            }}
            disabled={!hasSupply}
            className="flex-1 min-w-[85px]"
          >
            Withdraw
          </Button>
        </div>
      </TableCell>
    </TableRow>
  );
}
