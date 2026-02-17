import React, { type JSX, useMemo, useState } from 'react';
import {
  useUserReservesData,
  useSpokeProvider,
  useReservesUsdFormat,
  useBackendAllMoneyMarketAssets,
  useUserFormattedSummary,
} from '@sodax/dapp-kit';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useWalletProvider, useXAccount, useXBalances } from '@sodax/wallet-sdk-react';
import { BorrowAssetsListItem } from './BorrowAssetsListItem';
import { formatUnits } from 'viem';
import { getBorrowableAssetsWithMarketData } from '@/lib/borrowUtils';
import { BorrowModal } from './BorrowModal';
import { type XToken, type ChainId, moneyMarketSupportedTokens, AVALANCHE_MAINNET_CHAIN_ID } from '@sodax/types';
import { ChainSelector } from '@/components/shared/ChainSelector';
import { RepayModal } from '../RepayModal';
import { useAppStore } from '@/zustand/useAppStore';
import { isXTokenArray } from '../../typeGuards';

const TABLE_HEADERS = [
  'Asset',
  'Wallet balance',
  'Available Liquidity',
  'Borrow APY',
  'Borrow APR',
  'Total Borrow',
  'Borrowed',
  'Actions',
];
type BorrowAssetsListProps = {
  initialChainId?: ChainId;
};

export function BorrowAssetsList({ initialChainId }: BorrowAssetsListProps): JSX.Element {
  const [selectedChainId, selectChainId] = useState(initialChainId ?? AVALANCHE_MAINNET_CHAIN_ID);
  const [borrowData, setBorrowData] = useState<{
    token: XToken;
    maxBorrow: string;
    priceUSD: number;
  } | null>(null);
  const [repayData, setRepayData] = useState<{
    token: XToken;
    maxDebt: string;
  } | null>(null);

  const { selectedChainId: selectedMarketChainId } = useAppStore();

  const { address } = useXAccount(selectedChainId);
  const walletProvider = useWalletProvider(selectedChainId);
  const spokeProvider = useSpokeProvider(selectedChainId, walletProvider);

  const allTokens = useMemo(() => {
    const tokens = Object.entries(moneyMarketSupportedTokens).flatMap(([chainId, chainTokens]) =>
      chainTokens.map(token => ({
        ...token,
        xChainId: chainId,
      })),
    );
    // Type guard: validate all tokens are valid XToken objects before returning
    if (!isXTokenArray(tokens)) {
      throw new Error('Invalid type of variable allTokens: expected XToken[]');
    }
    return tokens;
  }, []);

  const { address: marketAddress } = useXAccount(selectedMarketChainId);
  const marketWalletProvider = useWalletProvider(selectedMarketChainId);
  const marketSpokeProvider = useSpokeProvider(selectedMarketChainId, marketWalletProvider);
  const { data: allMoneyMarketAssets, isLoading: isAssetsLoading } = useBackendAllMoneyMarketAssets({});

  const {
    data: userReserves,
    isLoading: isUserReservesLoading,
  } = useUserReservesData({ spokeProvider, address });

  const { data: marketUserReserves, isLoading: isMarketUserReservesLoading } = useUserReservesData({
    spokeProvider: marketSpokeProvider,
    address: marketAddress,
  });

  const {
    data: formattedReserves,
    isLoading: isFormattedReservesLoading,
  } = useReservesUsdFormat();
  // Use marketSpokeProvider and marketAddress for userSummary since that's where collateral is
  const { data: userSummary } = useUserFormattedSummary({
    spokeProvider: marketSpokeProvider,
    address: marketAddress,
  });
  const borrowableAssets = useMemo(() => {
    if (!allMoneyMarketAssets) return [];
    // 1. Get all assets the backend says are borrowable globally
    const allBorrowableAssets = getBorrowableAssetsWithMarketData(allMoneyMarketAssets, allTokens);

    // 2. Get the specific tokens our config says should be supported for the SELECTED chain
    const supportedOnChain = moneyMarketSupportedTokens[selectedChainId] || [];

    // 3. FIX: Only return assets that belong to the selected chain
    // AND are explicitly defined in that chain's config
    return allBorrowableAssets.filter(
      asset => asset.chainId === selectedChainId && supportedOnChain.some(t => t.symbol === asset.token.symbol),
    );
  }, [allMoneyMarketAssets, allTokens, selectedChainId]);

  const tokensOnSelectedChain = useMemo(
    () => allTokens.filter(t => t.xChainId === selectedChainId),
    [allTokens, selectedChainId],
  );
  const { data: balances } = useXBalances({
    xChainId: selectedChainId,
    xTokens: tokensOnSelectedChain,
    address,
  });
  const hasCollateral = !!marketUserReserves?.[0]?.some(reserve => reserve.scaledATokenBalance > 0n);

  const isLoading =
    isUserReservesLoading || isFormattedReservesLoading || isAssetsLoading || isMarketUserReservesLoading;

  return (
    <Card className="mt-3">
      <CardHeader>
        <CardTitle>Assets to Borrow</CardTitle>
        <p className="text-sm text-clay font-normal">Borrow assets available on the selected chain.</p>

        {!hasCollateral && !isLoading && (
          <div className="mt-4 p-3 bg-cherry-brighter/20 border border-cherry-soda/30 rounded-lg flex items-start gap-2">
            <p className="text-sm text-cherry-soda font-medium">
              To borrow assets, first supply collateral in the Markets section above on any supported chain.
            </p>
          </div>
        )}
      </CardHeader>
      <div className="py-2 mx-2 my-1">
        <div className="flex items-center gap-3 mx-6 pb-2">
          <span className="text-sm font-medium text-clay">Chain:</span>
          <ChainSelector selectedChainId={selectedChainId} selectChainId={selectChainId} />
        </div>
      </div>
      <CardContent className="p-0">
        <div className="overflow-hidden">
          <div className="max-h-[500px] overflow-y-auto">
            <Table unstyled className="w-full">
              <TableHeader className="sticky top-0 bg-cream backdrop-blur-sm z-20 border-b border-cherry-grey/20">
                <TableRow>
                  {TABLE_HEADERS.map(header => (
                    <TableHead
                      key={header}
                      className={`text-xs font-medium text-clay uppercase tracking-wide px-6 py-4 ${
                        header === 'Actions' ? 'text-center' : ''
                      }`}
                    >
                      {header}
                    </TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-12 text-clay">
                      Loading borrowable assets...
                    </TableCell>
                  </TableRow>
                ) : (
                  borrowableAssets.map((asset, index) => (
                    <BorrowAssetsListItem
                      key={`${asset.chainId}-${asset.address}-${index}`}
                      token={asset.token}
                      asset={asset}
                      disabled={!hasCollateral}
                      walletBalance={
                        asset.token?.xChainId === selectedChainId && balances?.[asset.token.address]
                          ? Number(formatUnits(balances[asset.token.address], asset.token.decimals)).toFixed(6)
                          : '-'
                      }
                      formattedReserves={formattedReserves || []}
                      userReserves={userReserves?.[0] || []}
                      onBorrowClick={(token, maxBorrow, priceUSD) => {
                        setBorrowData({ token, maxBorrow, priceUSD });
                      }}
                      onRepayClick={(token, maxDebt) => {
                        setRepayData({ token, maxDebt });
                      }}
                      userSummary={userSummary}
                    />
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </div>
      </CardContent>
      {borrowData && (
        <BorrowModal
          open={!!borrowData}
          token={borrowData.token}
          inlineSuccess={true}
          onOpenChange={open => {
            if (!open) setBorrowData(null);
          }}
          maxBorrow={borrowData.maxBorrow}
          priceUSD={borrowData.priceUSD}
          userSummary={userSummary}
        />
      )}
      {repayData && (
        <RepayModal
          open={true}
          token={repayData.token}
          maxDebt={repayData.maxDebt}
          inlineSuccess={true}
          onOpenChange={open => {
            if (!open) setRepayData(null);
          }}
        />
      )}
    </Card>
  );
}
