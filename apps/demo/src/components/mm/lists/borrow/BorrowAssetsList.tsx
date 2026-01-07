import React, { useMemo } from 'react';
import {
  useUserReservesData,
  useSpokeProvider,
  useReservesUsdFormat,
  useBackendAllMoneyMarketAssets,
} from '@sodax/dapp-kit';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useWalletProvider, useXAccount, useXBalances } from '@sodax/wallet-sdk-react';
import { useAppStore } from '@/zustand/useAppStore';
import { BorrowAssetsListItem } from './BorrowAssetsListItem';
import { AlertCircle, Loader2 } from 'lucide-react';
import { moneyMarketSupportedTokens, type XToken } from '@sodax/sdk';
import { formatUnits } from 'viem';
import { getBorrowableAssetsWithMarketData } from '@/lib/borrowUtils';

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
  /**
   * The chain the user is currently connected to in their wallet.
   * This is the SOURCE chain:
   * - where the user supplies collateral
   * - where we check wallet balances
   */
  const { selectedChainId } = useAppStore();

  /**
   * 1️⃣ BACKEND (GLOBAL, NOT USER-SPECIFIC)
   *
   * Fetches ALL money market assets from the backend.
   * - All chains
   * - All markets
   * - No wallet needed
   *
   * This answers: "What assets exist and can theoretically be borrowed?"
   */
  const { data: allMoneyMarketAssets, isLoading: isAssetsLoading } = useBackendAllMoneyMarketAssets({});

  /**
   * User wallet address on the SELECTED (source) chain.
   * Needed to check balances and collateral.
   */
  const { address } = useXAccount(selectedChainId);

  /**
   * Wallet provider for the selected chain (MetaMask, etc).
   */
  const walletProvider = useWalletProvider(selectedChainId);

  /**
   * Spoke provider for the selected chain.
   * Used for on-chain reads related to the user's position.
   */
  const spokeProvider = useSpokeProvider(selectedChainId, walletProvider);

  /**
   * 2️⃣ TOKEN CATALOG (STATIC DATA)
   *
   * Build a flat list of ALL supported tokens on ALL chains.
   * This does NOT care about the user's wallet.
   *
   * Purpose:
   * - acts as a dictionary / lookup table
   * - lets us attach metadata (symbol, decimals, chainId)
   */
  const allTokens = useMemo(() => {
    return Object.entries(moneyMarketSupportedTokens).flatMap(([chainId, chainTokens]) =>
      chainTokens.map(token => ({
        ...token,
        xChainId: chainId, // this is the token's REAL chain
      })),
    ) as XToken[];
  }, []);

  /**
   * 3️⃣ BORROWABLE ASSETS (CORE LOGIC)
   *
   * Combine:
   * - backend money market data (liquidity, rates, caps)
   * - token metadata (symbol, decimals, chain)
   *
   * Result:
   * - one row = one borrowable asset on one destination chain
   * - THIS is what the table renders
   */
  const borrowableAssets = useMemo(() => {
    if (!allMoneyMarketAssets) return [];
    return getBorrowableAssetsWithMarketData(allMoneyMarketAssets, allTokens);
  }, [allMoneyMarketAssets, allTokens]);

  /**
   * Tokens that live ONLY on the selected (source) chain.
   * We use these ONLY to read wallet balances.
   *
   * Important:
   * - balances are chain-specific
   * - you cannot read balances for other chains from this wallet
   */
  const tokensOnSelectedChain = useMemo(
    () => allTokens.filter(t => t.xChainId === selectedChainId),
    [allTokens, selectedChainId],
  );

  /**
   * Wallet balances on the selected chain.
   *
   * This answers:
   * "How much of this token does the user currently hold on THIS chain?"
   */
  const { data: balances } = useXBalances({
    xChainId: selectedChainId,
    xTokens: tokensOnSelectedChain,
    address,
  });

  /**
   * User reserves (supplied collateral, debt, etc)
   * This is USER-SPECIFIC and CHAIN-SPECIFIC.
   *
   * Used to decide:
   * - can the user borrow at all?
   */
  const { data: userReserves, isLoading: isUserReservesLoading } = useUserReservesData({ spokeProvider, address });

  /**
   * Formatted reserve data (rates, liquidity, caps).
   * This is MARKET data, not wallet data.
   */
  const { data: formattedReserves, isLoading: isFormattedReservesLoading } = useReservesUsdFormat();

  /**
   * Simple rule:
   * If the user has supplied ANY collateral, borrowing is enabled.
   */
  const hasCollateral = !!userReserves?.[0]?.some(reserve => reserve.scaledATokenBalance > 0n);

  /**
   * Unified loading state for the whole screen.
   */
  const isLoading = isUserReservesLoading || isFormattedReservesLoading || isAssetsLoading;

  return (
    <Card className="mt-6">
      <CardHeader>
        <CardTitle>Assets to Borrow</CardTitle>
        <p className="text-sm text-clay font-normal mt-2"> Borrow assets - choose destination chain.</p>

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
                  borrowableAssets.map(asset => (
                    <BorrowAssetsListItem
                      key={`${asset.chainId}-${asset.address}`}
                      token={asset.token} /**
                       * Token metadata for this borrowable asset.
                       * This token lives on the DESTINATION chain.
                       */
                      asset={asset}
                      disabled={!hasCollateral}
                      walletBalance={
                        asset.token?.xChainId === selectedChainId && balances?.[asset.token.address]
                          ? Number(formatUnits(balances[asset.token.address], asset.token.decimals)).toFixed(4)
                          : '-'
                      }
                      formattedReserves={formattedReserves || []}
                      userReserves={userReserves?.[0] || []}
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
