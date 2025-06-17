import React, { useMemo } from 'react';
import { allXTokens, getSpokeTokenAddressByVault, useUserReservesData } from '@sodax/dapp-kit';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useXAccount, useXBalances } from '@sodax/wallet-sdk';
import { formatUnits } from 'viem';
import { SupplyAssetsListItem } from './SupplyAssetsListItem';
import { useAppStore } from '@/zustand/useAppStore';

export function SupplyAssetsList() {
  const { selectedChainId } = useAppStore();
  const tokens = useMemo(() => allXTokens.filter(token => token.xChainId === selectedChainId), [selectedChainId]);

  const { address } = useXAccount(selectedChainId);
  const { data: balances } = useXBalances({
    xChainId: selectedChainId,
    xTokens: tokens,
    address,
  });

  const userReserves = useUserReservesData(selectedChainId);
  console.log('tokens', tokens, userReserves);
  return (
    <Card>
      <CardHeader>
        <CardTitle>Markets</CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Asset</TableHead>
              <TableHead>Wallet Balance</TableHead>
              <TableHead>Balance</TableHead>
              <TableHead>Debt</TableHead>
              <TableHead>Action</TableHead>
              <TableHead>Action</TableHead>
              <TableHead>Action</TableHead>
              <TableHead>Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {userReserves &&
              tokens.map(token => {
                try {
                  const userReserve = userReserves?.find(
                    r => getSpokeTokenAddressByVault(selectedChainId, r.underlyingAsset) === token.address,
                  );
                  return (
                    <SupplyAssetsListItem
                      key={token.address}
                      token={token}
                      walletBalance={
                        balances?.[token.address] ? formatUnits(balances?.[token.address] || 0n, token.decimals) : '-'
                      }
                      balance={userReserve ? formatUnits(userReserve?.scaledATokenBalance || 0n, 18) : '-'}
                      debt={userReserve ? formatUnits(userReserve?.scaledVariableDebt || 0n, token.decimals) : '-'}
                    />
                  );
                } catch {
                  console.log('error token', token);
                }
              })}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
