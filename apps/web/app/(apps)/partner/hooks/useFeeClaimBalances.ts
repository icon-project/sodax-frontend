import { useSodaxContext } from '@sodax/dapp-kit';
import type { Address } from '@sodax/types';
import { useQuery } from '@tanstack/react-query';
import { enrichBalancesWithUsdPrices } from '../utils/enrichBalancesWithUsdPrices';
import type { AssetBalance } from '@sodax/sdk';

/**
 * Fetches raw partner fee balances from the SDK.
 *
 * WHAT IT DOES:
 * - Calls the Sodax SDK to get all fee balances for a partner address
 * - Returns balances grouped by token + chain (as the SDK provides)
 *
 * WHAT IT DOES NOT DO:
 * - No formatting
 * - No minimum checks
 * - No UI logic
 *
 * Think of this as:
 * "Give me everything the blockchain knows about partner fees."
 */
export type AssetBalanceWithUsd = AssetBalance & {
  usdPrice?: number | null;
};

export function useFeeClaimBalances(address?: Address) {
  const { sodax } = useSodaxContext();

  return useQuery<Map<string, AssetBalanceWithUsd>>({
    queryKey: ['feeClaimBalances', address],
    queryFn: async () => {
      if (!address) throw new Error('Address is required');
      if (!sodax) throw new Error('Sodax context not initialized');

      const result = await sodax.partners.feeClaim.fetchAssetsBalances({
        address,
      });

      if (!result.ok) {
        console.error('❌ SDK Error:', result.error);
        throw result.error;
      }
      return enrichBalancesWithUsdPrices(result.value);
    },
    enabled: !!sodax && !!address,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    staleTime: 60_000,
  });
}
