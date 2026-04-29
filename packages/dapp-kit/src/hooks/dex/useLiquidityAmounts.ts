import { useState, useEffect, useCallback, useMemo } from 'react';
import { ClService, type PoolData } from '@sodax/sdk';

export type UseLiquidityAmountsResult = {
  liquidityToken0Amount: string;
  liquidityToken1Amount: string;
  lastEditedToken: 'token0' | 'token1' | null;
  setLiquidityToken0Amount: (value: string) => void;
  setLiquidityToken1Amount: (value: string) => void;
  handleToken0AmountChange: (value: string) => void;
  handleToken1AmountChange: (value: string) => void;
};

/**
 * Hook for calculating concentrated-liquidity amounts based on the price range. Pure state +
 * math; no SDK calls beyond the static {@link ClService} helpers.
 */
export function useLiquidityAmounts(
  minPrice: string,
  maxPrice: string,
  poolData: PoolData | null,
): UseLiquidityAmountsResult {
  const [liquidityToken0Amount, setLiquidityToken0Amount] = useState<string>('');
  const [liquidityToken1Amount, setLiquidityToken1Amount] = useState<string>('');
  const [lastEditedToken, setLastEditedToken] = useState<'token0' | 'token1' | null>(null);

  const { minPriceNum, maxPriceNum, isValidPriceRange } = useMemo(() => {
    const parsedMin = Number.parseFloat(minPrice);
    const parsedMax = Number.parseFloat(maxPrice);
    const isValid = parsedMin > 0 && parsedMax > 0 && parsedMin < parsedMax;
    return { minPriceNum: parsedMin, maxPriceNum: parsedMax, isValidPriceRange: isValid };
  }, [minPrice, maxPrice]);

  const { tickLower, tickUpper, currentTick } = useMemo(() => {
    if (!poolData || !isValidPriceRange) {
      return { tickLower: null, tickUpper: null, currentTick: null };
    }
    try {
      const lower = ClService.priceToTick(minPriceNum, poolData.token0, poolData.token1, poolData.tickSpacing);
      const upper = ClService.priceToTick(maxPriceNum, poolData.token0, poolData.token1, poolData.tickSpacing);
      return { tickLower: lower, tickUpper: upper, currentTick: BigInt(poolData.currentTick) };
    } catch (err) {
      console.error('Failed to calculate ticks:', err);
      return { tickLower: null, tickUpper: null, currentTick: null };
    }
  }, [minPriceNum, maxPriceNum, poolData, isValidPriceRange]);

  const handleToken0AmountChange = useCallback(
    (value: string): void => {
      setLiquidityToken0Amount(value);
      setLastEditedToken('token0');

      if (!value || !poolData || !tickLower || !tickUpper || !currentTick) return;
      const amount0 = Number.parseFloat(value);
      if (amount0 <= 0 || !isValidPriceRange) return;

      try {
        const amount0BigInt = BigInt(Math.floor(amount0 * 10 ** poolData.token0.decimals));
        const amount1BigInt = ClService.calculateAmount1FromAmount0(
          amount0BigInt,
          tickLower,
          tickUpper,
          currentTick,
          poolData.sqrtPriceX96,
        );
        const amount1 = Number(amount1BigInt) / 10 ** poolData.token1.decimals;
        setLiquidityToken1Amount(amount1.toFixed(6));
      } catch (err) {
        console.error('Failed to calculate token1 amount:', err);
      }
    },
    [poolData, tickLower, tickUpper, currentTick, isValidPriceRange],
  );

  const handleToken1AmountChange = useCallback(
    (value: string): void => {
      setLiquidityToken1Amount(value);
      setLastEditedToken('token1');

      if (!value || !poolData || !tickLower || !tickUpper || !currentTick) return;
      const amount1 = Number.parseFloat(value);
      if (amount1 <= 0 || !isValidPriceRange) return;

      try {
        const amount1BigInt = BigInt(Math.floor(amount1 * 10 ** poolData.token1.decimals));
        const amount0BigInt = ClService.calculateAmount0FromAmount1(
          amount1BigInt,
          tickLower,
          tickUpper,
          currentTick,
          poolData.sqrtPriceX96,
        );
        const amount0 = Number(amount0BigInt) / 10 ** poolData.token0.decimals;
        setLiquidityToken0Amount(amount0.toFixed(6));
      } catch (err) {
        console.error('Failed to calculate token0 amount:', err);
      }
    },
    [poolData, tickLower, tickUpper, currentTick, isValidPriceRange],
  );

  useEffect(() => {
    if (!poolData || !tickLower || !tickUpper || !lastEditedToken || !isValidPriceRange) return;
    if (lastEditedToken === 'token0' && liquidityToken0Amount) {
      handleToken0AmountChange(liquidityToken0Amount);
    } else if (lastEditedToken === 'token1' && liquidityToken1Amount) {
      handleToken1AmountChange(liquidityToken1Amount);
    }
  }, [
    poolData,
    lastEditedToken,
    liquidityToken0Amount,
    liquidityToken1Amount,
    handleToken0AmountChange,
    handleToken1AmountChange,
    tickLower,
    tickUpper,
    isValidPriceRange,
  ]);

  return {
    liquidityToken0Amount,
    liquidityToken1Amount,
    lastEditedToken,
    setLiquidityToken0Amount,
    setLiquidityToken1Amount,
    handleToken0AmountChange,
    handleToken1AmountChange,
  };
}
