import type { SolverErrorResponse, SolverIntentQuoteRequest, SolverIntentQuoteResponse, Result } from '@sodax/sdk';
import { useSodaxContext } from '../shared/useSodaxContext';
import { useQuery, type UseQueryResult } from '@tanstack/react-query';
import { useMemo } from 'react';

/**
 * Hook for fetching a quote for an intent-based swap.
 *
 * This hook provides real-time quote data for an intent-based swap.
 *
 * @param {SolverIntentQuoteRequest | undefined} payload - The intent quote request parameters. If undefined, the query will be disabled.
 *
 * @returns {UseQueryResult<Result<SolverIntentQuoteResponse, SolverErrorResponse> | undefined>} A query result object containing:
 *   - data: The quote result from the solver
 *   - isLoading: Boolean indicating if the quote is being fetched
 *   - error: Error object if the quote request failed
 *   - refetch: Function to manually trigger a quote refresh
 *
 * @example
 * ```typescript
 * const { data: quote, isLoading } = useQuote({
 *   token_src: '0x...',
 *   token_src_blockchain_id: '1',
 *   token_dst: '0x...',
 *   token_dst_blockchain_id: '2',
 *   amount: '1000000000000000000',
 *   quote_type: 'exact_input',
 * });
 *
 * if (isLoading) return <div>Loading quote...</div>;
 * if (quote) {
 *   console.log('Quote received:', quote);
 * }
 * ```
 *
 * @remarks
 * - The quote is automatically refreshed every 3 seconds
 * - The query is disabled when payload is undefined
 * - Uses React Query for efficient caching and state management
 */
export const useQuote = (
  payload: SolverIntentQuoteRequest | undefined,
): UseQueryResult<Result<SolverIntentQuoteResponse, SolverErrorResponse> | undefined> => {
  const { sodax } = useSodaxContext();

  // Create a serializable query key by converting BigInt to string
  const queryKey = useMemo(() => {
    if (!payload) return ['quote', undefined];
    return [
      'quote',
      {
        ...payload,
        amount: payload.amount.toString(),
      },
    ];
  }, [payload]);

  return useQuery({
    queryKey,
    queryFn: async () => {
      if (!payload) {
        return undefined;
      }
      return sodax.swaps.getQuote(payload);
    },
    enabled: !!payload,
    refetchInterval: 3000,
  });
};
