import React, { useMemo } from 'react';
import { useReservesData, useSpokeProvider, useUserReservesData } from '@sodax/dapp-kit';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useWalletProvider, useXAccount, useXBalances } from '@sodax/wallet-sdk-react';
import { formatUnits } from 'viem';
import { SupplyAssetsListItem } from './SupplyAssetsListItem';
import { useAppStore } from '@/zustand/useAppStore';
import { moneyMarketSupportedTokens, type UserReserveData } from '@sodax/sdk';
import type { Token, XToken } from '@sodax/types';
import { findReserveByUnderlyingAsset, findUserReserveBySpokeTokenAddress } from '@/lib/utils';

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

  const { data: userReserves, isLoading: isUserReservesLoading } = useUserReservesData(spokeProvider, address);
  const { data: reserves, isLoading: isReservesLoading } = useReservesData();

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
              <TableHead>Available</TableHead>
              <TableHead>Action</TableHead>
              <TableHead>Action</TableHead>
              <TableHead>Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isUserReservesLoading || isReservesLoading || !userReserves || !reserves ? (
              <TableRow>
                <TableCell colSpan={10} className="text-center">
                  Loading...
                </TableCell>
              </TableRow>
            ) : (
              userReserves &&
              reserves &&
              tokens.map(token => {
                try {
                  const userReserve: UserReserveData = findUserReserveBySpokeTokenAddress(
                    userReserves[0],
                    selectedChainId,
                    token,
                  );
                  return (
                    <SupplyAssetsListItem
                      key={token.address}
                      token={token}
                      walletBalance={
                        balances?.[token.address] ? formatUnits(balances?.[token.address] || 0n, token.decimals) : '-'
                      }
                      balance={formatUnits(userReserve.scaledATokenBalance || 0n, 18)}
                      debt={formatUnits(userReserve.scaledVariableDebt || 0n, 18)}
                      reserve={findReserveByUnderlyingAsset(userReserve.underlyingAsset, reserves[0])}
                    />
                  );
                } catch {
                  console.log('error token', token);
                }
              })
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
