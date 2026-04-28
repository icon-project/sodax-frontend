import React, { type JSX, useMemo, useState } from 'react';
import {
  useUserReservesData,
  useReservesUsdFormat,
  useBackendAllMoneyMarketAssets,
  useUserFormattedSummary,
  useXBalances,
  useSodaxContext,
} from '@sodax/dapp-kit';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { getXChainType, useXAccount, useXService } from '@sodax/wallet-sdk-react';
import { BorrowAssetsListItem } from './BorrowAssetsListItem';
import { formatUnits } from 'viem';
import { getBorrowableAssetsWithMarketData } from '@/lib/borrowUtils';
import { BorrowModal } from './BorrowModal';
import { ChainKeys, type SpokeChainKey, type XToken } from '@sodax/types';
import { ChainSelector } from '@/components/shared/ChainSelector';
import { RepayModal } from '../RepayModal';
import { Info } from 'lucide-react';
import { Tooltip, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip';

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
  initialChainId?: SpokeChainKey;
};

export function BorrowAssetsList({ initialChainId }: BorrowAssetsListProps): JSX.Element {
  const [selectedChainId, selectChainId] = useState<SpokeChainKey>(initialChainId ?? ChainKeys.AVALANCHE_MAINNET);
  const { sodax } = useSodaxContext();
  const [borrowData, setBorrowData] = useState<{
    token: XToken;
    maxBorrow: string;
    priceUSD: number;
  } | null>(null);
  const [repayData, setRepayData] = useState<{
    token: XToken;
    maxDebt: string;
  } | null>(null);

  const { address } = useXAccount(selectedChainId);

  const { data: allMoneyMarketAssets, isLoading: isAssetsLoading } = useBackendAllMoneyMarketAssets({});

  const { data: userReserves, isLoading: isUserReservesLoading } = useUserReservesData({
    spokeChainKey: selectedChainId,
    userAddress: address,
  });

  const { data: formattedReserves, isLoading: isFormattedReservesLoading } = useReservesUsdFormat();
  const { data: userSummary } = useUserFormattedSummary({
    spokeChainKey: selectedChainId,
    userAddress: address,
  });
  const borrowableAssets = useMemo(() => {
    if (!allMoneyMarketAssets) return [];
    const allBorrowableAssets = getBorrowableAssetsWithMarketData(sodax, allMoneyMarketAssets);

    const supportedOnChain = sodax.moneyMarket.getSupportedTokensByChainId(selectedChainId);

    return allBorrowableAssets.filter(
      asset => asset.chainId === selectedChainId && supportedOnChain.some(t => t.symbol === asset.token.symbol),
    );
  }, [sodax, allMoneyMarketAssets, selectedChainId]);

  const tokensOnSelectedChain = sodax.moneyMarket.getSupportedTokensByChainId(selectedChainId);
  const xService = useXService(getXChainType(selectedChainId));
  const { data: balances } = useXBalances({
    xService,
    xChainId: selectedChainId,
    xTokens: tokensOnSelectedChain,
    address,
  });
  const hasCollateral = !!userReserves?.[0]?.some(reserve => reserve.scaledATokenBalance > 0n);

  const isLoading = isUserReservesLoading || isFormattedReservesLoading || isAssetsLoading;

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
                  {TABLE_HEADERS.map((header, index) => {
                    if (header === 'Available Liquidity') {
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
                                  aria-label="Available Liquidity Info"
                                  className="inline-flex items-center text-clay hover:text-cherry-dark"
                                >
                                  <Info className="w-3.5 h-3.5" />
                                </button>
                              </TooltipTrigger>
                              <TooltipContent variant="soft" side="top" align="center" sideOffset={6}>
                                The amount of tokens available in the pool that can be borrowed. This represents the
                                unborrowed tokens in the money market, which may be limited by a borrow cap if one is
                                set.
                              </TooltipContent>
                            </Tooltip>
                          </div>
                        </TableHead>
                      );
                    }

                    if (header === 'Borrow APY') {
                      return (
                        <TableHead
                          key={`${header}-${index}`}
                          className="text-xs font-medium text-clay uppercase tracking-wide px-4 py-4"
                        >
                          <div className="flex items-center gap-1">
                            {header}
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <button
                                  type="button"
                                  aria-label="Borrow APY info"
                                  className="inline-flex items-center text-clay hover:text-cherry-dark"
                                >
                                  <Info className="w-3.5 h-3.5" />
                                </button>
                              </TooltipTrigger>
                              <TooltipContent variant="soft" side="top" align="center" sideOffset={6}>
                                Annual Percentage Yield is the effective annual interest rate you pay for borrowing
                                assets, accounting for compound interest. This is the actual cost you'll pay over a
                                year.
                              </TooltipContent>
                            </Tooltip>
                          </div>
                        </TableHead>
                      );
                    }

                    if (header === 'Borrow APR') {
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
                                  aria-label="Borrow APR info"
                                  className="inline-flex items-center text-clay hover:text-cherry-dark"
                                >
                                  <Info className="w-3.5 h-3.5" />
                                </button>
                              </TooltipTrigger>
                              <TooltipContent variant="soft" side="top" align="center" sideOffset={6}>
                                Annual Percentage Rate is the simple annual interest rate you pay for borrowing assets,
                                without compounding. APY accounts for compounding and is typically higher than APR.
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
                        asset.token?.chainKey === selectedChainId && balances?.[asset.token.address]
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
          debtChainId={selectedChainId}
          inlineSuccess={true}
          onOpenChange={open => {
            if (!open) setRepayData(null);
          }}
        />
      )}
    </Card>
  );
}
