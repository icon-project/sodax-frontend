import type { MoneyMarketSupplyParams, SpokeProvider } from '@sodax/sdk';
import type { XToken } from '@sodax/types';
import { useMutation, type UseMutationResult } from '@tanstack/react-query';
import { parseUnits } from 'viem';
import { useSodaxContext } from '../shared/useSodaxContext';

interface SupplyResponse {
  ok: true;
  value: [string, string];
}

type SupplyParams = string | MoneyMarketSupplyParams;
/**
 * Hook for supplying tokens to the Sodax money market.
 *
 * This hook provides functionality to supply tokens to the money market protocol,
 * handling the entire supply process including transaction creation, submission,
 * and cross-chain communication.
 *
 * @param {XToken} spokeToken - The token to supply on the spoke chain. Must be an XToken with valid address and chain information.
 * @param {SpokeProvider} spokeProvider - The spoke provider to use for the supply transaction. Must be a valid SpokeProvider instance.
 *
 * @returns {UseMutationResult<SupplyResponse, Error, string>} A mutation result object with the following properties:
 *   - mutateAsync: Function to execute the supply transaction
 *   - isPending: Boolean indicating if a transaction is in progress
 *   - error: Error object if the last transaction failed, null otherwise
 *
 * @example
 * ```typescript
 * const { mutateAsync: supply, isPending, error } = useSupply(spokeToken);
 * await supply('100');
 * ```
 *
 * @throws {Error} When:
 *   - spokeProvider is not available
 */
export function useSupply(
  spokeToken: XToken,
  spokeProvider: SpokeProvider | undefined,
): UseMutationResult<SupplyResponse, Error, SupplyParams> {
  const { sodax } = useSodaxContext();

  return useMutation<SupplyResponse, Error, SupplyParams>({
    mutationFn: async (param: SupplyParams) => {
      if (!spokeProvider) {
        throw new Error('spokeProvider is not found');
      }

      const response = await sodax.moneyMarket.supply(
        typeof param === 'string' ? {
          token: spokeToken.address,
          amount: parseUnits(param, spokeToken.decimals),
          action: 'supply',
        } : param,
        spokeProvider,
      );

      if (!response.ok) {
        throw new Error('Failed to supply tokens');
      }

      console.log('Supply transaction submitted:', response);
      return response;
    },
  });
}
