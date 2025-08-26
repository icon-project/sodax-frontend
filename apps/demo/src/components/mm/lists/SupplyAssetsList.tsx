import React, { useMemo } from 'react';
import { getSpokeTokenAddressByVault, useSpokeProvider, useUserReservesData } from '@sodax/dapp-kit';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useWalletProvider, useXAccount, useXBalances } from '@sodax/wallet-sdk';
import { formatUnits } from 'viem';
import { SupplyAssetsListItem } from './SupplyAssetsListItem';
import { useAppStore } from '@/zustand/useAppStore';
import { moneyMarketSupportedTokens } from '@sodax/sdk';
import type { Token, XToken } from '@sodax/types';

export function SupplyAssetsList() {
  const { selectedChainId } = useAppStore();

  const tokens = useMemo(
    () =>
      moneyMarketSupportedTokens[selectedChainId].map((t: Token) => {
        return {
          ...t,
          xChainId: selectedChainId,
        } satisfies XToken;
      }),
    [selectedChainId],
  );

  const { address } = useXAccount(selectedChainId);
  const walletProvider = useWalletProvider(selectedChainId);
  const spokeProvider = useSpokeProvider(selectedChainId, walletProvider);
  const { data: balances } = useXBalances({
    xChainId: selectedChainId,
    xTokens: tokens,
    address,
  });

  const { data: userReserves } = useUserReservesData(spokeProvider, address);

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
            {tokens.map(token => {
              try {
                const userReserve = userReserves?.[0]?.find(
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
                    debt={userReserve ? formatUnits(userReserve?.scaledVariableDebt || 0n, 18) : '-'}
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
