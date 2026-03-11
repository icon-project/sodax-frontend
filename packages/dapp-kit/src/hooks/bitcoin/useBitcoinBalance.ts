import { useQuery, type UseQueryResult } from '@tanstack/react-query';

/**
 * Hook to fetch BTC balance for any Bitcoin address (personal or trading wallet).
 * Queries UTXOs from mempool.space API and sums confirmed values.
 *
 * @param {string | undefined} address - Bitcoin address to check balance for
 * @param {string} rpcUrl - Bitcoin RPC URL (default: mempool.space)
 * @returns {UseQueryResult} Query result with balance in satoshis as bigint
 *
 * @example
 * ```tsx
 * const { data: balance, isLoading } = useBitcoinBalance(walletAddress);
 * // balance = 1_500_000n (satoshis)
 *
 * // Also works for trading wallet address:
 * const { data: tradingBalance } = useBitcoinBalance(tradingWallet?.tradingAddress);
 * ```
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

      const utxos: Array<{ value: number; status: { confirmed: boolean } }> = await response.json();
      const confirmedBalance = utxos
        .filter(utxo => utxo.status.confirmed)
        .reduce((sum, utxo) => sum + utxo.value, 0);

      return BigInt(confirmedBalance);
    },
    enabled: !!address,
  });
}
