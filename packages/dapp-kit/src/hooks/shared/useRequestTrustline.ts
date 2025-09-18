import { type SpokeProvider, StellarSpokeProvider, StellarSpokeService, type TxReturnType } from '@sodax/sdk';
import { useMutation, type UseMutationResult, useQueryClient } from '@tanstack/react-query';

/**
 * React hook to request a Stellar trustline for a given token and amount.
 *
 * This hook provides a mutation for requesting a trustline on the Stellar network
 * using the provided SpokeProvider. It is intended for use with StellarSpokeProvider
 * and will throw if used with a non-Stellar provider. Upon success, it invalidates
 * the trustline check query to ensure UI reflects the updated trustline state.
 *
 * @template T - The type of SpokeProvider, defaults to SpokeProvider.
 * @param {string | undefined} token - The Stellar asset code or token address for which to request a trustline.
 * @returns {UseMutationResult<TxReturnType<StellarSpokeProvider, false>, Error, { token: string; amount: bigint; spokeProvider: T }>}
 *   A React Query mutation result object containing:
 *   - `mutate`/`mutateAsync`: Function to trigger the trustline request.
 *   - `data`: The transaction result if successful.
 *   - `error`: Any error encountered during the request.
 *   - `isLoading`: Whether the mutation is in progress.
 *   - Other React Query mutation state.
 *
 * @example
 * ```tsx
 * import { useRequestTrustline } from '@sodax/dapp-kit';
 *
 * const { mutate: requestTrustline, isLoading, error, data } = useRequestTrustline('USDC-G...TOKEN');
 *
 * // To request a trustline:
 * requestTrustline({
 *   token: 'USDC-G...TOKEN',
 *   amount: 10000000n,
 *   spokeProvider: stellarProvider,
 * });
 *
 * if (isLoading) return <span>Requesting trustline...</span>;
 * if (error) return <span>Error: {error.message}</span>;
 * if (data) return <span>Trustline requested! Tx: {data.txHash}</span>;
 * ```
 */

export function useRequestTrustline<T extends SpokeProvider = SpokeProvider>(
  token: string | undefined,
): UseMutationResult<
  TxReturnType<StellarSpokeProvider, false>,
  Error,
  {
    token: string;
    amount: bigint;
    spokeProvider: T;
  }
> {
  const queryClient = useQueryClient();

  return useMutation<
    TxReturnType<StellarSpokeProvider, false>,
    Error,
    {
      token: string;
      amount: bigint;
      spokeProvider: T;
    }
  >({
    mutationFn: async ({
      token,
      amount,
      spokeProvider,
    }: {
      token: string;
      amount: bigint;
      spokeProvider: T;
    }) => {
      if (!spokeProvider || !token || !amount || !(spokeProvider instanceof StellarSpokeProvider)) {
        throw new Error('Spoke provider, token or amount not found');
      }

      return StellarSpokeService.requestTrustline(token, amount, spokeProvider);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['stellar-trustline-check', token] });
    },
  });
}
