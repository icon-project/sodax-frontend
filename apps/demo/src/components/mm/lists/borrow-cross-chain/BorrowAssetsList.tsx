import React, { useMemo } from 'react';
import { useUserReservesData, useSpokeProvider, useBackendAllMoneyMarketAssets } from '@sodax/dapp-kit';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useWalletProvider, useXAccount } from '@sodax/wallet-sdk-react';
import { useAppStore } from '@/zustand/useAppStore';
import { BorrowAssetsListItem } from './BorrowAssetsListItem';
import { AlertCircle, Loader2 } from 'lucide-react';
import { getBorrowableAssetsWithMarketData } from '@/lib/borrowUtils';

export function BorrowAssetsList() {
  const { selectedChainId } = useAppStore();

  const { address } = useXAccount(selectedChainId);
  const walletProvider = useWalletProvider(selectedChainId);
  const spokeProvider = useSpokeProvider(selectedChainId, walletProvider);

  // Fetch user reserves to check if they have collateral
  const { data: userReserves, isLoading: isUserReservesLoading } = useUserReservesData(spokeProvider, address);

  // Fetch backend money market assets
  const { data: allMoneyMarketAssets, isLoading: isAssetsLoading } = useBackendAllMoneyMarketAssets();

  // Check if user has any collateral supplied
  const hasCollateral = useMemo(() => {
    if (!userReserves?.[0]) return false;
    return userReserves[0].some(reserve => reserve.scaledATokenBalance > 0n);
  }, [userReserves]);

  // Get all borrowable assets with their market data
  const borrowableAssets = useMemo(() => {
    if (!allMoneyMarketAssets) return [];
    return getBorrowableAssetsWithMarketData(allMoneyMarketAssets);
  }, [allMoneyMarketAssets]);

  const isLoading = isUserReservesLoading || isAssetsLoading;

  return (
    <Card className="mt-6">
      <CardHeader>
        <CardTitle>Assets to Borrow</CardTitle>
        <p className="text-sm text-clay font-normal mt-2">All available assets across all chains</p>
        {!hasCollateral && !isLoading && (
          <div className="mt-4 p-3 bg-cherry-brighter/20 border border-cherry/30 rounded-lg flex items-start gap-2">
            <AlertCircle className="w-4 h-4 text-cherry-soda shrink-0 mt-0.5" />
            <p className="text-sm text-cherry-soda font-medium">Supply an asset first to enable borrowing</p>
          </div>
        )}
      </CardHeader>

      <CardContent>
        <div className="rounded-lg border border-cherry-grey/20 overflow-hidden">
          <Table className="table-fixed w-full">
            <TableHeader className="sticky top-0 bg-cream z-20">
              <TableRow className="border-b border-cherry-grey/20">
                <TableHead className="text-cherry-dark font-bold">Asset</TableHead>
                <TableHead className="text-cherry-dark font-bold">Available Liquidity</TableHead>
                <TableHead className="text-cherry-dark font-bold"> Borrow APY</TableHead>
                <TableHead className="text-cherry-dark font-bold">Action</TableHead>
              </TableRow>
            </TableHeader>
          </Table>

          <div className="max-h-[400px] overflow-y-auto">
            <Table className="table-fixed w-full">
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center py-12">
                      <div className="flex items-center justify-center gap-2 text-clay">
                        <Loader2 className="w-5 h-5 animate-spin" />
                        <span>Loading borrowable assets...</span>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  borrowableAssets.map(asset => (
                    <BorrowAssetsListItem
                      key={`${asset.chainId}-${asset.address}`}
                      asset={asset}
                      disabled={!hasCollateral}
                    />
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
