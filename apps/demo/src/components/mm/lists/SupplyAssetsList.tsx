import React, { useMemo, useState, type ReactElement } from 'react';
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
import { type ChainId, ICON_MAINNET_CHAIN_ID, moneyMarketSupportedTokens, type XToken } from '@sodax/sdk';
import { Tooltip, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip';
import { Info } from 'lucide-react';
import { type ActionType, SuccessModal } from './SuccessModal';
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

  const [withdrawData, setWithdrawData] = useState<{
    token: XToken;
    maxWithdraw: string;
  } | null>(null);
  const [supplyData, setSupplyData] = useState<{
    token: XToken;
    maxSupply: string;
  } | null>(null);
  const [currentAction, setCurrentAction] = useState<ActionType>('repay');
  const [successData, setSuccessData] = useState<{
    amount: string;
    token: XToken;
    sourceChainId: ChainId;
    destinationChainId: ChainId;
    txHash?: `0x${string}`;
  } | null>(null);

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
                <TooltipContent>
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
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <button
                                      type="button"
                                      aria-label="Liquidation Threshold info"
                                      className="inline-flex items-center text-clay hover:text-cherry-dark"
                                    >
                                      <Info className="w-3.5 h-3.5 text-cherry-soda" />
                                    </button>
                                  </TooltipTrigger>
                                  <TooltipContent>
                                    <strong>Liquidation Threshold</strong> is the percentage of supplied value that
                                    counts toward liquidation calculations.
                                  </TooltipContent>
                                </Tooltip>
                                <span>{header}</span>
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
                            balances?.[token.address]
                              ? Number(formatUnits(balances?.[token.address] || 0n, token.decimals)).toFixed(4)
                              : '-'
                          }
                          formattedReserves={formattedReserves}
                          userReserves={userReserves}
                          aTokenBalancesMap={aTokenBalancesMap}
                          onRefreshReserves={handleRefresh}
                          onWithdrawClick={(token, maxWithdraw) => {
                            setCurrentAction('withdraw');
                            setWithdrawData({ token, maxWithdraw });
                          }}
                          onSupplyClick={(token, maxSupply) => {
                            setCurrentAction('supply');
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
          onOpenChange={open => {
            if (!open) setSupplyData(null);
          }}
          onSuccess={data => {
            setSuccessData(data);
            setSupplyData(null);
            handleRefresh();
          }}
        />
      )}
      {withdrawData && (
        <WithdrawModal
          open={true}
          token={withdrawData.token}
          maxWithdraw={withdrawData.maxWithdraw}
          onOpenChange={open => {
            if (!open) setWithdrawData(null);
          }}
          onSuccess={data => {
            setSuccessData(data);
            setWithdrawData(null);
            handleRefresh();
          }}
        />
      )}
      <SuccessModal
        open={!!successData}
        onClose={() => setSuccessData(null)}
        data={successData}
        action={currentAction}
      />
    </>
  );
}
