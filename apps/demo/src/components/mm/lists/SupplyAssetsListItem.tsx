import React from 'react';
import { TableCell, TableRow } from '@/components/ui/table';
import type { ChainId, XToken } from '@sodax/types';
import { SupplyButton } from './SupplyButton';
import { WithdrawButton } from './WithdrawButton';
import { BorrowButton } from './BorrowButton';
import { RepayButton } from './RepayButton';
import { formatUnits } from 'viem';
import type { AggregatedReserveData, FormatReserveUSDResponse, UserReserveData } from '@sodax/sdk';
import { useAToken } from '@sodax/dapp-kit';
import { Skeleton } from '@/components/ui/skeleton';
import { findReserveByUnderlyingAsset } from '@/lib/utils';
import { useReserveMetrics } from '@/hooks/useReserveMetrics';
interface SupplyAssetsListItemProps {
  token: XToken;
  walletBalance: string;
  balance: string;
  debt: string;
  reserve: AggregatedReserveData;
  formattedReserves: FormatReserveUSDResponse[];
  userReserves: readonly UserReserveData[];
  selectedChainId: ChainId;
}

export function SupplyAssetsListItem({
  token,
  walletBalance,
  balance: balanceFromProps,
  debt: debtFromProps,
  formattedReserves,
  reserve,
  userReserves,
  selectedChainId,
}: SupplyAssetsListItemProps) {
  const { data: aToken, isLoading: isATokenLoading } = useAToken(reserve.aTokenAddress);
  const metrics = useReserveMetrics({
    token,
    reserves: [reserve],
    formattedReserves: formattedReserves,
    userReserves: [userReserves as UserReserveData[]] as UserReserveData[][],
    selectedChainId,
  });

  const formattedBalance = metrics.userReserve
    ? Number(formatUnits(metrics.userReserve.scaledATokenBalance || 0n, 18)).toFixed(4)
    : balanceFromProps;

  const formattedDebt = metrics.userReserve
    ? Number(formatUnits(metrics.userReserve.scaledVariableDebt || 0n, 18)).toFixed(4)
    : debtFromProps;

  if (isATokenLoading || !aToken) {
    return (
      <TableRow>
        <TableCell colSpan={10}>
          <Skeleton className="h-4 w-full" />
        </TableCell>
        <TableCell colSpan={10}>
          <Skeleton className="h-4 w-full" />
        </TableCell>
        <TableCell colSpan={10}>
          <Skeleton className="h-4 w-full" />
        </TableCell>
        <TableCell colSpan={10}>
          <Skeleton className="h-4 w-full" />
        </TableCell>
        <TableCell colSpan={10}>
          <Skeleton className="h-4 w-full" />
        </TableCell>
        <TableCell colSpan={10}>
          <Skeleton className="h-4 w-full" />
        </TableCell>
      </TableRow>
    );
  }

  const availableToBorrow =
    reserve.borrowCap === 0n
      ? formatUnits(reserve.availableLiquidity, aToken.decimals)
      : Math.min(
          Number.parseFloat(formatUnits(reserve.availableLiquidity, aToken.decimals)),
          Number.parseInt(reserve.borrowCap.toString()) -
            Number.parseFloat(formatUnits(reserve.totalScaledVariableDebt, aToken.decimals)),
        );

  return (
    <TableRow>
      <TableCell>{token.symbol}</TableCell>
      <TableCell>{walletBalance}</TableCell>
      <TableCell>{formattedBalance}</TableCell>
      <TableCell>
        <div className="flex flex-col items-start">
          {metrics.totalSupply || '-'}{' '}
          <span className="text-xs text-muted-foreground">{metrics.totalLiquidityUSD || '-'}</span>
        </div>
      </TableCell>
      <TableCell>{metrics.supplyAPY || '-'}</TableCell>
      <TableCell>{metrics.supplyAPR || '-'}</TableCell>
      <TableCell>
        <div className="flex flex-col items-start">
          {metrics.totalBorrow || '-'}{' '}
          <span className="text-xs text-muted-foreground">{metrics.totalBorrowsUSD || '-'}</span>
        </div>
      </TableCell>
      <TableCell>{metrics.borrowAPY || '-'}</TableCell>
      <TableCell>{metrics.borrowAPR || '-'}</TableCell>
      <TableCell>{formattedDebt}</TableCell>
      <TableCell>{availableToBorrow}</TableCell>
      <TableCell>
        <SupplyButton token={token} reserve={reserve} />
      </TableCell>
      <TableCell>
        <WithdrawButton token={token} aToken={aToken} reserve={reserve} />
      </TableCell>
      <TableCell>
        <BorrowButton token={token} aToken={aToken} reserve={reserve} />
      </TableCell>
      <TableCell>
        <RepayButton token={token} reserve={reserve} />
      </TableCell>
    </TableRow>
  );
}
