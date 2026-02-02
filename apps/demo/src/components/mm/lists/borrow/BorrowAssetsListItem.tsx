import React from 'react';
import { TableCell, TableRow } from '@/components/ui/table';
import { formatUnits } from 'viem';
import type { ChainId, XToken } from '@sodax/types';
import { BorrowButton } from '../BorrowButton';
import { getChainLabel } from '@/lib/borrowUtils';
import { useReserveMetrics } from '@/hooks/useReserveMetrics';
import type { FormatReserveUSDResponse, UserReserveData } from '@sodax/sdk';
import { useAToken } from '@sodax/dapp-kit';

interface BorrowAssetsListItemProps {
  token: XToken;
  walletBalance: string;
  asset: {
    symbol: string;
    decimals: number;
    address: string;
    chainId: ChainId;
    vault: string;
  };
  disabled?: boolean;
  formattedReserves: FormatReserveUSDResponse[];
  userReserves: readonly UserReserveData[];
  onBorrowClick: (token: XToken) => void;
}

export function BorrowAssetsListItem({
  token,
  walletBalance,
  asset,
  disabled = false,
  formattedReserves,
  userReserves,
  onBorrowClick,
}: BorrowAssetsListItemProps) {
  const metrics = useReserveMetrics({
    token,
    formattedReserves,
    userReserves: userReserves as UserReserveData[],
  });

  const ZERO_ADDRESS = '0x0000000000000000000000000000000000000000';

  const aTokenAddress =
    metrics.formattedReserve?.aTokenAddress && metrics.formattedReserve.aTokenAddress !== ZERO_ADDRESS
      ? (metrics.formattedReserve.aTokenAddress as `0x${string}`)
      : undefined;

  const { data: aToken } = useAToken({
    aToken: aTokenAddress ?? ZERO_ADDRESS,
    queryOptions: {
      queryKey: ['aToken', aTokenAddress],
      enabled: !!aTokenAddress,
    },
  });

  let availableLiquidity: string | undefined;

  if (metrics.formattedReserve && aToken) {
    availableLiquidity =
      metrics.formattedReserve.borrowCap === '0'
        ? formatUnits(BigInt(metrics.formattedReserve.availableLiquidity), aToken.decimals)
        : Math.min(
            Number.parseFloat(formatUnits(BigInt(metrics.formattedReserve.availableLiquidity), aToken.decimals)),
            Number.parseInt(metrics.formattedReserve.borrowCap) -
              Number.parseFloat(metrics.formattedReserve.totalScaledVariableDebt),
          ).toFixed(6);
  }

  return (
    <TableRow className={`hover:bg-cream/30 transition-colors ${disabled ? 'opacity-50' : ''}`}>
      <TableCell>
        <span className="font-medium text-cherry-dark">{asset.symbol}</span>
        <span className="text-clay-light text-xs ml-1">{getChainLabel(token.xChainId)}</span>
      </TableCell>
      <TableCell>
        <span className="font-mono text-sm text-clay">{walletBalance}</span>
      </TableCell>
      <TableCell>
        <span className="font-mono text-sm text-clay">{availableLiquidity ?? '--'}</span>
      </TableCell>
      <TableCell>
        <span className="font-mono text-sm text-clay">{metrics.borrowAPY}</span>
      </TableCell>
      <TableCell>
        <span className="font-mono text-sm text-clay">{metrics.borrowAPR}</span>
      </TableCell>
      <TableCell>
        <span className="font-mono text-sm text-clay">{metrics.totalBorrow}</span>
      </TableCell>
      <TableCell>
        <BorrowButton
          token={token}
          disabled={disabled}
          onClick={clickedToken => {
            onBorrowClick(clickedToken);
          }}
        />
      </TableCell>
    </TableRow>
  );
}
