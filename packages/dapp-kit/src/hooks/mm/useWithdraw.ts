import type { MoneyMarketError, MoneyMarketWithdrawParams, RelayErrorCode, SpokeProvider } from '@sodax/sdk';
import { useMutation, type UseMutationResult } from '@tanstack/react-query';
import { useSodaxContext } from '../shared/useSodaxContext';

export type UseWithdrawParams = {
  params: MoneyMarketWithdrawParams;
  spokeProvider: SpokeProvider;
};

interface WithdrawResponse {
  ok: true;
  value: [string, string];
}

/**
 * Hook for performing withdrawals from the Sodax money market.
 *
 * This hook exposes a mutation that executes the complete withdrawal logic, including transaction
 * creation and handling cross-chain communication. It leverages React Query's mutation API for
 * easy asynchronous handling and status tracking within UI components.
 *
 * @returns {UseMutationResult<WithdrawResponse, MoneyMarketError<'CREATE_WITHDRAW_INTENT_FAILED' | 'WITHDRAW_UNKNOWN_ERROR' | RelayErrorCode>, UseWithdrawParams>}
 *   Mutation result object, with:
 *   - mutateAsync: (params: UseWithdrawParams) => Promise<WithdrawResponse>
 *       Initiates the withdrawal using the provided params.
 *   - isPending: boolean indicating if a transaction is in progress.
 *   - error: MoneyMarketError if an error occurred while withdrawing, otherwise undefined.
 *
 * @example
 * ```typescript
 * const { mutateAsync: withdraw, isPending, error } = useWithdraw();
 * await withdraw({ params: withdrawParams, spokeProvider });
 * ```
 *
 * @throws {Error} When:
 *   - spokeProvider is not provided or invalid.
 *   - Underlying withdrawal logic fails.
 */
export function useWithdraw(): UseMutationResult<
  WithdrawResponse,
  MoneyMarketError<'CREATE_WITHDRAW_INTENT_FAILED' | 'WITHDRAW_UNKNOWN_ERROR' | RelayErrorCode>,
  UseWithdrawParams
> {
  const { sodax } = useSodaxContext();

  return useMutation<
    WithdrawResponse,
    MoneyMarketError<'CREATE_WITHDRAW_INTENT_FAILED' | 'WITHDRAW_UNKNOWN_ERROR' | RelayErrorCode>,
    UseWithdrawParams
  >({
    mutationFn: async ({ params, spokeProvider }) => {
      if (!spokeProvider) {
        throw new Error('spokeProvider is not found');
      }

      const response = await sodax.moneyMarket.withdraw(params, spokeProvider);

      if (!response.ok) {
        throw response.error;
      }

      return response;
    },
  });
}
