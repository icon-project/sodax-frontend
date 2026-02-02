import React, { useMemo, type ReactElement } from 'react';
import {
  useReservesUsdFormat,
  useSpokeProvider,
  useUserFormattedSummary,
  useUserReservesData,
  useATokensBalances,
} from '@sodax/dapp-kit';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useWalletProvider, useXAccount, useXBalances } from '@sodax/wallet-sdk-react';
import { formatUnits, isAddress } from 'viem';
import { SupplyAssetsListItem } from './SupplyAssetsListItem';
import { useAppStore } from '@/zustand/useAppStore';
import { ICON_MAINNET_CHAIN_ID, moneyMarketSupportedTokens } from '@sodax/sdk';
import { Tooltip, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip';
import { Info } from 'lucide-react';

const TABLE_HEADERS = [
  'Asset',
  'Wallet Balance',
  'Supplied',
  'LT %',
  'Total Supply',
  'Supply APY',
  'Supply APR',
  'Borrowed',
  'Available',
  '',
  '',
  '',
] as const;

export function SupplyAssetsList(): ReactElement {
  const { selectedChainId } = useAppStore();

  const tokens = moneyMarketSupportedTokens[selectedChainId];
  const isIcon = selectedChainId === ICON_MAINNET_CHAIN_ID;

  const { address } = useXAccount(selectedChainId);
  const walletProvider = useWalletProvider(selectedChainId);
  const spokeProvider = useSpokeProvider(selectedChainId, walletProvider);
  const { data: balances, refetch: refetchWalletBalances } = useXBalances({
    xChainId: selectedChainId,
    xTokens: tokens,
    address,
  });

  const {
    data: userReservesData,
    isLoading: isUserReservesLoading,
    refetch: refetchReserves,
  } = useUserReservesData({ spokeProvider, address });
  const userReserves = userReservesData?.[0] || [];
  const {
    data: formattedReserves,
    isLoading: isFormattedReservesLoading,
    refetch: refetchFormattedReserves,
  } = useReservesUsdFormat();
  const { data: userSummary, refetch: refetchSummary } = useUserFormattedSummary({ spokeProvider, address });
  const healthFactorRaw = userSummary?.healthFactor ? Number(userSummary.healthFactor) : undefined;

  const healthFactorDisplay =
    healthFactorRaw !== undefined && Number.isFinite(healthFactorRaw) ? healthFactorRaw.toFixed(2) : '-';

  function getHealthFactorState(hf: number) {
    if (hf < 1) {
      return { label: 'At risk', className: 'text-negative' };
    }
    if (hf < 2) {
      return { label: 'Caution', className: 'text-yellow-dark' };
    }
    return { label: 'Very safe', className: 'text-cherry-soda' };
  }
  const healthState = healthFactorRaw !== undefined ? getHealthFactorState(healthFactorRaw) : undefined;

  // Extract all aToken addresses from formattedReserves for batch fetching
  const aTokenAddresses = useMemo(() => {
    if (!formattedReserves) return [];
    return formattedReserves
      .map(reserve => reserve.aTokenAddress)
      .filter((address): address is `0x${string}` => isAddress(address));
  }, [formattedReserves]);

  // Fetch all aToken balances in a single multicall
  const {
    data: aTokenBalancesMap,
    isLoading: isATokensLoading,
    refetch: refetchBalances,
  } = useATokensBalances({
    aTokens: aTokenAddresses,
    spokeProvider,
    userAddress: address,
  });

  const handleRefresh = async () => {
    await Promise.all([
      refetchFormattedReserves(),
      refetchBalances(),
      refetchReserves(),
      refetchSummary(),
      refetchWalletBalances(),
    ]);
  };
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Markets</CardTitle>
          <div className="flex items-center gap-1 text-sm text-muted-foreground">
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  type="button"
                  aria-label="Health Factor info"
                  className="inline-flex items-center text-clay hover:text-cherry-dark"
                >
                  <Info className="w-4 h-4 text-cherry-soda" />
                </button>
              </TooltipTrigger>

              <TooltipContent>
                <strong>Health Factor</strong> indicates how close your account is to liquidation. Values below{' '}
                <strong>1</strong> are unsafe.
              </TooltipContent>
            </Tooltip>
            <span className="text-cherry-soda">Health Factor:</span>
            <span className="font-semibold text-foreground">{healthFactorDisplay}</span>
            {healthState && (
              <span className={`ml-2 text-xs font-medium ${healthState.className}`}>({healthState.label})</span>
            )}
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
                  {TABLE_HEADERS.map((header, index) => {
                    if (header === 'LT %') {
                      return (
                        <TableHead key={`${header}-${index}`} className="text-cherry-dark font-bold">
                          <div className="flex items-center gap-1">
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <button
                                  type="button"
                                  aria-label="Liquidation Threshold info"
                                  className="inline-flex items-center translate-y-px text-clay hover:text-cherry-dark"
                                >
                                  <Info className="w-3 h-3 mb-0.5 text-cherry-soda" />
                                </button>
                              </TooltipTrigger>

                              <TooltipContent>
                                <strong>Liquidation Threshold</strong> is the percentage of supplied value that counts
                                toward liquidation calculations.
                              </TooltipContent>
                            </Tooltip>
                            <span>{header}</span>
                          </div>
                        </TableHead>
                      );
                    }

                    return (
                      <TableHead key={`${header}-${index}`} className="text-cherry-dark font-bold">
                        {header}
                      </TableHead>
                    );
                  })}
                </TableRow>
              </TableHeader>
              <TableBody>
                {isUserReservesLoading ||
                isFormattedReservesLoading ||
                isATokensLoading ||
                !userReserves ||
                !formattedReserves ? (
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
                      userReserves={userReserves}
                      aTokenBalancesMap={aTokenBalancesMap}
                      onRefreshReserves={handleRefresh}
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
