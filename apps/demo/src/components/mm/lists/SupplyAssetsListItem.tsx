// apps/demo/src/components/mm/lists/SupplyAssetsListItem.tsx
import React, { type ReactElement } from 'react';
import { TableCell, TableRow } from '@/components/ui/table';
import type { XToken } from '@sodax/types';
import { SupplyButton } from './SupplyButton';
import { WithdrawButton } from './WithdrawButton';
import { BorrowButton } from './BorrowButton';
import { RepayButton } from './RepayButton';
import { formatUnits } from 'viem';
import type { FormatReserveUSDResponse, UserReserveData } from '@sodax/sdk';
import { useAToken } from '@sodax/dapp-kit';
import { Skeleton } from '@/components/ui/skeleton';
import { useReserveMetrics } from '@/hooks/useReserveMetrics';

interface SupplyAssetsListItemProps {
  token: XToken;
  walletBalance: string;
  formattedReserves: FormatReserveUSDResponse[];
  userReserves: readonly UserReserveData[];
}

export function SupplyAssetsListItem({
  token,
  walletBalance,
  formattedReserves,
  userReserves,
}: SupplyAssetsListItemProps): ReactElement {
  const metrics = useReserveMetrics({
    token,
    formattedReserves: formattedReserves,
    userReserves: userReserves as UserReserveData[],
  });
  const { data: aToken, isLoading: isATokenLoading } = useAToken(
    metrics.formattedReserve?.aTokenAddress as `0x${string}`,
  );

  const formattedBalance = metrics.userReserve
    ? Number(formatUnits(metrics.userReserve.scaledATokenBalance, 18)).toFixed(4)
    : undefined;

  const formattedDebt = metrics.userReserve
    ? Number(formatUnits(metrics.userReserve.scaledVariableDebt, 18)).toFixed(4)
    : undefined;

  if (isATokenLoading || !aToken) {
    return (
      <TableRow>
        <TableCell colSpan={16}>
          <Skeleton className="h-4 w-full" />
        </TableCell>
      </TableRow>
    );
  }

  const availableToBorrow = !metrics.formattedReserve
    ? undefined
    : metrics.formattedReserve.borrowCap === '0'
      ? formatUnits(BigInt(metrics.formattedReserve.availableLiquidity), aToken.decimals)
      : Math.min(
          Number.parseFloat(formatUnits(BigInt(metrics.formattedReserve.availableLiquidity), aToken.decimals)),
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
      <TableCell>
        <SupplyButton token={token} />
      </TableCell>
      <TableCell>
        <BorrowButton token={token} />
      </TableCell>
      <TableCell>
        <WithdrawButton token={token} />
      </TableCell>
      <TableCell>
        <RepayButton token={token} />
      </TableCell>
    </TableRow>
  );
}
