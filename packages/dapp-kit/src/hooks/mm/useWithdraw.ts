import type { MoneyMarketError, MoneyMarketWithdrawParams, RelayErrorCode, SpokeProvider } from '@sodax/sdk';
import { useMutation } from '@tanstack/react-query';
import { useSodaxContext } from '../shared/useSodaxContext';

interface WithdrawResponse {
  ok: true;
  value: [string, string];
}

/**
 * Hook for withdrawing supplied tokens from the Sodax money market.
 *
 * This hook provides functionality to withdraw previously supplied tokens from the money market protocol,
 * handling the entire withdrawal process including transaction creation, submission,
 * and cross-chain communication.
 *
 * @returns A mutation result object with the following properties:
 *   - mutateAsync: Function to execute the withdraw transaction
 *   - isPending: Boolean indicating if a transaction is in progress
 *   - error: Error object if the last transaction failed, null otherwise
 *
 * @example
 * ```typescript
 * const { mutateAsync: withdraw, isPending, error } = useWithdraw();
 * await withdraw({
 *   params: {
 *     token: '0x...',
 *     amount: parseUnits('100', 18),
 *     action: 'withdraw',
 *   },
 *   spokeProvider,
 * });
 * ```
 *
 * @throws {Error} When:
 *   - Transaction execution fails
 */
export function useWithdraw() {
  const { sodax } = useSodaxContext();

  return useMutation<
    WithdrawResponse,
    MoneyMarketError<'CREATE_WITHDRAW_INTENT_FAILED' | 'WITHDRAW_UNKNOWN_ERROR' | RelayErrorCode>,
    { params: MoneyMarketWithdrawParams; spokeProvider: SpokeProvider }
  >({
    mutationFn: async ({ params, spokeProvider }) => {
      const response = await sodax.moneyMarket.withdraw(params, spokeProvider);

      if (!response.ok) {
        throw response.error;
      }

      return response;
    },
  });
}
