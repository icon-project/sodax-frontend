import type { MoneyMarketError, MoneyMarketRepayParams, RelayErrorCode, SpokeProvider } from '@sodax/sdk';
import { useMutation } from '@tanstack/react-query';
import { useSodaxContext } from '../shared/useSodaxContext';

interface RepayResponse {
  ok: true;
  value: [string, string];
}

/**
 * Hook for repaying borrowed tokens to the Sodax money market.
 *
 * This hook provides functionality to repay borrowed tokens back to the money market protocol,
 * handling the entire repayment process including transaction creation, submission,
 * and cross-chain communication.
 *
 * @returns A mutation result object with the following properties:
 *   - mutateAsync: Function to execute the repay transaction
 *   - isPending: Boolean indicating if a transaction is in progress
 *   - error: Error object if the last transaction failed, null otherwise
 *
 * @example
 * ```typescript
 * const { mutateAsync: repay, isPending, error } = useRepay();
 * await repay({
 *   params: {
 *     token: '0x...',
 *     amount: parseUnits('100', 18),
 *     action: 'repay',
 *   },
 *   spokeProvider,
 * });
 * ```
 *
 * @throws {Error} When:
 *   - Transaction execution fails
 */
export function useRepay() {
  const { sodax } = useSodaxContext();

  return useMutation<
    RepayResponse,
    MoneyMarketError<'CREATE_REPAY_INTENT_FAILED' | 'REPAY_UNKNOWN_ERROR' | RelayErrorCode>,
    { params: MoneyMarketRepayParams; spokeProvider: SpokeProvider }
  >({
    mutationFn: async ({ params, spokeProvider }) => {
      const response = await sodax.moneyMarket.repay(params, spokeProvider);

      if (!response.ok) {
        throw response.error;
      }

      return response;
    },
  });
}
