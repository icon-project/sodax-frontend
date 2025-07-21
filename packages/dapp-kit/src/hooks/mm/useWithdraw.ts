import type { SpokeProvider } from '@sodax/sdk';
import type { XToken } from '@sodax/types';
import { useMutation, type UseMutationResult } from '@tanstack/react-query';
import { parseUnits } from 'viem';
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
 * @param {XToken} spokeToken - The token to withdraw from the spoke chain. Must be an XToken with valid address and chain information.
 * @param {SpokeProvider} spokeProvider - The spoke provider to use for the withdraw transaction. Must be a valid SpokeProvider instance.
 *
 * @returns {UseMutationResult<WithdrawResponse, Error, string>} A mutation result object with the following properties:
 *   - mutateAsync: Function to execute the withdraw transaction
 *   - isPending: Boolean indicating if a transaction is in progress
 * @example
 * ```typescript
 * const { mutateAsync: withdraw, isPending, error } = useWithdraw(spokeToken);
 * await withdraw('100');
 * ```
 *
 * @throws {Error} When:
 *   - spokeProvider is not available
 *   - Transaction execution fails
 */
export function useWithdraw(
  spokeToken: XToken,
  spokeProvider: SpokeProvider | undefined,
): UseMutationResult<WithdrawResponse, Error, string> {
  const { sodax } = useSodaxContext();

  return useMutation<WithdrawResponse, Error, string>({
    mutationFn: async (amount: string) => {
      if (!spokeProvider) {
        throw new Error('spokeProvider is not found');
      }

      const response = await sodax.moneyMarket.withdraw(
        {
          token: spokeToken.address,
          // vault token on hub chain decimals is 18
          amount: parseUnits(amount, 18),
          action: 'withdraw',
        },
        spokeProvider,
      );

      if (!response.ok) {
        throw new Error('Failed to withdraw tokens');
      }

      console.log('Withdraw transaction submitted:', response);
      return response;
    },
  });
}
