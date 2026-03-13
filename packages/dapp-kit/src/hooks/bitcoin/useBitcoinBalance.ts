import { useQuery, type UseQueryResult } from '@tanstack/react-query';

/**
 * Hook to fetch BTC balance for any Bitcoin address.
 * Sums all UTXOs (confirmed + unconfirmed) from mempool.space API.
 *
 * The UTXO set already excludes spent outputs (even from unconfirmed txs),
 * so the total is always the correct spendable balance.
 */
export function useBitcoinBalance(
  address: string | undefined,
  rpcUrl = 'https://mempool.space/api',
): UseQueryResult<bigint, Error> {
  return useQuery<bigint, Error>({
    queryKey: ['btc-balance', address],
    queryFn: async () => {
      if (!address) return 0n;

      const response = await fetch(`${rpcUrl}/address/${address}/utxo`);
      if (!response.ok) return 0n;

      const utxos: Array<{ value: number }> = await response.json();
      return BigInt(utxos.reduce((sum, utxo) => sum + utxo.value, 0));
    },
    enabled: !!address,
  });
}
