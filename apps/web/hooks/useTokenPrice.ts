// apps/web/hooks/useTokenPrice.ts
import { useState, useEffect } from 'react';
import type { XToken } from '@sodax/types';
import { getCachedTokenPrice, calculateUSDValue } from '@/services/price';

interface UseTokenPriceReturn {
  price: number;
  usdValue: number;
  isLoading: boolean;
  error: string | null;
}

/**
 * Hook to fetch token price and calculate USD value
 * @param token - The token to get price for
 * @param amount - The amount to calculate USD value for
 * @returns Object containing price, USD value, loading state, and error
 */
export function useTokenPrice(token: XToken, amount = '0'): UseTokenPriceReturn {
  const [price, setPrice] = useState(0);
  const [usdValue, setUsdValue] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchPrice = async (): Promise<void> => {
      if (!token?.symbol) {
        setPrice(0);
        setUsdValue(0);
        return;
      }

      setIsLoading(true);
      setError(null);

      try {
        const tokenPrice = await getCachedTokenPrice(token);
        setPrice(tokenPrice);

        if (amount && amount !== '0') {
          const calculatedUsdValue = await calculateUSDValue(token, amount);
          setUsdValue(calculatedUsdValue);
        } else {
          setUsdValue(0);
        }
      } catch (err) {
        console.error('Error fetching token price:', err);
        setError(err instanceof Error ? err.message : 'Failed to fetch price');
        setPrice(0);
        setUsdValue(0);
      } finally {
        setIsLoading(false);
      }
    };

    fetchPrice();
  }, [token, amount]);

  return {
    price,
    usdValue,
    isLoading,
    error,
  };
}
