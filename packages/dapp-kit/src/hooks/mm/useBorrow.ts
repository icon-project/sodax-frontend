import type { SpokeChainId, XToken } from '@sodax/types';
import { useMutation, type UseMutationResult } from '@tanstack/react-query';
import { parseUnits } from 'viem';
import { useSodaxContext } from '../shared/useSodaxContext';
import type { SpokeProvider } from '@sodax/sdk';
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
 * @param {XToken} spokeToken - The token to borrow from the spoke chain. Must be an XToken with valid address and chain information.
 * @param {SpokeProvider} spokeProvider - The spoke provider to use for the borrow transaction. Must be a valid SpokeProvider instance.
 *
 * @returns {UseMutationResult<BorrowResponse, Error, string>} A mutation result object with the following properties:
 *   - mutateAsync: Function to execute the borrow transaction
 *   - isPending: Boolean indicating if a transaction is in progress
 *   - error: Error object if the last transaction failed, null otherwise
 *
 * @example
 * ```typescript
 * const { mutateAsync: borrow, isPending, error } = useBorrow(spokeToken);
 * await borrow('100');
 * ```
 *
 * @throws {Error} When:
 *   - spokeProvider is not available
 *   - Transaction execution fails
 */
export function useBorrow(
  spokeToken: XToken,
  spokeProvider: SpokeProvider | undefined,
): UseMutationResult<BorrowResponse, Error, string> {
  const { sodax } = useSodaxContext();

  return useMutation<BorrowResponse, Error, string>({
    mutationFn: async (amount: string, toChainId?: SpokeChainId, toAddress?: string) => {
      if (!spokeProvider) {
        throw new Error('spokeProvider is not found');
      }

      const response = await sodax.moneyMarket.borrow(
        {
          token: spokeToken.address,
          amount: parseUnits(amount, 18),
          action: 'borrow',
          toChainId: toChainId,
          toAddress: toAddress,
        },
        spokeProvider,
      );

      if (!response.ok) {
        throw new Error('Failed to borrow tokens');
      }

      console.log('Borrow transaction submitted:', response);
      return response;
    },
  });
}
