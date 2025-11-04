import React, { useMemo } from 'react';
import { useReservesData, useSpokeProvider, useUserReservesData } from '@sodax/dapp-kit';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useWalletProvider, useXAccount, useXBalances } from '@sodax/wallet-sdk-react';
import { formatUnits } from 'viem';
import { SupplyAssetsListItem } from './SupplyAssetsListItem';
import { useAppStore } from '@/zustand/useAppStore';
import { findReserveByUnderlyingAsset } from '@/lib/utils';
import { useReserveMetrics } from '@/hooks/useReserveMetrics';
import { useSupportedTokens } from '@/hooks/useSupportedTokens';
import { useFormattedReserves } from '@/hooks/useFormattedReserves';

export function SupplyAssetsList() {
  const { selectedChainId } = useAppStore();

  const tokens = useSupportedTokens(selectedChainId);

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

  const formattedReserves = useFormattedReserves();

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
              <TableHead>Action</TableHead>
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
                  // Get all metrics and user reserve data from the hook
                  const metrics = useReserveMetrics({
                    token,
                    reserves: reserves[0],
                    formattedReserves,
                    userReserves: [userReserves[0]],
                    selectedChainId,
                  });

                  // For tokens where metrics.userReserve is undefined, skip rendering
                  if (!metrics.userReserve) {
                    return null;
                  }

                  // This needs to stay exactly the same to preserve the fix
                  const reserve = findReserveByUnderlyingAsset(metrics.userReserve.underlyingAsset, reserves[0]);

                  return (
                    <SupplyAssetsListItem
                      key={token.address}
                      token={token}
                      walletBalance={
                        balances?.[token.address]
                          ? Number(formatUnits(balances?.[token.address] || 0n, token.decimals)).toFixed(4)
                          : '-'
                      }
                      balance={Number(formatUnits(metrics.userReserve.scaledATokenBalance || 0n, 18)).toFixed(4)}
                      debt={Number(formatUnits(metrics.userReserve.scaledVariableDebt || 0n, 18)).toFixed(4)}
                      reserve={reserve}
                      supplyApy={metrics.supplyAPY}
                      supplyAPR={metrics.supplyAPR}
                      borrowApy={metrics.borrowAPY}
                      borrowAPR={metrics.borrowAPR}
                      totalSupply={metrics.totalSupply}
                      totalBorrow={metrics.totalBorrow}
                      totalLiquidityUSD={metrics.totalLiquidityUSD}
                      totalBorrowsUSD={metrics.totalBorrowsUSD}
                    />
                  );
                } catch (error) {
                  console.log('Error rendering token', token, error);
                  return null;
                }
              })
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
