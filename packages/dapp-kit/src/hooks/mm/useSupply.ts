import type { MoneyMarketError, MoneyMarketSupplyParams, RelayErrorCode, SpokeProvider } from '@sodax/sdk';
import { useMutation } from '@tanstack/react-query';
import { useSodaxContext } from '../shared/useSodaxContext';

interface SupplyResponse {
  ok: true;
  value: [string, string];
}

/**
 * Hook for supplying tokens to the Sodax money market.
 *
 * This hook provides functionality to supply tokens to the money market protocol,
 * handling the entire supply process including transaction creation, submission,
 * and cross-chain communication.
 *
 * @returns A mutation result object with the following properties:
 *   - mutateAsync: Function to execute the supply transaction
 *   - isPending: Boolean indicating if a transaction is in progress
 *   - error: Error object if the last transaction failed, null otherwise
 *
 * @example
 * ```typescript
 * const { mutateAsync: supply, isPending, error } = useSupply();
 * await supply({
 *   params: {
 *     token: '0x...',
 *     amount: parseUnits('100', 18),
 *     action: 'supply',
 *   },
 *   spokeProvider,
 * });
 * ```
 *
 * @throws {Error} When:
 *   - Transaction execution fails
 */
export function useSupply() {
  const { sodax } = useSodaxContext();

  return useMutation<
    SupplyResponse,
    MoneyMarketError<'CREATE_SUPPLY_INTENT_FAILED' | 'SUPPLY_UNKNOWN_ERROR' | RelayErrorCode>,
    { params: MoneyMarketSupplyParams; spokeProvider: SpokeProvider }
  >({
    mutationFn: async ({ params, spokeProvider }) => {
      const response = await sodax.moneyMarket.supply(params, spokeProvider);

      if (!response.ok) {
        throw response.error;
      }

      return response;
    },
  });
}
