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
import { AlertCircle, Loader2 } from 'lucide-react';
import { formatUnits } from 'viem';
import { getBorrowableAssetsWithMarketData } from '@/lib/borrowUtils';
import { BorrowModal } from './BorrowModal';
import { SuccessModal } from '../SuccessModal';
import { type XToken, type ChainId, moneyMarketSupportedTokens, AVALANCHE_MAINNET_CHAIN_ID } from '@sodax/types';
import { ChainSelector } from '@/components/shared/ChainSelector';

const TABLE_HEADERS = [
  'Asset',
  'Wallet balance',
  'Available Liquidity',
  'Borrow APY',
  'Borrow APR',
  'Total Borrow',
  'Action',
];
type BorrowAssetsListProps = {
  initialChainId?: ChainId;
};

export function BorrowAssetsList({ initialChainId }: BorrowAssetsListProps): JSX.Element {
  const [selectedChainId, selectChainId] = useState(initialChainId ?? AVALANCHE_MAINNET_CHAIN_ID);
  const [successData, setSuccessData] = useState<{
    amount: string;
    token: XToken;
    sourceChainId: ChainId;
    destinationChainId: ChainId;
  } | null>(null);

  const { data: allMoneyMarketAssets, isLoading: isAssetsLoading } = useBackendAllMoneyMarketAssets({});

  const { address } = useXAccount(selectedChainId);

  const walletProvider = useWalletProvider(selectedChainId);

  const spokeProvider = useSpokeProvider(selectedChainId, walletProvider);
  const allTokens = useMemo(() => {
    return Object.entries(moneyMarketSupportedTokens).flatMap(([chainId, chainTokens]) =>
      chainTokens.map(token => ({
        ...token,
        xChainId: chainId,
      })),
    ) as XToken[];
  }, []);

  const [borrowData, setBorrowData] = useState<{
    token: XToken;
    maxBorrow: string;
  } | null>(null);

  const borrowableAssets = useMemo(() => {
    if (!allMoneyMarketAssets) return [];
    // 1. Get all assets the backend says are borrowable globally
    const allBorrowableAssets = getBorrowableAssetsWithMarketData(allMoneyMarketAssets, allTokens);

    const sodaVariants = allBorrowableAssets.filter(
      a => a.symbol.toLowerCase().startsWith('soda') || a.symbol.includes('.LL'),
    );
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

  const { data: userReserves, isLoading: isUserReservesLoading } = useUserReservesData({ spokeProvider, address });

  const { data: formattedReserves, isLoading: isFormattedReservesLoading } = useReservesUsdFormat();
  const { data: userSummary } = useUserFormattedSummary({
    spokeProvider,
    address,
  });

  const hasCollateral = !!userReserves?.[0]?.some(reserve => reserve.scaledATokenBalance > 0n);

  const isLoading = isUserReservesLoading || isFormattedReservesLoading || isAssetsLoading;

  return (
    <Card className="mt-3">
      <CardHeader>
        <CardTitle>Assets to Borrow</CardTitle>
        <p className="text-sm text-clay font-normal"> Select an asset and destination chain to begin borrowing.</p>

        {!hasCollateral && !isLoading && (
          <div className="mt-4 p-3 bg-cherry-brighter/20 border border-cherry/30 rounded-lg flex items-start gap-2">
            <AlertCircle className="w-4 h-4 text-cherry-soda shrink-0 mt-0.5" />
            <p className="text-sm text-cherry-soda font-medium">
              Borrowing is disabled because you have not supplied collateral on this chain.
            </p>
          </div>
        )}
      </CardHeader>
      <div className=" py-2 mx-2 my-1">
        <div className="flex items-center gap-3 mx-6 pb-2">
          <span className="text-sm font-medium text-clay">Chain:</span>
          <ChainSelector selectedChainId={selectedChainId} selectChainId={selectChainId} />
        </div>
      </div>
      <CardContent>
        <div className="rounded-lg border border-cherry-grey/20 overflow-hidden">
          <Table className="table-fixed w-full">
            <TableHeader className="sticky top-0 bg-cream z-20">
              <TableRow className="border-b border-cherry-grey/20">
                {TABLE_HEADERS.map(header => (
                  <TableHead
                    key={header}
                    className="sticky top-0 z-10 bg-cream text-cherry-dark font-bold whitespace-nowrap after:absolute after:inset-0 after:-z-10 after:bg-cream"
                  >
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
                  borrowableAssets.map((asset, index) => {
                    const sourceToken = allTokens.find(
                      t => t.symbol === asset.token.symbol && t.xChainId === selectedChainId,
                    );
                    // console.log("CURRENTLY SELECTED TOKEN:", selectedTokenForBorrow?.symbol);
                    // console.log(`ROW CREATED: Row is ${asset.token.symbol}. When clicked, it will send ${asset.token.symbol} up.`);
                    // console.log(`Row ${index} | Display Symbol: ${asset.symbol} | Button Token Symbol: ${asset.token.symbol}`);
                    return (
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
                        onBorrowClick={(token, maxBorrow) => setBorrowData({ token, maxBorrow })}
                        userSummary={userSummary}
                      />
                    );
                  })
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
          onOpenChange={open => {
            if (!open) setBorrowData(null);
          }}
          onSuccess={data => {
            setSuccessData(data);
            setBorrowData(null);
          }}
          maxBorrow={borrowData.maxBorrow}
        />
      )}
      <SuccessModal open={!!successData} onClose={() => setSuccessData(null)} data={successData} action="borrow" />
    </Card>
  );
}
