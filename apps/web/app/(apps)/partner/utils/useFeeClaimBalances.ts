import { useSodaxContext } from '@sodax/dapp-kit';
import type { Address } from '@sodax/types';
import { useQuery } from '@tanstack/react-query';

export function useFeeClaimBalances(address?: Address) {
  const { sodax } = useSodaxContext();

  return useQuery({
    queryKey: ['feeClaimBalances', address],
    queryFn: async () => {
      // TypeScript now knows address is `0x${string}` or undefined
      if (!address) throw new Error('Address is required');
      if (!sodax) throw new Error('Sodax context not initialized');

      // Now matches the FetchAssetsBalancesParams requirements
      const result = await sodax.partners.feeClaim.fetchAssetsBalances({
        address,
      });

      if (!result.ok) throw result.error;
      return result.value;
    },
    enabled: !!sodax && !!address,
  });
}
