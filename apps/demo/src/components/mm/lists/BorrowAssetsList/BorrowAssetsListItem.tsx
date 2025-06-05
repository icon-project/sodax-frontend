import React from 'react';
import { TableCell, TableRow } from '@/components/ui/table';
import type { XToken } from '@new-world/xwagmi';
import { BorrowButton } from './BorrowButton';

interface BorrowAssetsListItemProps {
  available: string;
  apy: number;
  token?: XToken;
}

export function BorrowAssetsListItem({ token, available, apy }: BorrowAssetsListItemProps) {
  if (!token) {
    return null;
  }

  return (
    <TableRow>
      <TableCell>{token.symbol}</TableCell>
      <TableCell>{available}</TableCell>
      <TableCell>{apy}</TableCell>
      <TableCell>
        <BorrowButton token={token} />
      </TableCell>
    </TableRow>
  );
}
