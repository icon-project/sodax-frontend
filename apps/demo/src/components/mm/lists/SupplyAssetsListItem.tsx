import React, { useMemo } from 'react';
import { TableCell, TableRow } from '@/components/ui/table';
import type { XToken } from '@sodax/types';
import { SupplyButton } from './SupplyButton';
import { WithdrawButton } from './WithdrawButton';
import { BorrowButton } from './BorrowButton';
import { RepayButton } from './RepayButton';
import { spokeChainConfig } from '@sodax/sdk';
interface SupplyAssetsListItemProps {
  token: XToken;
  walletBalance: string;
  balance: string;
  debt: string;
}

export function SupplyAssetsListItem({ token, balance, walletBalance, debt }: SupplyAssetsListItemProps) {
  const supplyMaxAmount = useMemo(() => {
    return Number.parseFloat(walletBalance) - spokeChainConfig[token.xChainId].gasThreshold;
  }, [walletBalance, token.xChainId]);

  const withdrawMaxAmount = useMemo(() => {
    return Number.parseFloat(balance) - spokeChainConfig[token.xChainId].gasThreshold;
  }, [balance, token.xChainId]);

  return (
    <TableRow>
      <TableCell>{token.symbol}</TableCell>
      <TableCell>{walletBalance}</TableCell>
      <TableCell>{balance}</TableCell>
      <TableCell>{debt}</TableCell>
      <TableCell>
        <SupplyButton token={token} maxAmount={supplyMaxAmount.toString()} />
      </TableCell>
      <TableCell>
        <WithdrawButton token={token} maxAmount={withdrawMaxAmount.toString()} />
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
