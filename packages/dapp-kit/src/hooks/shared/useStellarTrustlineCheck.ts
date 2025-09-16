import { STELLAR_MAINNET_CHAIN_ID, StellarSpokeProvider, StellarSpokeService } from '@sodax/sdk';
import type { SpokeChainId, SpokeProvider } from '@sodax/sdk';
import { useQuery, type UseQueryResult } from '@tanstack/react-query';

/**
 * React hook to check if a Stellar account has a sufficient trustline for a given token and amount.
 *
 * This hook queries the Stellar network (via the provided SpokeProvider) to determine
 * whether the account has established a trustline for the specified token and if the trustline
 * is sufficient for the intended amount. It is useful for gating UI actions that require
 * a trustline to be present and funded.
 *
 * @template T - The type of SpokeProvider, defaults to SpokeProvider.
 * @param {string | undefined} token - The Stellar asset code or token address to check the trustline for.
 * @param {bigint | undefined} amount - The minimum amount required for the trustline.
 * @param {T | undefined} spokeProvider - The provider instance for interacting with the Stellar network.
 * @param {SpokeChainId | undefined} chainId - The chain ID to determine if the check should be performed (only on Stellar mainnet).
 * @returns {UseQueryResult<boolean, Error>} A React Query result object containing:
 *   - `data`: `true` if the trustline exists and is sufficient, `false` otherwise.
 *   - `error`: Any error encountered during the check.
 *   - `isLoading`: Whether the query is in progress.
 *   - Other React Query state.
 *
 * @example
 * ```tsx
 * import { useStellarTrustlineCheck } from '@sodax/dapp-kit';
 *
 * const { data: hasTrustline, isLoading, error } = useStellarTrustlineCheck(
 *   'USDC-G...TOKEN',
 *   10000000n,
 *   stellarProvider,
 *   'stellar'
 * );
 *
 * if (isLoading) return <span>Checking trustline...</span>;
 * if (error) return <span>Error: {error.message}</span>;
 * if (!hasTrustline) return <span>Trustline not established or insufficient.</span>;
 * return <span>Trustline is sufficient!</span>;
 * ```
 */

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
