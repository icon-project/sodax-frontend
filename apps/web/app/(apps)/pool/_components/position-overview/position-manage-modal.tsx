'use client';

import type React from 'react';
import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { X, Loader2, PlusCircle, MinusCircle, TrendingUp } from 'lucide-react';
import { cn, formatTokenAmount } from '@/lib/utils';
import type { EnrichedPosition } from '../../_mocks';
import { usePoolContext } from '../../_hooks/usePoolContext';
import { usePoolState, usePoolActions } from '../../_stores/pool-store-provider';
import { getDisplayTokens } from '../../_utils/display-tokens';
import { TokenInput } from '../token-inputs/token-input';
import {
  usePositionInfo,
  useDecreaseLiquidity,
  useClaimRewards,
  useLiquidityAmounts,
  createDecreaseLiquidityParamsProps,
} from '@sodax/dapp-kit';

type ManageTab = 'add' | 'withdraw' | 'claim';

interface PositionManageModalProps {
  position: EnrichedPosition | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  defaultTab?: ManageTab;
}

export function PositionManageModal({
  position,
  open,
  onOpenChange,
  defaultTab = 'add',
}: PositionManageModalProps): React.JSX.Element {
  const { selectedPoolKey, spokeProvider, poolData, token0Balance, token1Balance } = usePoolContext();
  const { slippageTolerance } = usePoolState();
  const { setPositionIdToManage, setMinPrice, setMaxPrice, setIsDialogOpen } = usePoolActions();
  const { token0Symbol, token1Symbol } = getDisplayTokens(poolData);

  const [activeTab, setActiveTab] = useState<ManageTab>(defaultTab);
  const [error, setError] = useState<string | null>(null);

  const { data: positionData } = usePositionInfo({
    tokenId: position?.tokenId ?? null,
    poolKey: selectedPoolKey,
  });

  // For add liquidity tab: use the position's range (preselected)
  const positionMinPrice = position?.priceLower?.toFixed(4) ?? '';
  const positionMaxPrice = position?.priceUpper?.toFixed(4) ?? '';
  const { liquidityToken0Amount, liquidityToken1Amount, handleToken0AmountChange, handleToken1AmountChange } =
    useLiquidityAmounts(positionMinPrice, positionMaxPrice, poolData);

  const token0 = poolData?.token0;
  const token1 = poolData?.token1;
  const formattedToken0Balance = token0 ? formatTokenAmount(token0Balance, token0.decimals) : undefined;
  const formattedToken1Balance = token1 ? formatTokenAmount(token1Balance, token1.decimals) : undefined;

  const decreaseMutation = useDecreaseLiquidity();
  const claimMutation = useClaimRewards();

  if (!position) return <></>;

  const symbol0 = position.symbol0 ?? `${position.currency0.slice(0, 6)}...`;
  const symbol1 = position.symbol1 ?? `${position.currency1.slice(0, 6)}...`;
  const positionInfo = positionData?.positionInfo ?? null;
  const isPending = decreaseMutation.isPending || claimMutation.isPending;

  const handleAddLiquidity = () => {
    // Set position to manage, preselect range from position, open supply dialog
    setPositionIdToManage(position.tokenId);
    setMinPrice(positionMinPrice);
    setMaxPrice(positionMaxPrice);
    onOpenChange(false);
    setIsDialogOpen(true);
  };

  const handleWithdraw = async () => {
    if (!selectedPoolKey || !spokeProvider || !positionInfo || !position) return;
    try {
      setError(null);
      await decreaseMutation.mutateAsync({
        params: createDecreaseLiquidityParamsProps({
          poolKey: selectedPoolKey,
          tokenId: position.tokenId,
          percentage: 100,
          positionInfo,
          slippageTolerance,
        }),
        spokeProvider,
      });
      onOpenChange(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Withdraw failed');
    }
  };

  const handleClaim = async () => {
    if (!selectedPoolKey || !spokeProvider || !positionInfo || !position) return;
    try {
      setError(null);
      await claimMutation.mutateAsync({
        params: {
          poolKey: selectedPoolKey,
          tokenId: BigInt(position.tokenId),
          tickLower: BigInt(positionInfo.tickLower),
          tickUpper: BigInt(positionInfo.tickUpper),
        },
        spokeProvider,
      });
      onOpenChange(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Claim failed');
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent enableMotion hideCloseButton className="sm:max-w-[380px]">
        <button
          type="button"
          onClick={() => onOpenChange(false)}
          className="absolute right-4 top-4 rounded-sm opacity-70 hover:opacity-100 transition-opacity cursor-pointer"
        >
          <X className="h-4 w-4 text-clay" />
        </button>

        {/* Header: pair + amounts + APY */}
        <DialogHeader>
          <DialogTitle className="font-['InterRegular'] text-base text-espresso">
            {symbol0} / {symbol1}
          </DialogTitle>
          <div className="flex items-center justify-between mt-1">
            <span className="font-['InterRegular'] text-sm text-clay">
              {position.amount0} / {position.amount1}
            </span>
            {position.estimatedApr != null && (
              <span className="px-2 py-0.5 rounded-full bg-cream-white font-['InterRegular'] text-xs text-espresso font-medium">
                {(position.estimatedApr * 100).toFixed(2)}% APY
              </span>
            )}
          </div>
        </DialogHeader>

        {/* Tab content */}
        <div className="mt-3 min-h-[120px]">
          {activeTab === 'add' && (
            <div className="flex flex-col gap-3">
              <span className="font-['InterRegular'] text-sm text-espresso font-medium">Add more liquidity</span>
              <TokenInput
                tokenSymbol={token0Symbol}
                value={liquidityToken0Amount}
                onChange={handleToken0AmountChange}
                balance={formattedToken0Balance}
                onMaxClick={
                  token0 ? () => handleToken0AmountChange(formatTokenAmount(token0Balance, token0.decimals)) : undefined
                }
              />
              <TokenInput
                tokenSymbol={token1Symbol}
                value={liquidityToken1Amount}
                onChange={handleToken1AmountChange}
                balance={formattedToken1Balance}
                onMaxClick={
                  token1 ? () => handleToken1AmountChange(formatTokenAmount(token1Balance, token1.decimals)) : undefined
                }
              />
              <Button
                variant="cherry"
                className="w-full"
                disabled={!liquidityToken0Amount && !liquidityToken1Amount}
                onClick={handleAddLiquidity}
              >
                Add liquidity
              </Button>
            </div>
          )}

          {activeTab === 'withdraw' && (
            <div className="flex flex-col gap-3">
              <div className="flex justify-between p-3 rounded-lg bg-almost-white mix-blend-multiply">
                <span className="font-['InterRegular'] text-sm text-clay">{symbol0}</span>
                <span className="font-['InterRegular'] text-sm text-espresso font-medium">{position.amount0}</span>
              </div>
              <div className="flex justify-between p-3 rounded-lg bg-almost-white mix-blend-multiply">
                <span className="font-['InterRegular'] text-sm text-clay">{symbol1}</span>
                <span className="font-['InterRegular'] text-sm text-espresso font-medium">{position.amount1}</span>
              </div>
              <Button
                variant="outline"
                className="w-full"
                disabled={isPending || !positionInfo}
                onClick={handleWithdraw}
              >
                {decreaseMutation.isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                    Withdrawing...
                  </>
                ) : (
                  'Withdraw all'
                )}
              </Button>
            </div>
          )}

          {activeTab === 'claim' && (
            <div className="flex flex-col gap-3">
              <div className="p-3 rounded-lg bg-almost-white mix-blend-multiply text-center">
                <span className="font-['InterRegular'] text-2xl text-espresso font-semibold">
                  ${position.earnedFeesUsd.toFixed(4)}
                </span>
                <p className="font-['InterRegular'] text-xs text-clay mt-1">Unclaimed fees</p>
              </div>
              <Button
                variant="cream"
                className="w-full"
                disabled={isPending || !positionInfo || position.earnedFeesUsd <= 0}
                onClick={handleClaim}
              >
                {claimMutation.isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                    Claiming...
                  </>
                ) : (
                  `Claim $${position.earnedFeesUsd.toFixed(4)}`
                )}
              </Button>
            </div>
          )}

          {error && <p className="font-['InterRegular'] text-xs text-red-500 mt-2">{error}</p>}
        </div>

        {/* Tab bar */}
        <div className="flex items-center border-t border-cream-white pt-3 mt-2 gap-1">
          <button
            type="button"
            onClick={() => setActiveTab('add')}
            className={cn(
              "flex-1 flex items-center justify-center gap-1 py-1.5 rounded-lg font-['InterRegular'] text-xs transition-colors",
              activeTab === 'add' ? 'bg-cream-white text-espresso font-medium' : 'text-clay hover:text-espresso',
            )}
          >
            <PlusCircle className="w-3 h-3" />
            Add liquidity
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('withdraw')}
            className={cn(
              "flex-1 flex items-center justify-center gap-1 py-1.5 rounded-lg font-['InterRegular'] text-xs transition-colors",
              activeTab === 'withdraw' ? 'bg-cream-white text-espresso font-medium' : 'text-clay hover:text-espresso',
            )}
          >
            <MinusCircle className="w-3 h-3" />
            Withdraw
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('claim')}
            className={cn(
              "flex-1 flex items-center justify-center gap-1 py-1.5 rounded-lg font-['InterRegular'] text-xs transition-colors",
              activeTab === 'claim' ? 'bg-cream-white text-espresso font-medium' : 'text-clay hover:text-espresso',
            )}
          >
            <TrendingUp className="w-3 h-3" />
            Claim ${position.earnedFeesUsd.toFixed(4)}
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
