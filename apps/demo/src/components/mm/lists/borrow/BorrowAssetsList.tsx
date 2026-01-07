import React from 'react';
import { useUserReservesData, useSpokeProvider, useReservesUsdFormat } from '@sodax/dapp-kit';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useWalletProvider, useXAccount, useXBalances } from '@sodax/wallet-sdk-react';
import { useAppStore } from '@/zustand/useAppStore';
import { BorrowAssetsListItem } from './BorrowAssetsListItem';
import { AlertCircle, Loader2 } from 'lucide-react';
import { moneyMarketSupportedTokens } from '@sodax/sdk';
import { formatUnits } from 'viem';

const TABLE_HEADERS = [
  'Asset',
  'Wallet balance',
  'Available Liquidity',
  'Borrow APY',
  'Borrow APR',
  'Total Borrow',
  'Action',
];

export function BorrowAssetsList() {
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

  const { data: userReserves, isLoading: isUserReservesLoading } = useUserReservesData({ spokeProvider, address });

  const { data: formattedReserves, isLoading: isFormattedReservesLoading } = useReservesUsdFormat();

  const hasCollateral = !!userReserves?.[0]?.some(reserve => reserve.scaledATokenBalance > 0n);

  const isLoading = isUserReservesLoading || isFormattedReservesLoading;

  return (
    <Card className="mt-6">
      <CardHeader>
        <CardTitle>Assets to Borrow</CardTitle>
        <p className="text-sm text-clay font-normal mt-2">Borrow assets available on the selected chain</p>

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
                {TABLE_HEADERS.map(header => (
                  <TableHead key={header} className="text-cherry-dark font-bold">
                    {header}
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
          </Table>

          <div className="max-h-[400px] overflow-y-auto">
            <Table className="table-fixed w-full">
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-12">
                      <div className="flex items-center justify-center gap-2 text-clay">
                        <Loader2 className="w-5 h-5 animate-spin" />
                        <span>Loading borrowable assets...</span>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  tokens.map(token => {
                    const reserve = formattedReserves?.find(
                      r => r.underlyingAsset.toLowerCase() === token.address.toLowerCase(),
                    );

                    const asset = {
                      symbol: token.symbol,
                      decimals: token.decimals,
                      address: token.address,
                      chainId: token.xChainId,
                      vault: token.address,
                      availableLiquidity: reserve?.availableLiquidityUSD,
                    };

                    return (
                      <BorrowAssetsListItem
                        key={token.address}
                        token={token}
                        asset={asset}
                        disabled={!hasCollateral}
                        walletBalance={
                          balances?.[token.address]
                            ? Number(formatUnits(balances[token.address], token.decimals)).toFixed(4)
                            : '-'
                        }
                        formattedReserves={formattedReserves || []}
                        userReserves={userReserves?.[0] || []}
                      />
                    );
                  })
                )}
              </TableBody>
            </Table>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
