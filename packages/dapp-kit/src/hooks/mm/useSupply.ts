import type { MoneyMarketError, MoneyMarketSupplyParams, RelayErrorCode, SpokeProvider } from '@sodax/sdk';
import { useMutation, type UseMutationResult } from '@tanstack/react-query';
import { useSodaxContext } from '../shared/useSodaxContext';

interface SupplyResponse {
  ok: true;
  value: [string, string];
}

export type UseSupplyParams = {
  params: MoneyMarketSupplyParams;
  spokeProvider: SpokeProvider;
};

/**
 * React hook for supplying tokens to the Sodax money market protocol.
 *
 * Provides a mutation for performing the supply operation using React Query. Useful
 * for UI components needing to manage the full state (pending, error, etc.) of a supply
 * transaction. It handles transaction creation, cross-chain logic, and errors.
 *
 * @returns {UseMutationResult<SupplyResponse, MoneyMarketError<'CREATE_SUPPLY_INTENT_FAILED' | 'SUPPLY_UNKNOWN_ERROR' | RelayErrorCode>, UseSupplyParams>}
 *   Mutation result object from React Query, where:
 *   - mutateAsync(params: UseSupplyParams): Promise<SupplyResponse>
 *     Initiates a supply transaction using the given MoneyMarketSupplyParams and SpokeProvider.
 *   - isPending: boolean indicating if a transaction is in progress.
 *   - error: MoneyMarketError if an error occurred while supplying, otherwise undefined.
 *
 * @example
 * ```typescript
 * const { mutateAsync: supply, isPending, error } = useSupply();
 * await supply({ params: supplyParams, spokeProvider });
 * ```
 *
 * @throws {Error|MoneyMarketError<...>} When:
 *   - `spokeProvider` is not provided or invalid.
 *   - The underlying supply transaction fails.
 */
export function useSupply(): UseMutationResult<
  SupplyResponse,
  MoneyMarketError<'CREATE_SUPPLY_INTENT_FAILED' | 'SUPPLY_UNKNOWN_ERROR' | RelayErrorCode>,
  UseSupplyParams
> {
  const { sodax } = useSodaxContext();

  return useMutation<
    SupplyResponse,
    MoneyMarketError<'CREATE_SUPPLY_INTENT_FAILED' | 'SUPPLY_UNKNOWN_ERROR' | RelayErrorCode>,
    UseSupplyParams
  >({
    mutationFn: async ({ params, spokeProvider }: UseSupplyParams) => {
      if (!spokeProvider) {
        throw new Error('spokeProvider is not found');
      }

      const response = await sodax.moneyMarket.supply(params, spokeProvider);

      if (!response.ok) {
        throw response.error;
      }

      return response;
    },
  });
}
