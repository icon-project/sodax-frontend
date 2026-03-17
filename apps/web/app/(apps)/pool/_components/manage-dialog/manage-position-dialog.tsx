'use client';

import type React from 'react';
import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  createDecreaseLiquidityParamsProps,
  useClaimRewards,
  useDecreaseLiquidity,
  useLiquidityAmounts,
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
import { formatUnits, parseUnits } from 'viem';

type ManagePositionDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  tokenId: string;
  poolKey: PoolKey;
  poolData: PoolData;
  chainId: string;
  unclaimedFees0: bigint;
  unclaimedFees1: bigint;
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
  initialMinPrice,
  initialMaxPrice,
  positionInfo,
}: ManagePositionDialogProps): React.JSX.Element {
  const [activeTab, setActiveTab] = useState<'claim' | 'add' | 'withdraw'>('claim');
  const [minPrice, setMinPrice] = useState<string>(initialMinPrice);
  const [maxPrice, setMaxPrice] = useState<string>(initialMaxPrice);
  const [sodaInputAmount, setSodaInputAmount] = useState<string>('');
  const [lastEditedAmount, setLastEditedAmount] = useState<'soda' | 'xsoda' | null>(null);
  const [slippageTolerance, setSlippageTolerance] = useState<string>('0.5');
  const [withdrawPercentage, setWithdrawPercentage] = useState<string>('0');
  const [, setError] = useState<string>('');
  const spokeChainId = resolveSpokeChainId(chainId);
  const walletProvider = useWalletProvider(spokeChainId);
  const spokeProvider = useSpokeProvider(spokeChainId, walletProvider);
  const { isWrongChain, handleSwitchChain } = useEvmSwitchChain(spokeChainId);
  const { liquidityToken0Amount, liquidityToken1Amount, handleToken0AmountChange, handleToken1AmountChange } =
    useLiquidityAmounts(minPrice, maxPrice, poolData);
  const claimRewardsMutation = useClaimRewards();
  const supplyLiquidityMutation = useSupplyLiquidity();
  const decreaseLiquidityMutation = useDecreaseLiquidity();
  const convertSodaToPoolTokenAmount = useCallback(
    (underlyingAmount: string): string => {
      if (underlyingAmount.trim() === '' || !poolData.token0IsStatAToken || !poolData.token0ConversionRate) {
        return underlyingAmount;
      }

      try {
        const underlyingDecimals = poolData.token0UnderlyingToken?.decimals ?? 18;
        const underlyingRawAmount = parseUnits(underlyingAmount, underlyingDecimals);
        const wrappedRawAmount = (underlyingRawAmount * 10n ** 18n) / poolData.token0ConversionRate;

        return formatUnits(wrappedRawAmount, poolData.token0.decimals);
      } catch {
        return underlyingAmount;
      }
    },
    [poolData],
  );
  const convertPoolTokenToSodaAmount = useCallback(
    (wrappedAmount: string): string => {
      if (wrappedAmount.trim() === '' || !poolData.token0IsStatAToken || !poolData.token0ConversionRate) {
        return wrappedAmount;
      }

      try {
        const underlyingDecimals = poolData.token0UnderlyingToken?.decimals ?? 18;
        const wrappedRawAmount = parseUnits(wrappedAmount, poolData.token0.decimals);
        const underlyingRawAmount = (wrappedRawAmount * poolData.token0ConversionRate) / 10n ** 18n;

        return formatUnits(underlyingRawAmount, underlyingDecimals);
      } catch {
        return wrappedAmount;
      }
    },
    [poolData],
  );
  const displaySodaAmount = useMemo((): string => {
    if (lastEditedAmount === 'soda') {
      return sodaInputAmount;
    }
    return convertPoolTokenToSodaAmount(liquidityToken0Amount);
  }, [convertPoolTokenToSodaAmount, lastEditedAmount, liquidityToken0Amount, sodaInputAmount]);

  const handleSodaAmountChange = useCallback(
    (value: string): void => {
      setLastEditedAmount('soda');
      setSodaInputAmount(value);
      handleToken0AmountChange(convertSodaToPoolTokenAmount(value));
    },
    [convertSodaToPoolTokenAmount, handleToken0AmountChange],
  );
  const handleXSodaAmountChange = useCallback(
    (value: string): void => {
      setLastEditedAmount('xsoda');
      handleToken1AmountChange(value);
    },
    [handleToken1AmountChange],
  );

  useEffect((): void => {
    if (!open) {
      return;
    }
    setError('');
    setActiveTab('claim');
    setMinPrice(initialMinPrice);
    setMaxPrice(initialMaxPrice);
    setLastEditedAmount(null);
    setSodaInputAmount('');
    handleToken0AmountChange('');
    handleToken1AmountChange('');
  }, [handleToken0AmountChange, handleToken1AmountChange, initialMaxPrice, initialMinPrice, open]);

  useEffect((): void => {
    if (lastEditedAmount !== 'soda') {
      setSodaInputAmount(convertPoolTokenToSodaAmount(liquidityToken0Amount));
    }
  }, [convertPoolTokenToSodaAmount, lastEditedAmount, liquidityToken0Amount]);

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
    console.log(minPriceNumber, maxPriceNumber);
    console.log(amount0, amount1);
    if (!Number.isFinite(minPriceNumber) || !Number.isFinite(maxPriceNumber) || minPriceNumber >= maxPriceNumber) {
      setError('Enter a valid price range where min price is less than max price.');
      return;
    }
    if (!(amount0 > 0) || !(amount1 > 0)) {
      setError('Enter valid token amounts to add liquidity.');
      return;
    }

    // setError('');
    // try {
    //   await supplyLiquidityMutation.mutateAsync({
    //     params: createSupplyLiquidityParamsProps({
    //       poolData,
    //       poolKey,
    //       minPrice,
    //       maxPrice,
    //       liquidityToken0Amount,
    //       liquidityToken1Amount,
    //       slippageTolerance,
    //       positionId: tokenId,
    //       isValidPosition: true,
    //     }),
    //     spokeProvider,
    //   });
    //   setLastEditedAmount(null);
    //   handleToken0AmountChange('');
    //   handleToken1AmountChange('');
    //   setSodaInputAmount('');
    // } catch (supplyError) {
    //   const message = supplyError instanceof Error ? supplyError.message : 'Add liquidity failed.';
    //   setError(message);
    // }
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
            <TabsList className="flex bg-transparent gap-4 p-0 h-4">
              <TabsTrigger
                value="claim"
                className="text-clay hover:text-espresso shadow-none! data-[state=active]:text-espresso! cursor-pointer p-0 text-(length:--body-small) gap-1"
              >
                <CircleEllipsisIcon className={activeTab === 'claim' ? 'text-espresso' : 'text-clay-light'} size={14} />{' '}
                Fee
              </TabsTrigger>
              <TabsTrigger
                value="add"
                className="text-clay hover:text-espresso shadow-none! data-[state=active]:text-espresso! cursor-pointer p-0 text-(length:--body-small) gap-1"
              >
                <PlusCircleIcon className={activeTab === 'add' ? 'text-espresso' : 'text-clay-light'} size={14} /> Add
                Liquidity
              </TabsTrigger>
              <TabsTrigger
                value="withdraw"
                className="text-clay hover:text-espresso shadow-none! data-[state=active]:text-espresso! cursor-pointer p-0 text-(length:--body-small) gap-1"
              >
                <MinusCircleIcon className={activeTab === 'withdraw' ? 'text-espresso' : 'text-clay-light'} size={14} />{' '}
                Withdraw
              </TabsTrigger>
            </TabsList>
            <XIcon
              className="w-4 h-4 cursor-pointer text-clay-light hover:text-clay"
              onClick={() => onOpenChange(false)}
            />
          </div>
          {/* {error ? (
            <div className="mt-4 flex flex-col text-center">
              <div className="flex justify-center gap-1 w-full items-center">
                <ShieldAlertIcon className="w-4 h-4 text-negative" />
                <span className="font-bold text-(length:--body-super-comfortable) leading-[1.4] text-negative">
                  Transaction failed
                </span>
              </div>
              <div className="text-espresso text-(length:--body-small) text-center leading-[1.4]">{error}</div>
            </div>
          ) : null} */}
          <ClaimTabContent
            chainId={spokeChainId}
            hasUnclaimedFees={hasUnclaimedFees}
            unclaimedFees0={unclaimedFees0}
            unclaimedFees1={unclaimedFees1}
            isPending={isPending}
            isClaimPending={claimRewardsMutation.isPending}
            onClaimFees={() => void handleClaimFees()}
          />
          <AddLiquidityTabContent
            chainId={spokeChainId}
            tokenId={tokenId}
            poolData={poolData}
            minPrice={minPrice}
            maxPrice={maxPrice}
            liquidityToken0Amount={displaySodaAmount}
            liquidityToken1Amount={liquidityToken1Amount}
            slippageTolerance={slippageTolerance}
            isPending={isPending}
            isSupplyPending={supplyLiquidityMutation.isPending}
            onMinPriceChange={setMinPrice}
            onMaxPriceChange={setMaxPrice}
            onToken0AmountChange={handleSodaAmountChange}
            onToken1AmountChange={handleXSodaAmountChange}
            onSlippageChange={setSlippageTolerance}
            onAddLiquidity={() => void handleAddLiquidity()}
          />
          <WithdrawTabContent
            chainId={spokeChainId}
            poolData={poolData}
            positionInfo={positionInfo}
            withdrawPercentage={withdrawPercentage}
            isPending={isPending}
            isWithdrawPending={decreaseLiquidityMutation.isPending}
            onWithdrawPercentageChange={setWithdrawPercentage}
            onWithdrawLiquidity={() => void handleWithdrawLiquidity()}
          />
        </Tabs>
        {isWrongChain ? (
          <Button variant="outline" onClick={() => void handleSwitchChain()} disabled={isPending}>
            Switch Network
          </Button>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}
