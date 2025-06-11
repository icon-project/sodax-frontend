import type { XChainId, XToken } from '@sodax/wallet-sdk';
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
 * const { mutateAsync: borrow, isPending, error } = useBorrow(hubToken, spokeChainId);
 * await borrow('100');
 * ```
 *
 * @throws {Error} When:
 *   - spokeProvider is not available
 *   - Transaction execution fails
 */
export function useBorrow(hubToken: XToken, spokeChainId: XChainId): UseMutationResult<BorrowResponse, Error, string> {
  const { sodax } = useSodaxContext();
  const spokeProvider = useSpokeProvider(spokeChainId as SpokeChainId);

  return useMutation<BorrowResponse, Error, string>({
    mutationFn: async (amount: string) => {
      if (!spokeProvider) {
        throw new Error('spokeProvider is not found');
      }

      const response = await sodax.moneyMarket.borrowAndSubmit(
        {
          token: hubToken.address,
          amount: parseUnits(amount, hubToken.decimals),
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
