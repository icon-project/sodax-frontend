import React from 'react';
import { TableCell, TableRow } from '@/components/ui/table';
import { formatUnits } from 'viem';
import type { ChainId, XToken } from '@sodax/types';
import { BorrowButton } from '../BorrowButton';
import { getChainLabel } from '@/lib/borrowUtils';
import { useReserveMetrics } from '@/hooks/useReserveMetrics';
import type { FormatReserveUSDResponse, UserReserveData } from '@sodax/sdk';

interface BorrowAssetsListItemProps {
  token: XToken;
  walletBalance: string;
  asset: {
    symbol: string;
    decimals: number;
    address: string;
    chainId: ChainId;
    vault: string;
    availableLiquidity?: string;
    borrowAPY?: string;
  };
  disabled?: boolean;
  formattedReserves: FormatReserveUSDResponse[];
  userReserves: readonly UserReserveData[];
}

export function BorrowAssetsListItem({
  token,
  walletBalance,
  asset,
  disabled = false,
  formattedReserves,
  userReserves,
}: BorrowAssetsListItemProps) {
  const metrics = useReserveMetrics({
    token,
    formattedReserves,
    userReserves: userReserves as UserReserveData[],
  });

  // Format the available liquidity
  const availableLiquidity = asset.availableLiquidity
    ? formatUnits(BigInt(asset.availableLiquidity), asset.decimals)
    : '--';

  return (
    <TableRow className={`hover:bg-cream/30 transition-colors ${disabled ? 'opacity-50' : ''}`}>
      <TableCell>
        <span className="font-medium text-cherry-dark">{asset.symbol}</span>
        <span className="text-clay-light text-xs ml-1">{getChainLabel(asset.chainId)}</span>
      </TableCell>
      <TableCell>
        <span className="font-mono text-sm text-clay">{walletBalance}</span>
      </TableCell>
      <TableCell>
        <span className="font-mono text-sm text-clay">
          {availableLiquidity === '--' ? availableLiquidity : Number.parseFloat(availableLiquidity).toFixed(2)}
        </span>
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
        <BorrowButton token={token} asset={asset} disabled={disabled} />
      </TableCell>
    </TableRow>
  );
}
