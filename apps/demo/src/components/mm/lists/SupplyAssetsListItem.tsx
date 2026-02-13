import React, { type ReactElement } from 'react';
import { TableCell, TableRow } from '@/components/ui/table';
import type { XToken, Address } from '@sodax/types';
import { formatUnits, isAddress } from 'viem';
import type { FormatReserveUSDResponse, UserReserveData } from '@sodax/sdk';
import { useReserveMetrics } from '@/hooks/useReserveMetrics';
// import { OldBorrowButton } from './OldBorrowButton';
import { Button } from '@/components/ui/button';

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
  const metrics = useReserveMetrics({
    token,
    formattedReserves,
    userReserves: userReserves as UserReserveData[],
  });

  const aTokenAddress = metrics.formattedReserve?.aTokenAddress;

  // 2. GET THE RAW BIGINT FROM THE MAP
  const aTokenBalance =
    aTokenAddress && isAddress(aTokenAddress) && aTokenBalancesMap
      ? aTokenBalancesMap.get(aTokenAddress as Address)
      : undefined;

  // ALWAYS USE 18 DECIMALS FOR aTOKENS
  const formattedBalance = aTokenBalance !== undefined ? Number(formatUnits(aTokenBalance, 18)).toFixed(5) : '-';

  const hasSupply = aTokenBalance !== undefined && aTokenBalance > 0n;

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
            disabled={!walletBalance || walletBalance === '-' || Number.parseFloat(walletBalance) <= 0}
            className="flex-1 min-w-[85px]"
          >
            Supply
          </Button>
          <Button
            variant="cherry"
            size="sm"
            onClick={() => onWithdrawClick(token, formattedBalance ?? '0')}
            disabled={!hasSupply}
            className="flex-1 min-w-[85px]"
          >
            Withdraw
          </Button>
          {/* <OldBorrowButton token={token} /> */}
          {/* <Button
          variant="cherry"
          size="sm"
          onClick={() => onRepayClick(token, formattedDebt ?? '0')}
          disabled={!hasDebt}
        >
          Repay
        </Button>{' '} */}
        </div>
      </TableCell>
    </TableRow>
  );
}
