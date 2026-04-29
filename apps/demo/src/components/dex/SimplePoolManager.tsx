// apps/demo/src/components/dex/SimplePoolManager.tsx
import React, { useState, useEffect, type JSX } from 'react';
import { AlertCircle } from 'lucide-react';
import { useEvmSwitchChain, useWalletProvider, useXAccount, useXDisconnect } from '@sodax/wallet-sdk-react';
import { useAppStore } from '@/zustand/useAppStore';
import { Setup } from './Setup';
import { SelectPool } from './SelectPool';
import { PoolInformation } from './PoolInformation';
import { ManageLiquidity } from './ManageLiquidity';
import {
  usePools,
  usePoolData,
  usePoolBalances,
  usePositionInfo,
  useLiquidityAmounts,
  useSupplyLiquidity,
  useDecreaseLiquidity,
  createDecreaseLiquidityParamsProps,
  createSupplyLiquidityParamsProps,
  useSodaxContext,
} from '@sodax/dapp-kit';
import type { Hash } from '@sodax/types';
import { saveTokenIdToLocalStorage } from '@/lib/utils';

export function SimplePoolManager(): JSX.Element {
  const { sodax } = useSodaxContext();
  const { openWalletModal, selectedChainId, selectChainId } = useAppStore();
  const { isWrongChain, handleSwitchChain } = useEvmSwitchChain(selectedChainId);
  const xAccount = useXAccount(selectedChainId);
  const disconnect = useXDisconnect();
  const walletProvider = useWalletProvider(selectedChainId);
  const srcAddress = xAccount?.address as `0x${string}` | undefined;

  const { data: pools = [] } = usePools();
  const [selectedPoolIndex, setSelectedPoolIndex] = useState<number>(-1);
  const selectedPoolKey = selectedPoolIndex >= 0 && pools[selectedPoolIndex] ? pools[selectedPoolIndex] : null;
  const {
    data: poolDataRaw,
    isLoading: isLoadingPoolData,
    error: poolDataError,
  } = usePoolData({ poolKey: selectedPoolKey || null });
  const poolData = poolDataRaw ?? null;

  const { data: balances } = usePoolBalances({
    poolData,
    poolKey: selectedPoolKey || null,
    spokeChainKey: selectedChainId,
    userAddress: srcAddress,
  });
  const token0Balance = balances?.token0Balance ?? 0n;
  const token1Balance = balances?.token1Balance ?? 0n;

  const [minPrice, setMinPrice] = useState<string>('');
  const [maxPrice, setMaxPrice] = useState<string>('');
  const [slippageTolerance, setSlippageTolerance] = useState<string>('0.5');

  const {
    liquidityToken0Amount,
    liquidityToken1Amount,
    handleToken0AmountChange,
    handleToken1AmountChange,
    setLiquidityToken0Amount,
    setLiquidityToken1Amount,
  } = useLiquidityAmounts(minPrice, maxPrice, poolData);

  const [positionId, setPositionId] = useState<string>('');
  const { data: positionData } = usePositionInfo({
    tokenId: positionId || null,
    poolKey: selectedPoolKey || null,
  });
  const positionInfo = positionData?.positionInfo ?? null;
  const isValidPosition = positionData?.isValid ?? false;

  const [error, setError] = useState<string>('');

  // biome-ignore lint/correctness/useExhaustiveDependencies: setter functions are stable
  useEffect(() => {
    setSelectedPoolIndex(-1);
  }, [selectedChainId]);

  useEffect(() => {
    if (positionInfo && isValidPosition) {
      const minPriceNum = Number(positionInfo.tickLowerPrice.toSignificant(6));
      const maxPriceNum = Number(positionInfo.tickUpperPrice.toSignificant(6));
      setMinPrice(minPriceNum.toString());
      setMaxPrice(maxPriceNum.toString());
      setError('');
    } else if (positionId && positionData && !isValidPosition) {
      setError('Position does not belong to the selected pool');
    } else if (positionId && !positionData) {
      setError('Invalid position ID or position not found');
    }
  }, [positionInfo, isValidPosition, positionId, positionData]);

  useEffect(() => {
    if (poolDataError) {
      setError(`Failed to load pool data: ${poolDataError.message}`);
    }
  }, [poolDataError]);

  const supplyLiquidityMutation = useSupplyLiquidity();
  const decreaseLiquidityMutation = useDecreaseLiquidity();

  const loading = isLoadingPoolData || supplyLiquidityMutation.isPending || decreaseLiquidityMutation.isPending;

  const handleSupplyLiquidity = async (): Promise<void> => {
    if (!poolData || !walletProvider || !selectedPoolKey || !srcAddress) {
      setError('Please ensure wallet is connected and services are initialized');
      return;
    }

    if (!minPrice || !maxPrice || !liquidityToken0Amount || !liquidityToken1Amount) {
      setError('Please enter all required values');
      return;
    }

    const minPriceNum = Number.parseFloat(minPrice);
    const maxPriceNum = Number.parseFloat(maxPrice);
    const amount0 = Number.parseFloat(liquidityToken0Amount);
    const amount1 = Number.parseFloat(liquidityToken1Amount);

    if (minPriceNum <= 0 || maxPriceNum <= 0 || amount0 <= 0 || amount1 <= 0) {
      setError('All values must be greater than 0');
      return;
    }

    if (minPriceNum >= maxPriceNum) {
      setError('Min price must be less than max price');
      return;
    }

    setError('');

    try {
      const supplyParamsCore = createSupplyLiquidityParamsProps({
        poolData,
        poolKey: selectedPoolKey,
        minPrice,
        maxPrice,
        liquidityToken0Amount,
        liquidityToken1Amount,
        slippageTolerance,
        positionId: positionId || null,
        isValidPosition,
      });

      const result = await supplyLiquidityMutation.mutateAsync({
        params: { ...supplyParamsCore, srcChainKey: selectedChainId, srcAddress },
        walletProvider,
      });

      if (!result.ok) {
        setError(`Supply liquidity failed: ${result.error instanceof Error ? result.error.message : 'Unknown error'}`);
        return;
      }

      const [, hubTxHash] = result.value;
      const mintPositionEvent = await sodax.dex.clService.getMintPositionEvent(hubTxHash as Hash);
      saveTokenIdToLocalStorage(srcAddress, selectedChainId, mintPositionEvent.tokenId.toString());

      setMinPrice('');
      setMaxPrice('');
      setLiquidityToken0Amount('');
      setLiquidityToken1Amount('');
      setError('');
    } catch (err) {
      console.error('Supply liquidity failed:', err);
      setError(`Supply liquidity failed: ${err instanceof Error ? err.message : 'Unknown error'}`);
    }
  };

  const handleDecreaseLiquidity = async (): Promise<void> => {
    if (
      !poolData ||
      !walletProvider ||
      !selectedPoolKey ||
      !positionId ||
      !isValidPosition ||
      !positionInfo ||
      !srcAddress
    ) {
      setError('Please enter a valid position ID first');
      return;
    }

    if (!liquidityToken0Amount) {
      setError('Please enter percentage to decrease (0-100)');
      return;
    }

    const percentage = Number.parseFloat(liquidityToken0Amount);

    if (percentage <= 0 || percentage > 100) {
      setError('Percentage must be between 0 and 100');
      return;
    }

    setError('');

    try {
      const decreaseParamsCore = createDecreaseLiquidityParamsProps({
        poolKey: selectedPoolKey,
        tokenId: positionId,
        percentage: liquidityToken0Amount,
        positionInfo,
        slippageTolerance,
      });

      const result = await decreaseLiquidityMutation.mutateAsync({
        params: { ...decreaseParamsCore, srcChainKey: selectedChainId, srcAddress },
        walletProvider,
      });

      if (!result.ok) {
        setError(
          `Decrease liquidity failed: ${result.error instanceof Error ? result.error.message : 'Unknown error'}`,
        );
        return;
      }

      setLiquidityToken0Amount('');
      setLiquidityToken1Amount('');
      setError('');
    } catch (err) {
      console.error('Decrease liquidity failed:', err);
      setError(`Decrease liquidity failed: ${err instanceof Error ? err.message : 'Unknown error'}`);
    }
  };

  const formatAmount = (amount: bigint, decimals: number): string => {
    return (Number(amount) / 10 ** decimals).toFixed(6);
  };

  const formatConversionRate = (rate: bigint): string => {
    return (Number(rate) / 10 ** 18).toFixed(6);
  };

  const calculateUnderlyingAmount = (wrappedAmount: bigint, conversionRate: bigint, decimals: number): string => {
    const underlying = (wrappedAmount * conversionRate) / BigInt(10 ** 18);
    return formatAmount(underlying, decimals);
  };

  // Wrapper handlers for ManageLiquidity component
  const handlePositionIdChange = (value: string): void => {
    setPositionId(value);
  };

  const handleClearPosition = (): void => {
    setPositionId('');
    setMinPrice('');
    setMaxPrice('');
  };

  return (
    <div className="space-y-6">
      <Setup
        selectedChainId={selectedChainId}
        selectChainId={selectChainId}
        isWrongChain={isWrongChain}
        handleSwitchChain={handleSwitchChain}
        xAccount={xAccount}
        openWalletModal={openWalletModal}
        disconnect={disconnect}
      />
      {!isWrongChain && (
        <SelectPool
          selectedChainId={selectedChainId}
          pools={pools}
          selectedPoolIndex={selectedPoolIndex}
          onPoolSelect={setSelectedPoolIndex}
          loading={loading}
        />
      )}
      {!isWrongChain && (
        <PoolInformation poolData={poolData} formatAmount={formatAmount} formatConversionRate={formatConversionRate} />
      )}
      {!isWrongChain && poolData && walletProvider && xAccount && selectedPoolKey && selectedChainId && (
        <ManageLiquidity
          poolData={poolData}
          xAccount={xAccount}
          walletProvider={walletProvider}
          pools={pools}
          selectedPoolIndex={selectedPoolIndex}
          token0Balance={token0Balance}
          token1Balance={token1Balance}
          minPrice={minPrice}
          maxPrice={maxPrice}
          liquidityToken0Amount={liquidityToken0Amount}
          liquidityToken1Amount={liquidityToken1Amount}
          slippageTolerance={slippageTolerance}
          positionId={positionId}
          positionInfo={positionInfo}
          isValidPosition={isValidPosition}
          onLiquidityToken0AmountChange={handleToken0AmountChange}
          onLiquidityToken1AmountChange={handleToken1AmountChange}
          onMinPriceChange={setMinPrice}
          onMaxPriceChange={setMaxPrice}
          onSlippageToleranceChange={setSlippageTolerance}
          onPositionIdChange={handlePositionIdChange}
          onClearPosition={handleClearPosition}
          onSupplyLiquidity={handleSupplyLiquidity}
          onDecreaseLiquidity={handleDecreaseLiquidity}
          formatAmount={formatAmount}
          calculateUnderlyingAmount={calculateUnderlyingAmount}
          selectedPoolKey={selectedPoolKey}
          selectedChainId={selectedChainId}
        />
      )}
      {/* Error Display */}
      {error && (
        <div className="flex items-start gap-3 rounded-lg border border-destructive bg-destructive/10 p-4 text-sm text-destructive">
          <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
          <div className="flex-1">{error}</div>
        </div>
      )}
    </div>
  );
}
