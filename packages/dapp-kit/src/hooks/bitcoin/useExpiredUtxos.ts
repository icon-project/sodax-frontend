import { useQuery, type UseQueryResult } from '@tanstack/react-query';
import type { BitcoinSpokeProvider, RadfiUtxo } from '@sodax/sdk';

/**
 * Hook to fetch expired UTXOs for a trading wallet address.
 * UTXOs that are expired or within 2 weeks of expiry are considered invalid for trading
 * and need to be renewed via the Radfi renew-utxo flow.
 */
export function useExpiredUtxos(
  spokeProvider: BitcoinSpokeProvider | undefined,
  tradingAddress: string | undefined,
): UseQueryResult<RadfiUtxo[], Error> {
  return useQuery<RadfiUtxo[], Error>({
    queryKey: ['expired-utxos', tradingAddress],
    queryFn: async () => {
      if (!spokeProvider || !tradingAddress) {
        throw new Error('spokeProvider and tradingAddress are required');
      }
      const result = await spokeProvider.radfi.getExpiredUtxos(tradingAddress);
      return result.data;
    },
    enabled: !!spokeProvider && !!tradingAddress,
    refetchInterval: 60_000, // refetch every minute
  });
}
