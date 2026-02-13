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
    <TableRow>
      <TableCell className="font-bold text-cherry-dark">{token.symbol}</TableCell>
      <TableCell>{walletBalance}</TableCell>
      <TableCell>
        <div className="flex flex-col items-start">
          {formattedBalance ?? '-'}{' '}
          <span className="text-xs text-muted-foreground">{metrics.supplyBalanceUSD || '-'}</span>
        </div>
      </TableCell>
      <TableCell>{metrics.liquidationThreshold || '-'}</TableCell>
      <TableCell>
        <div className="flex flex-col items-start">
          {metrics.totalSupply || '-'}{' '}
          <span className="text-xs text-muted-foreground">{metrics.totalLiquidityUSD || '-'}</span>
        </div>
      </TableCell>
      <TableCell>{metrics.supplyAPY || '-'}</TableCell>
      <TableCell>{metrics.supplyAPR || '-'}</TableCell>
      <TableCell className="flex flex-row gap-2">
        <Button
          variant="cherry"
          size="sm"
          onClick={() => onSupplyClick(token, walletBalance ?? '0')}
          disabled={!walletBalance || walletBalance === '-' || Number.parseFloat(walletBalance) <= 0}
        >
          Supply
        </Button>{' '}
        <Button
          variant="cherry"
          size="sm"
          onClick={() => onWithdrawClick(token, formattedBalance ?? '0')}
          disabled={!hasSupply}
        >
          Withdraw
        </Button>{' '}
        {/* <OldBorrowButton token={token} /> */}
        {/* <Button
          variant="cherry"
          size="sm"
          onClick={() => onRepayClick(token, formattedDebt ?? '0')}
          disabled={!hasDebt}
        >
          Repay
        </Button>{' '} */}
      </TableCell>
    </TableRow>
  );
}
