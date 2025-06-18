import type { XToken } from '@sodax/types';
import { useMutation, type UseMutationResult } from '@tanstack/react-query';
import { parseUnits } from 'viem';
import { useSpokeProvider } from '../provider/useSpokeProvider';
import { useSodaxContext } from '../shared/useSodaxContext';
import type { SpokeChainId } from '@sodax/sdk';
interface BorrowResponse {
  ok: true;
  value: [`0x${string}`, `0x${string}`];
}

/**
 * Hook for borrowing tokens from the Sodax money market.
 *
 * This hook provides functionality to borrow tokens from the money market protocol,
 * handling the entire borrow process including transaction creation, submission,
 * and cross-chain communication.
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
export function useBorrow(spokeToken: XToken): UseMutationResult<BorrowResponse, Error, string> {
  const { sodax } = useSodaxContext();
  const spokeProvider = useSpokeProvider(spokeToken.xChainId as SpokeChainId);

  return useMutation<BorrowResponse, Error, string>({
    mutationFn: async (amount: string) => {
      if (!spokeProvider) {
        throw new Error('spokeProvider is not found');
      }

      const response = await sodax.moneyMarket.borrowAndSubmit(
        {
          token: spokeToken.address,
          amount: parseUnits(amount, 18),
        },
        spokeProvider,
      );

      if (!response.ok) {
        console.log('Failed to borrow tokens', response);
        throw new Error('Failed to borrow tokens');
      }

      console.log('Borrow transaction submitted:', response);
      return response;
    },
  });
}
