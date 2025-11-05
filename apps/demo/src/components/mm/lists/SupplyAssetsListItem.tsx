import React from 'react';
import { TableCell, TableRow } from '@/components/ui/table';
import type { XToken } from '@sodax/types';
import { SupplyButton } from './SupplyButton';
import { WithdrawButton } from './WithdrawButton';
import { BorrowButton } from './BorrowButton';
import { RepayButton } from './RepayButton';
import type { AggregatedReserveData } from '@sodax/sdk';
interface SupplyAssetsListItemProps {
  token: XToken;
  walletBalance: string;
  balance: string;
  debt: string;
  reserve: AggregatedReserveData;
}

export function SupplyAssetsListItem({ token, balance, walletBalance, debt, reserve }: SupplyAssetsListItemProps) {
  // TODO use ERC20 hook to get the aToken token info as XToken
  // this is just quickfix
  const aToken: XToken = {
    address: reserve.aTokenAddress,
    decimals: 18,
    symbol: 'aToken-${token.symbol}',
    name: 'aToken-${token.name}',
    xChainId: token.xChainId,
  };

  return (
    <TableRow>
      <TableCell>{token.symbol}</TableCell>
      <TableCell>{walletBalance}</TableCell>
      <TableCell>{balance}</TableCell>
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
