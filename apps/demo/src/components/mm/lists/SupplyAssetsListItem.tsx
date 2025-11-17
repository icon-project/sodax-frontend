import React from 'react';
import { TableCell, TableRow } from '@/components/ui/table';
import type { XToken } from '@sodax/types';
import { SupplyButton } from './SupplyButton';
import { WithdrawButton } from './WithdrawButton';
import { BorrowButton } from './BorrowButton';
import { RepayButton } from './RepayButton';
import { formatUnits } from 'viem';
import type { AggregatedReserveData } from '@sodax/sdk';
import { useAToken } from '@sodax/dapp-kit';
import { Skeleton } from '@/components/ui/skeleton';
interface SupplyAssetsListItemProps {
  token: XToken;
  walletBalance: string;
  balance: string;
  debt: string;
  reserve: AggregatedReserveData;
}

export function SupplyAssetsListItem({ token, balance, walletBalance, debt, reserve }: SupplyAssetsListItemProps) {
  const { data: aToken, isLoading: isATokenLoading } = useAToken(reserve.aTokenAddress);

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
      <TableCell>{balance}</TableCell>
      <TableCell>{debt}</TableCell>
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
