import React, { type ReactElement } from 'react';
import { TableCell, TableRow } from '@/components/ui/table';
import type { XToken, Address } from '@sodax/types';
import { SupplyButton } from './SupplyButton';
import { WithdrawButton } from './WithdrawButton';
import { RepayButton } from './RepayButton';
import { formatUnits, isAddress } from 'viem';
import type { FormatReserveUSDResponse, UserReserveData } from '@sodax/sdk';
import { useReserveMetrics } from '@/hooks/useReserveMetrics';
import { OldBorrowButton } from './OldBorrowButton';

interface SupplyAssetsListItemProps {
  token: XToken;
  walletBalance: string;
  formattedReserves: FormatReserveUSDResponse[];
  userReserves: readonly UserReserveData[];
  aTokenBalancesMap?: Map<Address, bigint>;
  onRefreshReserves?: () => void;
}

export function SupplyAssetsListItem({
  token,
  walletBalance,
  formattedReserves,
  userReserves,
  aTokenBalancesMap,
  onRefreshReserves,
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

  // OPTIONAL: FORMAT WALLET BALANCE (uses token's native decimals)
  const formattedWallet = walletBalance ? Number(walletBalance).toFixed(4) : '-';

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
        <SupplyButton token={token} />
        <WithdrawButton token={token} onSuccess={onRefreshReserves} />
        <OldBorrowButton token={token} />
        <RepayButton token={token} />
      </TableCell>
    </TableRow>
  );
}
