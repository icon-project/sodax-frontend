// apps/demo/src/components/mm/lists/SupplyAssetsList.tsx
import React, { type ReactElement } from 'react';
import { useReservesUsdFormat, useSpokeProvider, useUserFormattedSummary, useUserReservesData } from '@sodax/dapp-kit';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useWalletProvider, useXAccount, useXBalances } from '@sodax/wallet-sdk-react';
import { formatUnits } from 'viem';
import { SupplyAssetsListItem } from './SupplyAssetsListItem';
import { useAppStore } from '@/zustand/useAppStore';
import { ICON_MAINNET_CHAIN_ID, moneyMarketSupportedTokens } from '@sodax/sdk';

const TABLE_HEADERS = [
  'Asset',
  'Wallet Balance',
  'Supplied',
  'Liq. Threshold',
  'Total Supply',
  'Supply APY',
  'Supply APR',
  'Borrowed',
  'Available',
  'Action',
  'Action',
  'Action',
  'Action',
] as const;

export function SupplyAssetsList(): ReactElement {
  const { selectedChainId } = useAppStore();

  const tokens = moneyMarketSupportedTokens[selectedChainId];
  const isIcon = selectedChainId === ICON_MAINNET_CHAIN_ID;

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
  const { data: userSummary } = useUserFormattedSummary(spokeProvider, address);
  const healthFactor = userSummary?.healthFactor ? Number.parseFloat(userSummary.healthFactor).toFixed(2) : undefined;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Markets</CardTitle>
          <div className="text-sm text-muted-foreground">
            HF:{' '}
            <span className="font-semibold text-foreground">
              {healthFactor && Number.isFinite(Number(healthFactor)) ? healthFactor : '-'}
            </span>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {isIcon ? (
          <div className=" text-center text-cherry-dark">
            <p className="font-medium">
              Money Market is not available on ICON. ICON is supported for swap and migration only.
            </p>
          </div>
        ) : (
          <div className="rounded-lg border border-cherry-grey/20 overflow-hidden">
            <Table>
              <TableHeader className="sticky top-0 bg-cream z-20">
                <TableRow className="border-b border-cherry-grey/20">
                  {TABLE_HEADERS.map((header, index) => (
                    <TableHead key={`${header}-${index}`} className="text-cherry-dark font-bold">
                      {header}
                    </TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {isUserReservesLoading || isFormattedReservesLoading || !userReserves || !formattedReserves ? (
                  <TableRow>
                    <TableCell colSpan={16} className="text-center">
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
          </div>
        )}
      </CardContent>
    </Card>
  );
}
