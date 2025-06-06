import React from 'react';
import { TableCell, TableRow } from '@/components/ui/table';
import type { XToken } from '@sodax/xwagmi';
import { SupplyButton } from './SupplyButton';

interface SupplyAssetsListItemProps {
  balance: string;
  apy: number;
  token: XToken;
}

export function SupplyAssetsListItem({ token, balance, apy }: SupplyAssetsListItemProps) {
  return (
    <TableRow>
      <TableCell>{token.symbol}</TableCell>
      <TableCell>{balance}</TableCell>
      {/* <TableCell>hello%</TableCell> */}
      <TableCell>
        <SupplyButton token={token} />
      </TableCell>
    </TableRow>
  );
}
