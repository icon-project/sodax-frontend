import type { SpokeProvider } from '@sodax/sdk';
import type { XToken } from '@sodax/types';
import { useMutation, type UseMutationResult } from '@tanstack/react-query';
import { parseUnits } from 'viem';
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
 * @param {XToken} spokeToken - The token to repay on the spoke chain. Must be an XToken with valid address and chain information.
 * @param {SpokeProvider} spokeProvider - The spoke provider to use for the repay transaction. Must be a valid SpokeProvider instance.
 *
 * @returns {UseMutationResult<RepayResponse, Error, string>} A mutation result object with the following properties:
 *   - mutateAsync: Function to execute the repay transaction
 *   - isPending: Boolean indicating if a transaction is in progress
 *   - error: Error object if the last transaction failed, null otherwise
 *
 * @example
 * ```typescript
 * const { mutateAsync: repay, isPending, error } = useRepay(spokeToken);
 * await repay('100');
 * ```
 *
 * @throws {Error} When:
 *   - spokeProvider is not available
 *   - Transaction execution fails
 */
export function useRepay(
  spokeToken: XToken,
  spokeProvider: SpokeProvider | undefined,
): UseMutationResult<RepayResponse, Error, string> {
  const { sodax } = useSodaxContext();

  return useMutation<RepayResponse, Error, string>({
    mutationFn: async (amount: string) => {
      if (!spokeProvider) {
        throw new Error('spokeProvider is not found');
      }

      const response = await sodax.moneyMarket.repayAndSubmit(
        {
          token: spokeToken.address,
          amount: parseUnits(amount, spokeToken.decimals),
          action: 'repay',
        },
        spokeProvider,
      );

      if (!response.ok) {
        throw new Error('Failed to repay tokens');
      }

      console.log('Repay transaction submitted:', response);
      return response;
    },
  });
}
