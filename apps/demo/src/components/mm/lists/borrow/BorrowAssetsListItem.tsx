import React from 'react';
import { TableCell, TableRow } from '@/components/ui/table';
import { formatUnits } from 'viem';
import type { ChainId, XToken } from '@sodax/types';
import { BorrowButton } from '../BorrowButton';
import { getChainLabel } from '@/lib/borrowUtils';

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
}

export function BorrowAssetsListItem({ token, walletBalance, asset, disabled = false }: BorrowAssetsListItemProps) {
  // Format the available liquidity
  const availableLiquidity = asset.availableLiquidity
    ? formatUnits(BigInt(asset.availableLiquidity), asset.decimals)
    : '--';

  // Format the APY (ray format to percentage)
  const borrowAPYPercent = asset.borrowAPY ? (Number(asset.borrowAPY) / 1e25).toFixed(4) : '--';

  return (
    <TableRow className={`hover:bg-cream/30 transition-colors ${disabled ? 'opacity-50' : ''}`}>
      <TableCell>
        <span className="font-medium text-cherry-dark">{asset.symbol}</span>
        <span className="text-clay-light text-xs ml-1">{getChainLabel(asset.chainId)}</span>
      </TableCell>
      <TableCell>{walletBalance}</TableCell>
      <TableCell>
        <span className="font-mono text-sm text-clay">
          {availableLiquidity === '--' ? availableLiquidity : Number.parseFloat(availableLiquidity).toFixed(2)}
        </span>
      </TableCell>
      <TableCell>
        <span className="font-mono text-sm text-clay">{borrowAPYPercent}%</span>
      </TableCell>
      <TableCell>
        <BorrowButton token={token} asset={asset} disabled={disabled} />
      </TableCell>
    </TableRow>
  );
}
