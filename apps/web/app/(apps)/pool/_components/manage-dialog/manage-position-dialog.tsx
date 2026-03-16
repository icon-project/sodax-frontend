'use client';

import type React from 'react';
import { useEffect, useState } from 'react';
import {
  createDecreaseLiquidityParamsProps,
  createSupplyLiquidityParamsProps,
  useClaimRewards,
  useDecreaseLiquidity,
  useSpokeProvider,
  useSupplyLiquidity,
} from '@sodax/dapp-kit';
import { spokeChainConfig } from '@sodax/sdk';
import type { ClPositionInfo, PoolData, PoolKey } from '@sodax/sdk';
import type { SpokeChainId } from '@sodax/types';
import { useEvmSwitchChain, useWalletProvider } from '@sodax/wallet-sdk-react';
import { CircleEllipsisIcon, PlusCircleIcon, MinusCircleIcon, XIcon } from 'lucide-react';
import { AddLiquidityTabContent } from '@/app/(apps)/pool/_components/manage-dialog/add-liquidity-tab-content';
import { Button } from '@/components/ui/button';
import { ClaimTabContent } from '@/app/(apps)/pool/_components/manage-dialog/claim-tab-content';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { WithdrawTabContent } from '@/app/(apps)/pool/_components/manage-dialog/withdraw-tab-content';

type ManagePositionDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  tokenId: string;
  poolKey: PoolKey;
  poolData: PoolData;
  chainId: string;
  unclaimedFees0: bigint;
  unclaimedFees1: bigint;
  token0FeeText: string;
  token1FeeText: string;
  initialMinPrice: string;
  initialMaxPrice: string;
  positionInfo: ClPositionInfo;
};

function resolveSpokeChainId(chainId: string): SpokeChainId {
  if (!(chainId in spokeChainConfig)) {
    return 'sonic';
  }
  return chainId as SpokeChainId;
}

export function ManagePositionDialog({
  open,
  onOpenChange,
  tokenId,
  poolKey,
  poolData,
  chainId,
  unclaimedFees0,
  unclaimedFees1,
  token0FeeText,
  token1FeeText,
  initialMinPrice,
  initialMaxPrice,
  positionInfo,
}: ManagePositionDialogProps): React.JSX.Element {
  const [activeTab, setActiveTab] = useState<'claim' | 'add' | 'withdraw'>('claim');
  const [minPrice, setMinPrice] = useState<string>(initialMinPrice);
  const [maxPrice, setMaxPrice] = useState<string>(initialMaxPrice);
  const [liquidityToken0Amount, setLiquidityToken0Amount] = useState<string>('');
  const [liquidityToken1Amount, setLiquidityToken1Amount] = useState<string>('');
  const [slippageTolerance, setSlippageTolerance] = useState<string>('0.5');
  const [withdrawPercentage, setWithdrawPercentage] = useState<string>('25');
  const [error, setError] = useState<string>('');
  const [successMessage, setSuccessMessage] = useState<string>('');
  const spokeChainId = resolveSpokeChainId(chainId);
  const walletProvider = useWalletProvider(spokeChainId);
  const spokeProvider = useSpokeProvider(spokeChainId, walletProvider);
  const { isWrongChain, handleSwitchChain } = useEvmSwitchChain(spokeChainId);
  const claimRewardsMutation = useClaimRewards();
  const supplyLiquidityMutation = useSupplyLiquidity();
  const decreaseLiquidityMutation = useDecreaseLiquidity();

  useEffect((): void => {
    if (!open) {
      return;
    }
    setError('');
    setSuccessMessage('');
    setActiveTab('claim');
    setMinPrice(initialMinPrice);
    setMaxPrice(initialMaxPrice);
  }, [initialMaxPrice, initialMinPrice, open]);

  const hasUnclaimedFees = unclaimedFees0 > 0n || unclaimedFees1 > 0n;
  const isPending =
    claimRewardsMutation.isPending || supplyLiquidityMutation.isPending || decreaseLiquidityMutation.isPending;

  const handleClaimFees = async (): Promise<void> => {
    if (!spokeProvider) {
      setError('Wallet is not connected to this chain.');
      return;
    }
    if (isWrongChain) {
      await handleSwitchChain();
      return;
    }
    setError('');
    setSuccessMessage('');
    try {
      await claimRewardsMutation.mutateAsync({
        params: {
          poolKey,
          tokenId: BigInt(tokenId),
          tickLower: BigInt(positionInfo.tickLower),
          tickUpper: BigInt(positionInfo.tickUpper),
        },
        spokeProvider,
      });
      setSuccessMessage('Fee claim submitted.');
    } catch (claimError) {
      const message = claimError instanceof Error ? claimError.message : 'Fee claim failed.';
      setError(message);
    }
  };

  const handleAddLiquidity = async (): Promise<void> => {
    if (!spokeProvider) {
      setError('Wallet is not connected to this chain.');
      return;
    }
    if (isWrongChain) {
      await handleSwitchChain();
      return;
    }
    const minPriceNumber = Number.parseFloat(minPrice);
    const maxPriceNumber = Number.parseFloat(maxPrice);
    const amount0 = Number.parseFloat(liquidityToken0Amount);
    const amount1 = Number.parseFloat(liquidityToken1Amount);
    if (!Number.isFinite(minPriceNumber) || !Number.isFinite(maxPriceNumber) || minPriceNumber >= maxPriceNumber) {
      setError('Enter a valid price range where min price is less than max price.');
      return;
    }
    if (!(amount0 > 0) || !(amount1 > 0)) {
      setError('Enter valid token amounts to add liquidity.');
      return;
    }

    setError('');
    setSuccessMessage('');
    try {
      await supplyLiquidityMutation.mutateAsync({
        params: createSupplyLiquidityParamsProps({
          poolData,
          poolKey,
          minPrice,
          maxPrice,
          liquidityToken0Amount,
          liquidityToken1Amount,
          slippageTolerance,
          positionId: tokenId,
          isValidPosition: true,
        }),
        spokeProvider,
      });
      setSuccessMessage('Add liquidity transaction submitted.');
      setLiquidityToken0Amount('');
      setLiquidityToken1Amount('');
    } catch (supplyError) {
      const message = supplyError instanceof Error ? supplyError.message : 'Add liquidity failed.';
      setError(message);
    }
  };

  const handleWithdrawLiquidity = async (): Promise<void> => {
    if (!spokeProvider) {
      setError('Wallet is not connected to this chain.');
      return;
    }
    if (isWrongChain) {
      await handleSwitchChain();
      return;
    }
    const parsedPercentage = Number.parseFloat(withdrawPercentage);
    if (!(parsedPercentage > 0) || parsedPercentage > 100) {
      setError('Withdraw percentage must be between 0 and 100.');
      return;
    }

    setError('');
    setSuccessMessage('');
    try {
      await decreaseLiquidityMutation.mutateAsync({
        params: createDecreaseLiquidityParamsProps({
          poolKey,
          tokenId,
          percentage: parsedPercentage,
          positionInfo,
          slippageTolerance,
        }),
        spokeProvider,
      });
      setSuccessMessage('Withdraw liquidity transaction submitted.');
    } catch (withdrawError) {
      const message = withdrawError instanceof Error ? withdrawError.message : 'Withdraw liquidity failed.';
      setError(message);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-120 h-106 p-12" hideCloseButton={true}>
        <Tabs value={activeTab} onValueChange={value => setActiveTab(value as 'claim' | 'add' | 'withdraw')}>
          <div className="flex justify-between items-center">
            <TabsList className="flex bg-transparent gap-4">
              <TabsTrigger value="claim" className="text-clay hover:text-espresso shadow-none! data-[state=active]:text-espresso! cursor-pointer p-0 text-(length:--body-small) gap-1">
                  <CircleEllipsisIcon className={activeTab === 'claim' ? 'text-espresso' : 'text-clay-light'} size={14} /> Fee
              </TabsTrigger>
              <TabsTrigger value="add" className="text-clay hover:text-espresso shadow-none! data-[state=active]:text-espresso! cursor-pointer p-0 text-(length:--body-small) gap-1">
                  <PlusCircleIcon className={activeTab === 'add' ? 'text-espresso' : 'text-clay-light'} size={14} /> Add Liquidity
              </TabsTrigger>
              <TabsTrigger value="withdraw" className="text-clay hover:text-espresso shadow-none! data-[state=active]:text-espresso! cursor-pointer p-0 text-(length:--body-small) gap-1">
                  <MinusCircleIcon className={activeTab === 'withdraw' ? 'text-espresso' : 'text-clay-light'} size={14} /> Withdraw
              </TabsTrigger>
            </TabsList>
            <XIcon
              className="w-4 h-4 cursor-pointer text-clay-light hover:text-clay"
              onClick={() => onOpenChange(false)}
            />
          </div>
          <ClaimTabContent
            hasUnclaimedFees={hasUnclaimedFees}
            isPending={isPending}
            isClaimPending={claimRewardsMutation.isPending}
            onClaimFees={() => void handleClaimFees()}
          />
          <AddLiquidityTabContent
            tokenId={tokenId}
            poolData={poolData}
            minPrice={minPrice}
            maxPrice={maxPrice}
            liquidityToken0Amount={liquidityToken0Amount}
            liquidityToken1Amount={liquidityToken1Amount}
            slippageTolerance={slippageTolerance}
            isPending={isPending}
            isSupplyPending={supplyLiquidityMutation.isPending}
            onMinPriceChange={setMinPrice}
            onMaxPriceChange={setMaxPrice}
            onToken0AmountChange={setLiquidityToken0Amount}
            onToken1AmountChange={setLiquidityToken1Amount}
            onSlippageChange={setSlippageTolerance}
            onAddLiquidity={() => void handleAddLiquidity()}
          />
          <WithdrawTabContent
            tokenId={tokenId}
            withdrawPercentage={withdrawPercentage}
            slippageTolerance={slippageTolerance}
            isPending={isPending}
            isWithdrawPending={decreaseLiquidityMutation.isPending}
            onWithdrawPercentageChange={setWithdrawPercentage}
            onSlippageChange={setSlippageTolerance}
            onWithdrawLiquidity={() => void handleWithdrawLiquidity()}
          />
        </Tabs>
        {isWrongChain ? (
          <Button variant="outline" onClick={() => void handleSwitchChain()} disabled={isPending}>
            Switch Network
          </Button>
        ) : null}
        {error ? <p className="text-sm text-cherry-bright">{error}</p> : null}
        {successMessage ? <p className="text-sm text-green-600">{successMessage}</p> : null}
      </DialogContent>
    </Dialog>
  );
}
