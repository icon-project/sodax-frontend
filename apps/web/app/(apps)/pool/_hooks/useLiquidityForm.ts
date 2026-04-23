'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { formatUnits, parseUnits } from 'viem';
import type { PoolData } from '@sodax/sdk';
import { useLiquidityAmounts } from '@sodax/dapp-kit';
import { usePoolActions, usePoolState } from '../_stores/pool-store-provider';
import { usePoolContext } from './usePoolContext';

type LastEditedAmount = 'soda' | 'xsoda' | null;

export type LiquidityForm = {
  sodaAmount: string;
  xSodaAmount: string;
  handleSodaAmountChange: (value: string) => void;
  handleXSodaAmountChange: (value: string) => void;
};

function convertUnderlyingToPoolToken(underlyingAmount: string, poolData: PoolData | null): string {
  if (underlyingAmount.trim() === '' || !poolData?.token0IsStatAToken || !poolData.token0ConversionRate) {
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
}

function convertPoolTokenToUnderlying(wrappedAmount: string, poolData: PoolData | null): string {
  if (wrappedAmount.trim() === '' || !poolData?.token0IsStatAToken || !poolData.token0ConversionRate) {
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
}

export function useLiquidityForm(): LiquidityForm {
  const { minPrice, maxPrice } = usePoolState();
  const { setSodaAmount, setXSodaAmount } = usePoolActions();
  const { poolData } = usePoolContext();

  const [sodaInputAmount, setSodaInputAmount] = useState<string>('');
  const [lastEditedAmount, setLastEditedAmount] = useState<LastEditedAmount>(null);

  const { liquidityToken0Amount, liquidityToken1Amount, handleToken0AmountChange, handleToken1AmountChange } =
    useLiquidityAmounts(minPrice.toString(), maxPrice.toString(), poolData);

  const convertedSodaAmount = useMemo(
    (): string => convertPoolTokenToUnderlying(liquidityToken0Amount, poolData),
    [liquidityToken0Amount, poolData],
  );

  const handleSodaAmountChange = useCallback(
    (value: string): void => {
      setLastEditedAmount('soda');
      setSodaInputAmount(value);
      const poolTokenAmount = convertUnderlyingToPoolToken(value, poolData);
      handleToken0AmountChange(poolTokenAmount);
    },
    [handleToken0AmountChange, poolData],
  );

  const handleXSodaAmountChange = useCallback(
    (value: string): void => {
      setLastEditedAmount('xsoda');
      handleToken1AmountChange(value);
    },
    [handleToken1AmountChange],
  );

  useEffect((): void => {
    if (lastEditedAmount !== 'soda') {
      setSodaInputAmount(convertedSodaAmount);
    }
  }, [convertedSodaAmount, lastEditedAmount]);

  useEffect((): void => {
    setSodaAmount(sodaInputAmount);
  }, [setSodaAmount, sodaInputAmount]);

  useEffect((): void => {
    setXSodaAmount(liquidityToken1Amount);
  }, [liquidityToken1Amount, setXSodaAmount]);

  return {
    sodaAmount: sodaInputAmount,
    xSodaAmount: liquidityToken1Amount,
    handleSodaAmountChange,
    handleXSodaAmountChange,
  };
}
