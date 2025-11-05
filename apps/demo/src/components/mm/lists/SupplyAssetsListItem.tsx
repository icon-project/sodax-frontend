import React from 'react';
import { TableCell, TableRow } from '@/components/ui/table';
import type { ChainId, XToken } from '@sodax/types';
import { SupplyButton } from './SupplyButton';
import { WithdrawButton } from './WithdrawButton';
import { BorrowButton } from './BorrowButton';
import { RepayButton } from './RepayButton';
import type { AggregatedReserveData, UserReserveData } from '@sodax/sdk';
import { useReserveMetrics } from '@/hooks/useReserveMetrics';
import { findReserveByUnderlyingAsset } from '@/lib/utils';
import { formatUnits } from 'viem';
import type { FormattedReserve } from '@/hooks/useFormattedReserves';

interface SupplyAssetsListItemProps {
  token: XToken;
  walletBalance: string;
  // Add these new props needed for the logic
  reserves: readonly AggregatedReserveData[];
  formattedReserves: FormattedReserve[];
  userReserves: readonly UserReserveData[];
  selectedChainId: ChainId;
}

export function SupplyAssetsListItem({
  token,
  walletBalance,
  reserves,
  formattedReserves,
  userReserves,
  selectedChainId,
}: SupplyAssetsListItemProps) {
  // Get all metrics and user reserve data from the hook
  const metrics = useReserveMetrics({
    token,
    reserves: reserves as AggregatedReserveData[],
    formattedReserves: formattedReserves,
    userReserves: [userReserves as UserReserveData[]] as UserReserveData[][],
    selectedChainId,
  });

  // For tokens where metrics.userReserve is undefined, skip rendering
  if (!metrics.userReserve) {
    return null;
  }

  // This needs to stay exactly the same to preserve the fix
  const reserve = findReserveByUnderlyingAsset(metrics.userReserve.underlyingAsset, reserves);

  const balance = Number(formatUnits(metrics.userReserve.scaledATokenBalance || 0n, 18)).toFixed(4);
  const debt = Number(formatUnits(metrics.userReserve.scaledVariableDebt || 0n, 18)).toFixed(4);

  // TODO use ERC20 hook to get the aToken token info as XToken
  // this is just quickfix
  const aToken: XToken = {
    address: reserve.aTokenAddress,
    decimals: 18,
    symbol: `aToken-${token.symbol}`,
    name: `aToken-${token.name}`,
    xChainId: token.xChainId,
  };

  return (
    <TableRow>
      <TableCell>{token.symbol}</TableCell>
      <TableCell>{walletBalance}</TableCell>
      <TableCell>{balance}</TableCell>
      <TableCell>
        <div className="flex flex-col items-start">
          {metrics.totalSupply || '-'} <span className="text-xs">{metrics.totalLiquidityUSD || '-'}</span>
        </div>
      </TableCell>
      <TableCell>{metrics.supplyAPY || '-'}</TableCell>
      <TableCell>{metrics.supplyAPR || '-'}</TableCell>
      <TableCell>
        <div className="flex flex-col items-start">
          {metrics.totalBorrow || '-'} <span className="text-xs">{metrics.totalBorrowsUSD || '-'}</span>
        </div>
      </TableCell>
      <TableCell>{metrics.borrowAPY || '-'}</TableCell>
      <TableCell>{metrics.borrowAPR || '-'}</TableCell>
      <TableCell>{debt}</TableCell>
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
