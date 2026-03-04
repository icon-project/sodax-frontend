import { useMutation, type UseMutationResult } from '@tanstack/react-query';
import { useSodaxContext } from '../shared/useSodaxContext';
import type { MoneyMarketBorrowParams, MoneyMarketError, RelayErrorCode, SpokeProvider } from '@sodax/sdk';

interface BorrowResponse {
  ok: true;
  value: [string, string];
}

export type UseBorrowParams = {
  params: MoneyMarketBorrowParams;
  spokeProvider: SpokeProvider;
};

/**
 * React hook for borrowing tokens in the Sodax money market protocol.
 *
 * Encapsulates the async process to initiate a borrow transaction via the money market,
 * handling transaction creation, submission, and cross-chain logic.
 *
 * @returns {UseMutationResult<
 *   BorrowResponse,
 *   MoneyMarketError<'CREATE_BORROW_INTENT_FAILED' | 'BORROW_UNKNOWN_ERROR' | RelayErrorCode>,
 *   UseBorrowParams
 * >} A React Query mutation result object containing:
 *   - mutateAsync: (params: UseBorrowParams) => Promise<BorrowResponse>
 *     Triggers the borrow action. Expects an object with valid borrow params and a `SpokeProvider`.
 *   - isPending: `boolean` if a borrow transaction is in progress.
 *   - error: `MoneyMarketError` if the transaction fails, or `null`.
 *
 * @example
 * ```typescript
 * const { mutateAsync: borrow, isPending, error } = useBorrow();
 * await borrow({ params: borrowParams, spokeProvider });
 * ```
 *
 * @throws {Error} When:
 *   - `spokeProvider` is missing or invalid.
 *   - The underlying borrow transaction fails.
 */
export function useBorrow(): UseMutationResult<
  BorrowResponse,
  MoneyMarketError<'CREATE_BORROW_INTENT_FAILED' | 'BORROW_UNKNOWN_ERROR' | RelayErrorCode>,
  UseBorrowParams
> {
  const { sodax } = useSodaxContext();

  return useMutation<
    BorrowResponse,
    MoneyMarketError<'CREATE_BORROW_INTENT_FAILED' | 'BORROW_UNKNOWN_ERROR' | RelayErrorCode>,
    UseBorrowParams
  >({
    mutationFn: async ({ params, spokeProvider }: UseBorrowParams) => {
      if (!spokeProvider) {
        throw new Error('spokeProvider is not found');
      }

      const response = await sodax.moneyMarket.borrow(params, spokeProvider);

      if (!response.ok) {
        throw response.error;
      }

      return response;
    },
  });
}
