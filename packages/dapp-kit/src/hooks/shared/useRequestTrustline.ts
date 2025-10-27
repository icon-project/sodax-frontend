import { type SpokeProvider, StellarSpokeProvider, StellarSpokeService, type TxReturnType } from '@sodax/sdk';
import { useQueryClient } from '@tanstack/react-query';
import { useCallback, useState } from 'react';

/**
 * React hook to request a Stellar trustline for a given token and amount.
 *
 * This hook provides a callback function for requesting a trustline on the Stellar network
 * using the provided SpokeProvider. It is intended for use with StellarSpokeProvider
 * and will throw if used with a non-Stellar provider. Upon success, it invalidates
 * the trustline check query to ensure UI reflects the updated trustline state.
 *
 * @template T - The type of SpokeProvider, defaults to SpokeProvider.
 * @param {string | undefined} token - The Stellar asset code or token address for which to request a trustline.
 * @returns {Object} An object containing:
 *   - `requestTrustline`: Function to trigger the trustline request.
 *   - `isLoading`: Whether the request is in progress.
 *   - `isRequested`: Whether a trustline has been successfully requested.
 *   - `error`: Any error encountered during the request.
 *   - `data`: The transaction result if successful.
 *
 * @example
 * ```tsx
 * import { useRequestTrustline } from '@sodax/dapp-kit';
 *
 * const { requestTrustline, isLoading, isRequested, error, data } = useRequestTrustline('USDC-G...TOKEN');
 *
 * // To request a trustline:
 * await requestTrustline({
 *   token: 'USDC-G...TOKEN',
 *   amount: 10000000n,
 *   spokeProvider: stellarProvider,
 * });
 *
 * if (isLoading) return <span>Requesting trustline...</span>;
 * if (error) return <span>Error: {error.message}</span>;
 * if (isRequested) return <span>Trustline requested! Tx: {data?.txHash}</span>;
 * ```
 */

export function useRequestTrustline<T extends SpokeProvider = SpokeProvider>(
  token: string | undefined,
): {
  requestTrustline: (params: {
    token: string;
    amount: bigint;
    spokeProvider: T;
  }) => Promise<TxReturnType<StellarSpokeProvider, false>>;
  isLoading: boolean;
  isRequested: boolean;
  error: Error | null;
  data: TxReturnType<StellarSpokeProvider, false> | null;
} {
  const queryClient = useQueryClient();
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isRequested, setIsRequested] = useState<boolean>(false);
  const [error, setError] = useState<Error | null>(null);
  const [data, setData] = useState<TxReturnType<StellarSpokeProvider, false> | null>(null);

  const requestTrustline = useCallback(
    async ({
      token,
      amount,
      spokeProvider,
    }: {
      token: string;
      amount: bigint;
      spokeProvider: T;
    }): Promise<TxReturnType<StellarSpokeProvider, false>> => {
      if (!spokeProvider || !token || !amount || !(spokeProvider instanceof StellarSpokeProvider)) {
        const error = new Error('Spoke provider, token or amount not found');
        setError(error);
        throw error;
      }

      setIsLoading(true);
      setError(null);

      try {
        const result = await StellarSpokeService.requestTrustline(token, amount, spokeProvider);
        setData(result);
        setIsRequested(true);
        queryClient.invalidateQueries({ queryKey: ['stellar-trustline-check', token] });
        return result;
      } catch (err) {
        const error = err instanceof Error ? err : new Error('Unknown error occurred');
        setError(error);
        throw error;
      } finally {
        setIsLoading(false);
      }
    },
    [queryClient],
  );

  return {
    requestTrustline,
    isLoading,
    isRequested,
    error,
    data,
  };
}
