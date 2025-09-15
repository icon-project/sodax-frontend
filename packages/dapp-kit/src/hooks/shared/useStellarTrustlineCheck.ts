import { STELLAR_MAINNET_CHAIN_ID, StellarSpokeProvider, StellarSpokeService } from '@sodax/sdk';
import type { SpokeChainId, SpokeProvider } from '@sodax/sdk';
import { useQuery, type UseQueryResult } from '@tanstack/react-query';

export function useStellarTrustlineCheck<T extends SpokeProvider = SpokeProvider>(
  token: string | undefined,
  amount: bigint | undefined,
  spokeProvider: T | undefined,
  chainId: SpokeChainId | undefined,
): UseQueryResult<boolean, Error> {
  return useQuery({
    queryKey: ['stellar-trustline-check', token],
    queryFn: async () => {
      if (chainId !== STELLAR_MAINNET_CHAIN_ID) {
        return true;
      }
      if (!spokeProvider || !token || !amount || !(spokeProvider instanceof StellarSpokeProvider)) {
        console.error(
          'Spoke provider, token or amount not found. Details: spokeProvider:',
          spokeProvider,
          'token:',
          token,
          'amount:',
          amount,
        );
        return false;
      }
      const response = await StellarSpokeService.hasSufficientTrustline(token, amount, spokeProvider);

      return response;
    },
    enabled: !!spokeProvider && !!token && !!amount,
  });
}
