import { useQuery, type UseQueryResult } from '@tanstack/react-query';
import type { BitcoinSpokeProvider, RadfiWalletBalance } from '@sodax/sdk';

/**
 * Hook to fetch trading wallet balance from Radfi API.
 * Returns confirmed + pending satoshi balances.
 */
export function useTradingWalletBalance(
  spokeProvider: BitcoinSpokeProvider | undefined,
  tradingAddress: string | undefined,
): UseQueryResult<RadfiWalletBalance, Error> {
  return useQuery<RadfiWalletBalance, Error>({
    queryKey: ['trading-wallet-balance', tradingAddress],
    queryFn: () => {
      if (!spokeProvider || !tradingAddress) {
        throw new Error('spokeProvider and tradingAddress are required');
      }
      return spokeProvider.radfi.getBalance(tradingAddress);
    },
    enabled: !!spokeProvider && !!tradingAddress,
  });
}
