import React, { useMemo } from 'react';
import { allXTokens } from '@sodax/dapp-kit';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { getXChainType, useXAccount, useXBalances } from '@sodax/xwagmi';
import { formatUnits } from 'viem';
import { SupplyAssetsListItem } from './SupplyAssetsListItem';
import { useAppStore } from '@/zustand/useAppStore';

export function SupplyAssetsList() {
  const { selectedChain } = useAppStore();
  const tokens = useMemo(() => allXTokens.filter(token => token.xChainId === selectedChain), [selectedChain]);

  const { address } = useXAccount(getXChainType(selectedChain));
  const { data: balances } = useXBalances({
    xChainId: selectedChain,
    xTokens: tokens,
    address,
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle>Assets to supply</CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Asset</TableHead>
              <TableHead>Balance</TableHead>
              {/* <TableHead>APY</TableHead> */}
              <TableHead>Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {tokens.map(token => (
              <SupplyAssetsListItem
                key={token.address}
                token={token}
                balance={formatUnits(balances?.[token.address] || 0n, token.decimals)}
                apy={2}
              />
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
