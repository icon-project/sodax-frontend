import { useQuery, type UseQueryResult } from '@tanstack/react-query';
import type { RadfiUtxo } from '@sodax/sdk';
import type { IBitcoinWalletProvider } from '@sodax/types';
import { useSodaxContext } from '../shared/useSodaxContext.js';

export function useExpiredUtxos(
  walletProvider: IBitcoinWalletProvider | undefined,
  tradingAddress: string | undefined,
): UseQueryResult<RadfiUtxo[], Error> {
  const { sodax } = useSodaxContext();
  return useQuery<RadfiUtxo[], Error>({
    queryKey: ['expired-utxos', tradingAddress],
    queryFn: async () => {
      if (!walletProvider || !tradingAddress) {
        throw new Error('walletProvider and tradingAddress are required');
      }
      const result = await sodax.spokeService.bitcoinSpokeService.radfi.getExpiredUtxos(tradingAddress);
      return result.data;
    },
    enabled: !!walletProvider && !!tradingAddress,
    refetchInterval: 60_000,
  });
}
