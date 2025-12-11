import type { MoneyMarketBorrowParams, MoneyMarketError, RelayErrorCode, SpokeProvider } from '@sodax/sdk';
import { useMutation } from '@tanstack/react-query';
import { useSodaxContext } from '../shared/useSodaxContext';

interface BorrowResponse {
  ok: true;
  value: [string, string];
}

/**
 * Hook for borrowing tokens from the Sodax money market.
 *
 * This hook provides functionality to borrow tokens from the money market protocol,
 * handling the entire borrow process including transaction creation, submission,
 * and cross-chain communication.
 *
 * @returns A mutation result object with the following properties:
 *   - mutateAsync: Function to execute the borrow transaction
 *   - isPending: Boolean indicating if a transaction is in progress
 *   - error: Error object if the last transaction failed, null otherwise
 *
 * @example
 * ```typescript
 * const { mutateAsync: borrow, isPending, error } = useBorrow();
 * await borrow({
 *   params: {
 *     token: '0x...',
 *     amount: parseUnits('100', 18),
 *     action: 'borrow',
 *   },
 *   spokeProvider,
 * });
 * ```
 *
 * @throws {Error} When:
 *   - Transaction execution fails
 */
export function useBorrow() {
  const { sodax } = useSodaxContext();

  return useMutation<
    BorrowResponse,
    MoneyMarketError<'CREATE_BORROW_INTENT_FAILED' | 'BORROW_UNKNOWN_ERROR' | RelayErrorCode>,
    { params: MoneyMarketBorrowParams; spokeProvider: SpokeProvider }
  >({
    mutationFn: async ({ params, spokeProvider }) => {
      const response = await sodax.moneyMarket.borrow(params, spokeProvider);

      if (!response.ok) {
        throw response.error;
      }

      return response;
    },
  });
}
