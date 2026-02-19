import React, { type ReactElement, useMemo } from 'react';
import { TableCell, TableRow } from '@/components/ui/table';
import type { XToken, Address } from '@sodax/types';
import { formatUnits, parseUnits, isAddress } from 'viem';
import type { FormatReserveUSDResponse, UserReserveData } from '@sodax/sdk';
import { useReserveMetrics } from '@/hooks/useReserveMetrics';
// import { OldBorrowButton } from './OldBorrowButton';
import { Button } from '@/components/ui/button';
import { DUST_THRESHOLD, ATOKEN_DECIMALS } from '../constants';
import { isUserReserveDataArray, isValidAddress } from '../typeGuards';

interface SupplyAssetsListItemProps {
  token: XToken;
  walletBalance: string;
  formattedReserves: FormatReserveUSDResponse[];
  userReserves: readonly UserReserveData[];
  aTokenBalancesMap?: Map<Address, bigint>;
  onRefreshReserves?: () => void;
  onWithdrawClick: (token: XToken, maxWithdraw: string) => void;
  onSupplyClick: (token: XToken, maxSupply: string) => void;
}

export function SupplyAssetsListItem({
  token,
  walletBalance,
  formattedReserves,
  userReserves,
  aTokenBalancesMap,
  onWithdrawClick,
  onSupplyClick,
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
    aTokenBalance !== undefined ? Number(formatUnits(aTokenBalance, ATOKEN_DECIMALS)).toFixed(5) : '-';

  // Simple approach: use formattedBalance (rounded display value) - this was working before
  const maxWithdrawExact = useMemo(() => {
    if (!aTokenBalance || aTokenBalance === 0n || !aTokenAddress) return '0';
    return formattedBalance !== '-' ? formattedBalance : '0';
  }, [aTokenBalance, aTokenAddress, formattedBalance]);

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
              // Use the exact calculated max withdraw instead of rounded formattedBalance
              const maxWithdrawValue = maxWithdrawExact;
              onWithdrawClick(token, maxWithdrawValue);
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
