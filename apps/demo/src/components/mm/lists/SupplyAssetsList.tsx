import React, { useMemo, useState, type ReactElement } from 'react';
import {
  useReservesUsdFormat,
  useSodaxContext,
  useUserFormattedSummary,
  useUserReservesData,
  useATokensBalances,
  useXBalances,
} from '@sodax/dapp-kit';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { getXChainType, useXAccount, useXService } from '@sodax/wallet-sdk-react';
import { formatUnits, isAddress } from 'viem';
import { SupplyAssetsListItem } from './SupplyAssetsListItem';
import { useAppStore } from '@/zustand/useAppStore';
import { ChainKeys, type XToken } from '@sodax/types';
import { Tooltip, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip';
import { Info } from 'lucide-react';
import { SupplyModal } from './SupplyModal';
import { WithdrawModal } from './WithdrawModal';
import { getHealthFactorState } from '@/lib/utils';

const TABLE_HEADERS = [
  'Asset',
  'Wallet Balance',
  'Supplied',
  'LT %',
  'Total Supply',
  'Supply APY',
  'Supply APR',
  'Actions',
] as const;

export function SupplyAssetsList(): ReactElement {
  const { selectedChainId } = useAppStore();
  const { sodax } = useSodaxContext();

  const [withdrawData, setWithdrawData] = useState<{
    token: XToken;
    maxWithdraw: string;
    isHfLimited: boolean;
  } | null>(null);
  const [supplyData, setSupplyData] = useState<{
    token: XToken;
    maxSupply: string;
  } | null>(null);

  const tokens = sodax.moneyMarket.getSupportedTokensByChainId(selectedChainId);
  const isIcon = selectedChainId === ChainKeys.ICON_MAINNET;

  const { address } = useXAccount(selectedChainId);
  const xService = useXService(getXChainType(selectedChainId));
  const {
    data: balances,
    isLoading: isBalancesLoading,
    refetch: refetchWalletBalances,
  } = useXBalances({
    xService,
    xChainId: selectedChainId,
    xTokens: tokens,
    address,
  });

  const {
    data: userReservesData,
    isLoading: isUserReservesLoading,
    refetch: refetchReserves,
  } = useUserReservesData({ spokeChainKey: selectedChainId, userAddress: address });
  const userReserves = userReservesData?.[0] || [];
  const {
    data: formattedReserves,
    isLoading: isFormattedReservesLoading,
    refetch: refetchFormattedReserves,
  } = useReservesUsdFormat();
  const { data: userSummary, refetch: refetchSummary } = useUserFormattedSummary({
    spokeChainKey: selectedChainId,
    userAddress: address,
  });
  const healthFactorRaw = userSummary?.healthFactor ? Number(userSummary.healthFactor) : undefined;

  const healthFactorDisplay =
    healthFactorRaw !== undefined && Number.isFinite(healthFactorRaw) ? healthFactorRaw.toFixed(2) : '-';

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
    spokeChainKey: selectedChainId,
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
    <>
      <Card>
        <CardHeader className="pb-6">
          <div className="flex items-center justify-between">
            <CardTitle>Markets</CardTitle>
            <div className="flex items-center gap-2 px-4 py-2 bg-cream/50 rounded-lg border border-cherry-grey/20">
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
                <TooltipContent variant="soft" side="top" align="center" sideOffset={6}>
                  Indicates how close your account is to liquidation. Values below <strong>1</strong> are unsafe.
                </TooltipContent>
              </Tooltip>
              <span className="text-sm text-cherry-soda">Health Factor:</span>
              <span className="text-sm font-semibold text-cherry-dark">{healthFactorDisplay}</span>
              {healthState && (
                <span className={`text-xs font-medium ${healthState.className}`}>({healthState.label})</span>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {isIcon ? (
            <div className="text-center text-cherry-dark p-8">
              <p className="font-medium">
                Money Market is not available on ICON. ICON is supported for swap and migration only.
              </p>
            </div>
          ) : (
            <div className="overflow-hidden">
              <div className="max-h-[500px] overflow-y-auto">
                <Table unstyled className="w-full">
                  <TableHeader className="sticky top-0 bg-cream backdrop-blur-sm z-20 border-b border-cherry-grey/20">
                    <TableRow>
                      {TABLE_HEADERS.map((header, index) => {
                        if (header === 'LT %') {
                          return (
                            <TableHead
                              key={`${header}-${index}`}
                              className="text-xs font-medium text-clay uppercase tracking-wide px-6 py-4"
                            >
                              <div className="flex items-center gap-1.5">
                                {header}
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <button
                                      type="button"
                                      aria-label="Liquidation Threshold info"
                                      className="inline-flex items-center text-clay hover:text-cherry-dark"
                                    >
                                      <Info className="w-3.5 h-3.5" />
                                    </button>
                                  </TooltipTrigger>
                                  <TooltipContent variant="soft" side="top" align="center" sideOffset={6}>
                                    <strong>Liquidation Threshold</strong> is the percentage of supplied value that
                                    counts toward liquidation calculations.
                                  </TooltipContent>
                                </Tooltip>
                              </div>
                            </TableHead>
                          );
                        }

                        if (header === 'Total Supply') {
                          return (
                            <TableHead
                              key={`${header}-${index}`}
                              className="text-xs font-medium text-clay uppercase tracking-wide px-6 py-4"
                            >
                              <div className="flex items-center gap-1">
                                {header}
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <button
                                      type="button"
                                      aria-label="Total Supply info"
                                      className="inline-flex items-center text-clay hover:text-cherry-dark"
                                    >
                                      <Info className="w-3.5 h-3.5" />
                                    </button>
                                  </TooltipTrigger>
                                  <TooltipContent variant="soft" side="top" align="center" sideOffset={6}>
                                    It's the total amount of tokens supplied to the money market pool by all users. It
                                    equals the sum of available liquidity (unborrowed tokens) and total debt (borrowed
                                    tokens).
                                  </TooltipContent>
                                </Tooltip>
                              </div>
                            </TableHead>
                          );
                        }

                        if (header === 'Supply APY') {
                          return (
                            <TableHead
                              key={`${header}-${index}`}
                              className="text-xs font-medium text-clay uppercase tracking-wide px-6 py-4"
                            >
                              <div className="flex items-center gap-1.5">
                                {header}
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <button
                                      type="button"
                                      aria-label="Supply APY info"
                                      className="inline-flex items-center text-clay hover:text-cherry-dark"
                                    >
                                      <Info className="w-3.5 h-3.5" />
                                    </button>
                                  </TooltipTrigger>
                                  <TooltipContent variant="soft" side="top" align="center" sideOffset={6}>
                                    Annual Percentage Yield is the effective annual return you earn for supplying
                                    assets, accounting for compound interest. This is the actual yield you'll receive
                                    over a year.
                                  </TooltipContent>
                                </Tooltip>
                              </div>
                            </TableHead>
                          );
                        }

                        if (header === 'Supply APR') {
                          return (
                            <TableHead
                              key={`${header}-${index}`}
                              className="text-xs font-medium text-clay uppercase tracking-wide px-6 py-4"
                            >
                              <div className="flex items-center gap-1.5">
                                {header}
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <button
                                      type="button"
                                      aria-label="Supply APR info"
                                      className="inline-flex items-center text-clay hover:text-cherry-dark"
                                    >
                                      <Info className="w-3.5 h-3.5" />
                                    </button>
                                  </TooltipTrigger>
                                  <TooltipContent variant="soft" side="top" align="center" sideOffset={6}>
                                    Annual Percentage Rate is the simple annual interest rate you earn for supplying
                                    assets, without compounding. APY accounts for compounding and is typically higher
                                    than APR.
                                  </TooltipContent>
                                </Tooltip>
                              </div>
                            </TableHead>
                          );
                        }

                        return (
                          <TableHead
                            key={`${header}-${index}`}
                            className={`text-xs font-medium text-clay uppercase tracking-wide px-6 py-4 ${
                              header === 'Actions' ? 'text-center' : ''
                            }`}
                          >
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
                        <TableCell colSpan={16} className="text-center py-12 text-clay">
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
                            // Show "0.0000" when loading (better UX than "...") or when balance is 0
                            // Only show "-" if balances object is null (error/unavailable state)
                            balances != null
                              ? Number(formatUnits(balances[token.address] ?? 0n, token.decimals)).toFixed(4)
                              : isBalancesLoading
                                ? '0.0000'
                                : '-'
                          }
                          formattedReserves={formattedReserves}
                          userReserves={userReserves}
                          aTokenBalancesMap={aTokenBalancesMap}
                          mmPortfolio={
                            userSummary
                              ? {
                                  healthFactor: userSummary.healthFactor,
                                  totalBorrowsUSD: userSummary.totalBorrowsUSD,
                                  totalCollateralUSD: userSummary.totalCollateralUSD,
                                  currentLiquidationThreshold: userSummary.currentLiquidationThreshold,
                                }
                              : undefined
                          }
                          onRefreshReserves={handleRefresh}
                          onWithdrawClick={(token, maxWithdraw, isHfLimited) => {
                            setWithdrawData({ token, maxWithdraw, isHfLimited });
                          }}
                          onSupplyClick={(token, maxSupply) => {
                            setSupplyData({ token, maxSupply });
                          }}
                        />
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
      {supplyData && (
        <SupplyModal
          open={true}
          token={supplyData.token}
          maxSupply={supplyData.maxSupply}
          inlineSuccess={true}
          onOpenChange={open => {
            if (!open) setSupplyData(null);
          }}
        />
      )}
      {withdrawData && (
        <WithdrawModal
          open={true}
          token={withdrawData.token}
          maxWithdraw={withdrawData.maxWithdraw}
          isHfLimited={withdrawData.isHfLimited}
          inlineSuccess={true}
          onOpenChange={open => {
            if (!open) setWithdrawData(null);
          }}
        />
      )}
    </>
  );
}
