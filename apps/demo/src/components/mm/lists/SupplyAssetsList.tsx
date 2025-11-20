import React from 'react';
import { useSpokeProvider, useUserReservesData } from '@sodax/dapp-kit';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useWalletProvider, useXAccount, useXBalances } from '@sodax/wallet-sdk-react';
import { formatUnits } from 'viem';
import { SupplyAssetsListItem } from './SupplyAssetsListItem';
import { useAppStore } from '@/zustand/useAppStore';
import { moneyMarketSupportedTokens } from '@sodax/sdk';
import { useReservesUsdFormat } from '@sodax/dapp-kit';

export function SupplyAssetsList() {
  const { selectedChainId } = useAppStore();

  const tokens = moneyMarketSupportedTokens[selectedChainId];

  const { address } = useXAccount(selectedChainId);
  const walletProvider = useWalletProvider(selectedChainId);
  const spokeProvider = useSpokeProvider(selectedChainId, walletProvider);
  const { data: balances } = useXBalances({
    xChainId: selectedChainId,
    xTokens: tokens,
    address,
  });

  const { data: userReserves, isLoading: isUserReservesLoading } = useUserReservesData(spokeProvider, address);
  const { data: formattedReserves, isLoading: isFormattedReservesLoading } = useReservesUsdFormat();

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
              <TableHead>Total Supply</TableHead>
              <TableHead>Supply APY</TableHead>
              <TableHead>Supply APR</TableHead>
              <TableHead>Total Borrow</TableHead>
              <TableHead>Borrow APY</TableHead>
              <TableHead>Borrow APR</TableHead>
              <TableHead>Debt</TableHead>
              <TableHead>Available</TableHead>
              <TableHead>Action</TableHead>
              <TableHead>Action</TableHead>
              <TableHead>Action</TableHead>
              <TableHead>Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isUserReservesLoading || isFormattedReservesLoading || !userReserves || !formattedReserves ? (
              <TableRow>
                <TableCell colSpan={10} className="text-center">
                  Loading...
                </TableCell>
              </TableRow>
            ) : (
              userReserves &&
              tokens.map(token => (
                <SupplyAssetsListItem
                  key={token.address}
                  token={token}
                  walletBalance={
                    balances?.[token.address]
                      ? Number(formatUnits(balances?.[token.address] || 0n, token.decimals)).toFixed(4)
                      : '-'
                  }
                  formattedReserves={formattedReserves}
                  userReserves={userReserves[0]}
                />
              ))
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
