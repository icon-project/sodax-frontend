import React, { type ReactElement } from 'react';
import { TableCell, TableRow } from '@/components/ui/table';
import type { XToken, Address } from '@sodax/types';
import { formatUnits, isAddress } from 'viem';
import type { FormatReserveUSDResponse, UserReserveData } from '@sodax/sdk';
import { useReserveMetrics } from '@/hooks/useReserveMetrics';
import { OldBorrowButton } from './OldBorrowButton';
import { Button } from '@/components/ui/button';

interface SupplyAssetsListItemProps {
  token: XToken;
  walletBalance: string;
  formattedReserves: FormatReserveUSDResponse[];
  userReserves: readonly UserReserveData[];
  aTokenBalancesMap?: Map<Address, bigint>;
  onRefreshReserves?: () => void;
  onRepayClick: (token: XToken, maxDebt: string) => void;
  onWithdrawClick: (token: XToken, maxWithdraw: string) => void;
  onSupplyClick: (token: XToken, maxSupply: string) => void;
}

export function SupplyAssetsListItem({
  token,
  walletBalance,
  formattedReserves,
  userReserves,
  aTokenBalancesMap,
  onRefreshReserves,
  onRepayClick,
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

  const formattedDebt = metrics.userReserve
    ? Number(formatUnits(metrics.userReserve.scaledVariableDebt, 18)).toFixed(4)
    : undefined;

  const hasDebt = metrics.userReserve && metrics.userReserve.scaledVariableDebt > 0n;
  const hasSupply = aTokenBalance !== undefined && aTokenBalance > 0n;

  const availableToBorrow = !metrics.formattedReserve
    ? undefined
    : metrics.formattedReserve.borrowCap === '0'
      ? formatUnits(BigInt(metrics.formattedReserve.availableLiquidity), 18)
      : Math.min(
          Number.parseFloat(formatUnits(BigInt(metrics.formattedReserve.availableLiquidity), 18)),
          Number.parseInt(metrics.formattedReserve.borrowCap) -
            Number.parseFloat(metrics.formattedReserve.totalScaledVariableDebt),
        ).toFixed(6);

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
      <TableCell>{formattedDebt}</TableCell>
      <TableCell>{availableToBorrow}</TableCell>
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
        <OldBorrowButton token={token} />
        <Button
          variant="cherry"
          size="sm"
          onClick={() => onRepayClick(token, formattedDebt ?? '0')}
          disabled={!hasDebt}
        >
          Repay
        </Button>{' '}
      </TableCell>
    </TableRow>
  );
}
