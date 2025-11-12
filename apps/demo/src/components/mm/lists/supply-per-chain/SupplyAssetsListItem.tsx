import React from 'react';
import { TableCell, TableRow } from '@/components/ui/table';
import type { XToken } from '@sodax/types';
import { MoneyMarketActionButton } from '../MoneyMarketActionButton';
import type { AggregatedReserveData } from '@sodax/sdk';

interface SupplyAssetsListItemProps {
  token: XToken;
  walletBalance: string;
  balance: string;
  debt: string;
  reserve: AggregatedReserveData;
}

export function SupplyAssetsListItem({ token, balance, walletBalance, debt, reserve }: SupplyAssetsListItemProps) {
  const aToken: XToken = {
    address: reserve.aTokenAddress,
    decimals: 18,
    symbol: `aToken-${token.symbol}`,
    name: `aToken-${token.name}`,
    xChainId: token.xChainId,
  };

  return (
    <TableRow className="hover:bg-cream/30 transition-colors">
      <TableCell>
        <span className="font-medium text-cherry-dark py-4">{token.symbol}</span>
      </TableCell>
      <TableCell>
        <span className="font-mono text-sm text-clay">
          {walletBalance !== '-' ? Number.parseFloat(walletBalance).toFixed(4) : '-'}
        </span>
      </TableCell>
      <TableCell>
        <span className="font-mono text-sm text-clay">{Number.parseFloat(balance).toFixed(4)}</span>
      </TableCell>
      <TableCell>
        <span className="font-mono text-sm text-clay">{Number.parseFloat(debt).toFixed(4)}</span>
      </TableCell>
      <TableCell>
        <MoneyMarketActionButton action="supply" token={token} reserve={reserve} />
      </TableCell>
      <TableCell>
        <MoneyMarketActionButton action="withdraw" token={token} aToken={aToken} reserve={reserve} />
      </TableCell>
      <TableCell>
        <MoneyMarketActionButton action="repay" token={token} reserve={reserve} />
      </TableCell>
    </TableRow>
  );
}
