import { useQuery } from '@tanstack/react-query';
import type { XToken } from '@sodax/types';
import { getTokenPrice } from '@/services/price';
import { useMemo } from 'react';

/**
 * Hook to fetch token price using React Query
 * @param token - The token to get price for
 */
export function useTokenPrice(token: XToken) {
  return useQuery({
    queryKey: ['tokenPrice', token],
    queryFn: async (): Promise<number> => {
      return await getTokenPrice(token);
    },
    enabled: !!token,
    staleTime: 60 * 1000, // 1 minute
    gcTime: 5 * 60 * 1000, // 5 minutes
    retry: 2,
  });
}

export function useTokenUsdValue(token: XToken, amount: string) {
  const { data: price } = useTokenPrice(token);

  return useMemo(() => {
    return price ? price * Number(amount) : 0;
  }, [price, amount]);
}
