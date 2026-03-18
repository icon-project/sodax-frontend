'use client';

import type React from 'react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  createDepositParamsProps,
  createSupplyLiquidityParamsProps,
  createWithdrawParamsProps,
  useClaimRewards,
  useDexApprove,
  useDexDeposit,
  useDexWithdraw,
  useLiquidityAmounts,
  useSodaxContext,
  useSpokeProvider,
  useSupplyLiquidity,
} from '@sodax/dapp-kit';
import { spokeChainConfig } from '@sodax/sdk';
import type { ClPositionInfo, PoolData, PoolKey, PoolSpokeAssets } from '@sodax/sdk';
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

const MAX_WITHDRAW_PERCENTAGE = 100;
const PERCENTAGE_BASIS_POINTS = 10000n;
const CLAIM_REQUEST_TIMEOUT_MS = 15_000;

function toBasisPoints(percentage: number): bigint {
  const clampedPercentage = Math.min(Math.max(percentage, 0), MAX_WITHDRAW_PERCENTAGE);
  if (clampedPercentage === MAX_WITHDRAW_PERCENTAGE) {
    return PERCENTAGE_BASIS_POINTS;
  }
  return BigInt(Math.floor(clampedPercentage * 100));
}

function calculateProportionalAmount(amount: bigint, percentageBasisPoints: bigint): bigint {
  if (percentageBasisPoints >= PERCENTAGE_BASIS_POINTS) {
    return amount;
  }
  return (amount * percentageBasisPoints) / PERCENTAGE_BASIS_POINTS;
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
  const { sodax } = useSodaxContext();
  const wasOpenRef = useRef<boolean>(open);
  const [activeTab, setActiveTab] = useState<'claim' | 'add' | 'withdraw'>('claim');
  const [minPrice, setMinPrice] = useState<string>(initialMinPrice);
  const [maxPrice, setMaxPrice] = useState<string>(initialMaxPrice);
  const [sodaInputAmount, setSodaInputAmount] = useState<string>('');
  const [lastEditedAmount, setLastEditedAmount] = useState<'soda' | 'xsoda' | null>(null);
  const [withdrawPercentage, setWithdrawPercentage] = useState<string>('0');
  const [addLiquidityError, setAddLiquidityError] = useState<string>('');
  const [withdrawError, setWithdrawError] = useState<string>('');
  const [claimError, setClaimError] = useState<string>('');
  const [isClaimActionPending, setIsClaimActionPending] = useState<boolean>(false);
  const spokeChainId = resolveSpokeChainId(chainId);
  const walletProvider = useWalletProvider(spokeChainId);
  const spokeProvider = useSpokeProvider(spokeChainId, walletProvider);
  const { isWrongChain, handleSwitchChain } = useEvmSwitchChain(spokeChainId);
  const { liquidityToken0Amount, liquidityToken1Amount, handleToken0AmountChange, handleToken1AmountChange } =
    useLiquidityAmounts(minPrice, maxPrice, poolData);
  const claimRewardsMutation = useClaimRewards();
  const approveMutation = useDexApprove();
  const supplyLiquidityMutation = useSupplyLiquidity();
  const withdrawMutation = useDexWithdraw();
  const poolSpokeAssets = useMemo((): PoolSpokeAssets | null => {
    if (!spokeProvider) {
      return null;
    }
    try {
      return sodax.dex.clService.getAssetsForPool(spokeProvider, poolKey);
    } catch {
      return null;
    }
  }, [poolKey, sodax, spokeProvider]);
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
    if (open && !wasOpenRef.current) {
      setClaimError('');
      setIsClaimActionPending(false);
      setAddLiquidityError('');
      setWithdrawError('');
      setActiveTab('claim');
      setMinPrice(initialMinPrice);
      setMaxPrice(initialMaxPrice);
      setLastEditedAmount(null);
      setSodaInputAmount('');
      handleToken0AmountChange('');
      handleToken1AmountChange('');
    }

    wasOpenRef.current = open;
  }, [handleToken0AmountChange, handleToken1AmountChange, initialMaxPrice, initialMinPrice, open]);

  useEffect((): void => {
    if (lastEditedAmount !== 'soda') {
      setSodaInputAmount(convertPoolTokenToSodaAmount(liquidityToken0Amount));
    }
  }, [convertPoolTokenToSodaAmount, lastEditedAmount, liquidityToken0Amount]);

  const hasUnclaimedFees = unclaimedFees0 > 0n || unclaimedFees1 > 0n;
  const isPending =
    isClaimActionPending ||
    approveMutation.isPending ||
    supplyLiquidityMutation.isPending ||
    withdrawMutation.isPending;
  const claimErrorMessage =
    claimError || (claimRewardsMutation.error instanceof Error ? claimRewardsMutation.error.message : '');

  const handleClaimFees = async (): Promise<void> => {
    if (!spokeProvider) {
      setClaimError('Wallet is not connected to this chain.');
      return;
    }
    if (isWrongChain) {
      await handleSwitchChain();
      return;
    }
    if (isClaimActionPending) {
      return;
    }
    setClaimError('');
    setIsClaimActionPending(true);

    const timeoutErrorMessage = 'Claim request timed out. Please check your wallet and try again.';
    let timeoutId: ReturnType<typeof setTimeout> | undefined;
    try {
      await Promise.race([
        claimRewardsMutation.mutateAsync({
          params: {
            poolKey,
            tokenId: BigInt(tokenId),
            tickLower: BigInt(positionInfo.tickLower),
            tickUpper: BigInt(positionInfo.tickUpper),
          },
          spokeProvider,
        }),
        new Promise<never>((_, reject): void => {
          timeoutId = setTimeout((): void => {
            reject(new Error(timeoutErrorMessage));
          }, CLAIM_REQUEST_TIMEOUT_MS);
        }),
      ]);
    } catch (claimErr) {
      const message = claimErr instanceof Error ? claimErr.message : 'Claim fee failed.';
      setClaimError(message);
    } finally {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
      setIsClaimActionPending(false);
    }
  };

  const handleAddLiquidity = async (): Promise<void> => {
    if (!spokeProvider) {
      setAddLiquidityError('Wallet is not connected to this chain.');
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
      setAddLiquidityError('Enter a valid price range where min price is less than max price.');
      return;
    }
    if (!(amount0 > 0) || !(amount1 > 0)) {
      setAddLiquidityError('Enter valid token amounts to add liquidity.');
      return;
    }
    if (!poolSpokeAssets) {
      setAddLiquidityError('Pool assets are unavailable for this network.');
      return;
    }

    setAddLiquidityError('');

    try {
      await supplyLiquidityMutation.mutateAsync({
        params: createSupplyLiquidityParamsProps({
          poolData,
          poolKey,
          minPrice,
          maxPrice,
          liquidityToken0Amount,
          liquidityToken1Amount,
          slippageTolerance: '0.5',
          positionId: tokenId,
          isValidPosition: true,
        }),
        spokeProvider,
      });
      setLastEditedAmount(null);
      handleToken0AmountChange('');
      handleToken1AmountChange('');
      setSodaInputAmount('');
    } catch (supplyError) {
      const message = supplyError instanceof Error ? supplyError.message : 'Add liquidity failed.';
      setAddLiquidityError(message);
    }
  };

  const handleWithdrawLiquidity = async (): Promise<void> => {
    if (!spokeProvider) {
      setWithdrawError('Wallet is not connected to this chain.');
      return;
    }
    if (isWrongChain) {
      await handleSwitchChain();
      return;
    }
    setWithdrawError('');
    const parsedPercentage = Number.parseFloat(withdrawPercentage);
    if (!(parsedPercentage > 0) || parsedPercentage > 100) {
      return;
    }
    if (!poolSpokeAssets) {
      return;
    }

    const withdrawBasisPoints = toBasisPoints(parsedPercentage);
    const token0WithdrawAmount = calculateProportionalAmount(positionInfo.amount0, withdrawBasisPoints);
    const token1WithdrawAmount = calculateProportionalAmount(positionInfo.amount1, withdrawBasisPoints);

    if (token0WithdrawAmount <= 0n && token1WithdrawAmount <= 0n) {
      return;
    }

    try {
      if (token0WithdrawAmount > 0n) {
        await withdrawMutation.mutateAsync({
          params: createWithdrawParamsProps({
            tokenIndex: 0,
            amount: formatUnits(token0WithdrawAmount, poolData.token0.decimals),
            poolData,
            poolSpokeAssets,
          }),
          spokeProvider,
        });
      }
      if (token1WithdrawAmount > 0n) {
        await withdrawMutation.mutateAsync({
          params: createWithdrawParamsProps({
            tokenIndex: 1,
            amount: formatUnits(token1WithdrawAmount, poolData.token1.decimals),
            poolData,
            poolSpokeAssets,
          }),
          spokeProvider,
        });
      }
    } catch (withdrawErr) {
      const message = withdrawErr instanceof Error ? withdrawErr.message : 'Withdraw failed.';
      setWithdrawError(message);
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

          <ClaimTabContent
            chainId={spokeChainId}
            hasUnclaimedFees={hasUnclaimedFees}
            unclaimedFees0={unclaimedFees0}
            unclaimedFees1={unclaimedFees1}
            error={claimErrorMessage}
            isPending={isPending}
            isClaimPending={isClaimActionPending}
            onClaimFees={() => void handleClaimFees()}
          />
          <AddLiquidityTabContent
            chainId={spokeChainId}
            tokenId={tokenId}
            poolData={poolData}
            liquidityToken0Amount={displaySodaAmount}
            liquidityToken1Amount={liquidityToken1Amount}
            isPending={isPending}
            isSupplyPending={supplyLiquidityMutation.isPending}
            error={addLiquidityError}
            onToken0AmountChange={handleSodaAmountChange}
            onToken1AmountChange={handleXSodaAmountChange}
            onAddLiquidity={() => void handleAddLiquidity()}
          />
          <WithdrawTabContent
            chainId={spokeChainId}
            poolData={poolData}
            positionInfo={positionInfo}
            withdrawPercentage={withdrawPercentage}
            isPending={isPending}
            isWithdrawPending={withdrawMutation.isPending}
            error={withdrawError}
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
