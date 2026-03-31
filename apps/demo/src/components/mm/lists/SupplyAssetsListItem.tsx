import React, { type ReactElement, useMemo } from 'react';
import { TableCell, TableRow } from '@/components/ui/table';
import type { XToken, Address } from '@sodax/types';
import { formatUnits } from 'viem';
import type { FormatReserveUSDResponse, UserReserveData } from '@sodax/sdk';
import { useReserveMetrics } from '@/hooks/useReserveMetrics';
// import { OldBorrowButton } from './OldBorrowButton';
import { Button } from '@/components/ui/button';
import { DUST_THRESHOLD, ATOKEN_DECIMALS } from '../constants';
import { isUserReserveDataArray, isValidAddress } from '../typeGuards';
import { truncateToDecimals } from '@/lib/utils';

/** Shallow portfolio snapshot from useUserFormattedSummary. */
export type MmPortfolioWithdrawDebug = {
  healthFactor: string | undefined;
  totalBorrowsUSD: string | undefined;
  totalCollateralUSD: string | undefined;
};

interface SupplyAssetsListItemProps {
  token: XToken;
  walletBalance: string;
  formattedReserves: FormatReserveUSDResponse[];
  userReserves: readonly UserReserveData[];
  aTokenBalancesMap?: Map<Address, bigint>;
  onRefreshReserves?: () => void;
  onWithdrawClick: (token: XToken, maxWithdraw: string, isCollateralEnabled: boolean) => void;
  onSupplyClick: (token: XToken, maxSupply: string) => void;
  /** Optional hub portfolio summary for dev logs (does not change Max math yet). */
  mmPortfolioDebug?: MmPortfolioWithdrawDebug;
}

export function SupplyAssetsListItem({
  token,
  walletBalance,
  formattedReserves,
  userReserves,
  aTokenBalancesMap,
  onWithdrawClick,
  onSupplyClick,
  mmPortfolioDebug,
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
   * "Max" withdraw string shown in the modal — NOT the same as Aave / hub "max withdrawable".
   *
   * - This value is ~99% of the user's **hub aToken balance** (see MAX_WITHDRAW_SAFETY_MARGIN in constants),
   *   using float math only to match the existing UI; it ignores debt, health factor, and collateral locking.
   * - The **protocol** caps withdrawals when removing supply would drop health factor below 1 or violate reserve rules,
   *   even if pool TVL is large. So simulation can revert with `External call failed` while UI Max &lt; aToken balance.
   * - A correct *protocol* max would need pool reads or simulation (e.g. getUserAccountData / HF-aware calc) — future work.
   */
  const maxWithdrawExact = useMemo(() => {
    if (!aTokenBalance || aTokenBalance === 0n || !aTokenAddress) return '0';
    const fullBalance = Number(formatUnits(aTokenBalance, ATOKEN_DECIMALS));
    return truncateToDecimals(fullBalance * 0.99, token.decimals);
  }, [aTokenBalance, aTokenAddress, token.decimals]);

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
              onWithdrawClick(token, maxWithdrawExact, metrics.userReserve?.usageAsCollateralEnabledOnUser ?? false);
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
