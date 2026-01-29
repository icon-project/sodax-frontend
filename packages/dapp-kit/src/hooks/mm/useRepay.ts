import type { MoneyMarketError, MoneyMarketRepayParams, RelayErrorCode, SpokeProvider } from '@sodax/sdk';
import { useMutation, type UseMutationResult } from '@tanstack/react-query';
import { useSodaxContext } from '../shared/useSodaxContext';

interface RepayResponse {
  ok: true;
  value: [string, string];
}

export type UseRepayParams = {
  params: MoneyMarketRepayParams;
  spokeProvider: SpokeProvider;
};

/**
 * React hook for repaying a borrow in the Sodax money market protocol.
 *
 * This hook encapsulates the process of sending a repay transaction to the money market.
 * It manages the asynchronous operation for repayment, including sending the transaction
 * and error handling.
 *
 * @returns {UseMutationResult<RepayResponse, MoneyMarketError<'CREATE_REPAY_INTENT_FAILED' | 'REPAY_UNKNOWN_ERROR' | RelayErrorCode>, UseRepayParams>} React Query mutation result object containing:
 *   - mutateAsync: (params: UseRepayParams) => Promise<RepayResponse>
 *     Initiates a repay transaction using the given MoneyMarketRepayParams and SpokeProvider.
 *   - isPending: boolean indicating if a transaction is in progress.
 *   - error: MoneyMarketError if an error occurred while repaying, otherwise undefined.
 *
 * @example
 * ```typescript
 * const { mutateAsync: repay, isPending, error } = useRepay();
 * await repay({ params: repayParams, spokeProvider });
 * ```
 *
 * @throws {Error} When:
 *   - `spokeProvider` is missing or invalid.
 *   - The underlying repay transaction fails.
 */
export function useRepay(): UseMutationResult<
  RepayResponse,
  MoneyMarketError<'CREATE_REPAY_INTENT_FAILED' | 'REPAY_UNKNOWN_ERROR' | RelayErrorCode>,
  UseRepayParams
> {
  const { sodax } = useSodaxContext();

  return useMutation<
    RepayResponse,
    MoneyMarketError<'CREATE_REPAY_INTENT_FAILED' | 'REPAY_UNKNOWN_ERROR' | RelayErrorCode>,
    UseRepayParams
  >({
    mutationFn: async ({ params, spokeProvider }: UseRepayParams) => {
      if (!spokeProvider) {
        throw new Error('spokeProvider is not found');
      }

      const response = await sodax.moneyMarket.repay(params, spokeProvider);

      if (!response.ok) {
        throw response.error;
      }

      return response;
    },
  });
}
