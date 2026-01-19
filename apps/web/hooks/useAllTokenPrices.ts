import { useQuery } from '@tanstack/react-query';
import type { XToken } from '@sodax/types';
import { getTokenPrice } from '@/services/price';

/**
 * Hook to fetch prices for multiple tokens using React Query
 * @param tokens - Array of tokens to get prices for
 * @returns Query result with token prices as Record<string, number> where key is `${symbol}-${xChainId}`
 */
export function useAllTokenPrices(tokens: XToken[]) {
  return useQuery({
    queryKey: ['tokenPrices', tokens.map(t => `${t.symbol}-${t.xChainId}`)],
    queryFn: async (): Promise<Record<string, number>> => {
      const pricePromises = tokens.map(async token => {
        const key = `${token.symbol}-${token.xChainId}`;
        const price = await getTokenPrice(token);
        return [key, price] as [string, number];
      });
      const prices = await Promise.all(pricePromises);
      return Object.fromEntries(prices);
    },
    enabled: tokens.length > 0,
    staleTime: 60 * 1000, // 1 minute
    gcTime: 5 * 60 * 1000, // 5 minutes
  });
}
