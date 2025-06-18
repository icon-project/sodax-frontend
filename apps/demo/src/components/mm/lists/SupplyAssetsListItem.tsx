import React from 'react';
import { TableCell, TableRow } from '@/components/ui/table';
import type { XToken } from '@sodax/types';
import { SupplyButton } from './SupplyButton';
import { WithdrawButton } from './WithdrawButton';
import { BorrowButton } from './BorrowButton';
import { RepayButton } from './RepayButton';
interface SupplyAssetsListItemProps {
  token: XToken;
  walletBalance: string;
  balance: string;
  debt: string;
}

export function SupplyAssetsListItem({ token, balance, walletBalance, debt }: SupplyAssetsListItemProps) {
  return (
    <TableRow>
      <TableCell>{token.symbol}</TableCell>
      <TableCell>{walletBalance}</TableCell>
      <TableCell>{balance}</TableCell>
      <TableCell>{debt}</TableCell>
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
