import type { IntentQuoteRequest } from '@sodax/sdk';
import { useSodaxContext } from './useSodaxContext';
import { useQuery } from '@tanstack/react-query';

export const useQuote = (payload: IntentQuoteRequest | undefined) => {
  const { sodax } = useSodaxContext();
  return useQuery({
    queryKey: [payload],
    queryFn: async () => {
      if (!payload) {
        return undefined;
      }
      const quoteResult = await sodax.solver.getQuote(payload);
      return quoteResult;
    },
    enabled: !!payload,
    refetchInterval: 3000,
  });
};
