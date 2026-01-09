// apps/demo/src/components/mm/lists/SupplyAssetsListItem.tsx
import React, { type ReactElement } from 'react';
import { TableCell, TableRow } from '@/components/ui/table';
import type { XToken, Address } from '@sodax/types';
import { SupplyButton } from './SupplyButton';
import { WithdrawButton } from './WithdrawButton';
import { BorrowButton } from './BorrowButton';
import { RepayButton } from './RepayButton';
import { formatUnits, isAddress } from 'viem';
import type { FormatReserveUSDResponse, UserReserveData } from '@sodax/sdk';
import { useReserveMetrics } from '@/hooks/useReserveMetrics';

interface SupplyAssetsListItemProps {
  token: XToken;
  walletBalance: string;
  formattedReserves: FormatReserveUSDResponse[];
  userReserves: readonly UserReserveData[];
  aTokenBalancesMap?: Map<Address, bigint>;
}

export function SupplyAssetsListItem({
  token,
  walletBalance,
  formattedReserves,
  userReserves,
  aTokenBalancesMap,
}: SupplyAssetsListItemProps): ReactElement {
  const metrics = useReserveMetrics({
    token,
    formattedReserves: formattedReserves,
    userReserves: userReserves as UserReserveData[],
  });

  // Get aToken balance from the pre-fetched map
  const aTokenAddress = metrics.formattedReserve?.aTokenAddress;
  const aTokenBalance =
    aTokenAddress && isAddress(aTokenAddress) && aTokenBalancesMap
      ? aTokenBalancesMap.get(aTokenAddress as Address)
      : undefined;

  const formattedBalance = aTokenBalance !== undefined ? Number(formatUnits(aTokenBalance, 18)).toFixed(4) : undefined;

  const formattedDebt = metrics.userReserve
    ? Number(formatUnits(metrics.userReserve.scaledVariableDebt, 18)).toFixed(4)
    : undefined;

  const availableToBorrow = !metrics.formattedReserve
    ? undefined
    : metrics.formattedReserve.borrowCap === '0'
      ? formatUnits(BigInt(metrics.formattedReserve.availableLiquidity), 18)
      : Math.min(
          Number.parseFloat(formatUnits(BigInt(metrics.formattedReserve.availableLiquidity), 18)),
          Number.parseInt(metrics.formattedReserve.borrowCap) -
            Number.parseFloat(metrics.formattedReserve.totalScaledVariableDebt),
        );

  return (
    <TableRow>
      <TableCell>{token.symbol}</TableCell>
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
        <SupplyButton token={token} />
      </TableCell>
      <TableCell>
        <WithdrawButton token={token} />
      </TableCell>
      <TableCell>
        <BorrowButton token={token} />
      </TableCell>
      <TableCell>
        <RepayButton token={token} />
      </TableCell>
    </TableRow>
  );
}
