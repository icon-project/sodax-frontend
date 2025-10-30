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
  supplyApy: string;
  supplyAPR: string;
  totalSupply: string;
  totalBorrow: string;
  borrowApy: string;
  borrowAPR: string;
  totalLiquidityUSD: string;
  totalBorrowsUSD: string;
}

export function SupplyAssetsListItem({
  token,
  balance,
  walletBalance,
  debt,
  supplyApy,
  supplyAPR,
  totalSupply,
  totalBorrow,
  borrowApy,
  borrowAPR,
  totalLiquidityUSD,
  totalBorrowsUSD,
}: SupplyAssetsListItemProps) {
  return (
    <TableRow>
      <TableCell>{token.symbol}</TableCell>
      <TableCell>{walletBalance}</TableCell>
      <TableCell>{balance}</TableCell>
      <TableCell>
        <div className="flex flex-col items-start">
          {totalSupply} <span className="text-xs"> {totalLiquidityUSD}</span>
        </div>
      </TableCell>
      <TableCell>{supplyApy}</TableCell>
      <TableCell>{supplyAPR}</TableCell>
      <TableCell>
        <div className="flex flex-col items-start">
          {totalBorrow}
          <span className="text-xs"> {totalBorrowsUSD}</span>
        </div>
      </TableCell>
      <TableCell>{borrowApy}</TableCell>
      <TableCell>{borrowAPR}</TableCell>
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
